'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Camera, 
    MapPin, 
    Navigation, 
    CheckCircle2, 
    RefreshCw, 
    Send,
    Shield,
    X,
    Play,
    Flag,
    Clock,
    Upload,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
    getCheckpoints, 
    savePatrolLog, 
    syncPatrolLogs, 
    startPatrolSession, 
    endPatrolSession, 
    getActiveSession 
} from '@/actions/patrol';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ZoomableImage } from '@/components/ImageModal';

interface Checkpoint {
    id: string;
    name: string;
    location: string | null;
    latitude: number;
    longitude: number;
}

interface PatrolSession {
    id: string;
    userId: string;
    startTime: string;
    endTime: string | null;
    status: string;
    logs: { checkpointId: string }[];
}

interface OfflineLog {
    userId: string;
    checkpointId: string;
    sessionId?: string;
    status: string;
    notes?: string;
    image: string;
    latitude: number;
    longitude: number;
    createdAt: string;
}

interface PatrolClientProps {
    userId: string;
}

export default function PatrolClient({ userId }: PatrolClientProps) {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState<{ lat: number, lon: number } | null>(null);
    const [activeSession, setActiveSession] = useState<PatrolSession | null>(null);
    const [checkedPointIds, setCheckedPointIds] = useState<string[]>([]);
    
    // Form states
    const [selectedCp, setSelectedCp] = useState<Checkpoint | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [notes, setNotes] = useState('Lokasi aman dan kondusif.');
    const [status, setStatus] = useState('AMAN');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [offlineQueue, setOfflineQueue] = useState<OfflineLog[]>([]);
    const [isOnline, setIsOnline] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const trackRef = useRef<MediaStreamTrack | null>(null);
    const watchId = useRef<number | null>(null);
    
    const [zoomValue, setZoomValue] = useState(1);
    const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);

    const fetchCheckpoints = React.useCallback(async () => {
        const result = await getCheckpoints();
        if (result.success && result.data) {
            setCheckpoints(result.data as Checkpoint[]);
        }
    }, []);

    const fetchActiveSession = React.useCallback(async () => {
        const result = await getActiveSession();
        if (result.success && result.data) {
            const session = result.data as any;
            setActiveSession(session);
            setCheckedPointIds(session.logs.map((l: any) => l.checkpointId));
        }
    }, []);

    const startLocationWatch = React.useCallback(() => {
        if (!navigator.geolocation) return;
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            },
            (_err) => console.error(_err),
            { enableHighAccuracy: true }
        );
    }, []);

    const loadOfflineQueue = React.useCallback(() => {
        const saved = localStorage.getItem('patrol_offline_queue');
        if (saved) {
            try {
                setOfflineQueue(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading queue', e);
            }
        }
    }, []);

    const init = React.useCallback(async () => {
        setIsLoading(true);
        await Promise.all([
            fetchCheckpoints(),
            fetchActiveSession(),
            startLocationWatch()
        ]);
        loadOfflineQueue();
        setIsLoading(false);
    }, [fetchCheckpoints, fetchActiveSession, startLocationWatch, loadOfflineQueue]);

    // Polling for session updates (sync between officers)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeSession && isOnline) {
            interval = setInterval(() => {
                fetchActiveSession();
            }, 10000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeSession, isOnline, fetchActiveSession]);

    useEffect(() => {
        init();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [init]);

    const handleStartSession = async () => {
        setIsSubmitting(true);
        const result = await startPatrolSession(userId);
        if (result.success && result.data) {
            setActiveSession(result.data as unknown as PatrolSession);
            toast.success('Putaran patroli dimulai');
        } else {
            toast.error(result.message || 'Gagal memulai sesi');
        }
        setIsSubmitting(false);
    };

    const handleEndSession = async () => {
        if (!activeSession) return;
        if (checkedPointIds.length < checkpoints.length) {
            if (!confirm(`Baru ${checkedPointIds.length}/${checkpoints.length} titik yang dicek. Yakin ingin mengakhiri putaran?`)) return;
        }

        setIsSubmitting(true);
        const result = await endPatrolSession(activeSession.id);
        if (result.success) {
            setActiveSession(null);
            setCheckedPointIds([]);
            toast.success('Putaran patroli selesai');
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    const addToQueue = (data: Omit<OfflineLog, 'createdAt'>) => {
        const newQueue = [...offlineQueue, { ...data, createdAt: new Date().toISOString() }];
        setOfflineQueue(newQueue);
        localStorage.setItem('patrol_offline_queue', JSON.stringify(newQueue));
        toast.info('Tersimpan secara lokal (Offline)');
    };

    const syncQueue = async () => {
        if (offlineQueue.length === 0 || !isOnline) return;
        setIsSubmitting(true);
        const result = await syncPatrolLogs(offlineQueue);
        if (result.success) {
            toast.success(`${result.count} laporan berhasil disinkronisasi`);
            setOfflineQueue([]);
            localStorage.removeItem('patrol_offline_queue');
            init(); 
        } else {
            toast.error('Gagal sinkronisasi');
        }
        setIsSubmitting(false);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const startCamera = async () => {
        setIsCapturing(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    zoom: true 
                } as any, 
                audio: false 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                const track = stream.getVideoTracks()[0];
                trackRef.current = track;

                const capabilities = track.getCapabilities() as any;
                if (capabilities.zoom) {
                    setZoomCaps({
                        min: capabilities.zoom.min,
                        max: capabilities.zoom.max,
                        step: capabilities.zoom.step || 0.1
                    });
                    setZoomValue(capabilities.zoom.min);
                }
            }
        } catch (err) {
            toast.error('Gagal membuka kamera');
            setIsCapturing(false);
        }
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setZoomValue(val);
        if (trackRef.current) {
            trackRef.current.applyConstraints({
                advanced: [{ zoom: val } as any]
            });
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const maxWidth = 1080;
                const videoWidth = videoRef.current.videoWidth || 1080;
                const videoHeight = videoRef.current.videoHeight || 1080;
                const scale = Math.min(1, maxWidth / videoWidth);
                canvasRef.current.width = videoWidth * scale;
                canvasRef.current.height = videoHeight * scale;
                
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const dataUrl = canvasRef.current.toDataURL('image/webp', 0.8);
                stopCamera();
                setImage(dataUrl);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1080;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
                setImage(webpDataUrl);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            trackRef.current = null;
            setZoomCaps(null);
        }
        setIsCapturing(false);
    };

    const handleSubmit = async () => {
        if (!selectedCp || !image || !currentPos) {
            toast.error('Data belum lengkap');
            return;
        }

        const logData = {
            userId,
            checkpointId: selectedCp.id,
            sessionId: activeSession?.id,
            status,
            notes,
            image,
            latitude: currentPos.lat,
            longitude: currentPos.lon
        };

        setIsSubmitting(true);
        if (!isOnline) {
            addToQueue(logData);
            setCheckedPointIds(prev => [...prev, selectedCp.id]);
            resetState();
            setIsSubmitting(false);
            return;
        }

        const result = await savePatrolLog(logData);
        if (result.success) {
            toast.success('Laporan terkirim');
            setCheckedPointIds(prev => [...prev, selectedCp.id]);
            resetState();
        } else {
            toast.error(result.message);
            addToQueue(logData);
            setCheckedPointIds(prev => [...prev, selectedCp.id]);
            resetState();
        }
        setIsSubmitting(false);
    };

    const resetState = () => {
        setImage(null);
        setSelectedCp(null);
        setNotes('Lokasi aman dan kondusif.');
        setStatus('AMAN');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat Sistem Patroli...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        Putaran <span className="text-indigo-600">Patroli</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 animate-pulse")} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline Mode'}</span>
                    </div>
                </div>
                {offlineQueue.length > 0 && (
                    <Button size="sm" onClick={syncQueue} disabled={isSubmitting || !isOnline} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest h-8 px-3">
                        <RefreshCw className={cn("w-3 h-3 mr-1.5", isSubmitting && "animate-spin")} /> Sync ({offlineQueue.length})
                    </Button>
                )}
            </div>

            {!activeSession ? (
                /* Start Session Screen */
                <div className="space-y-8 py-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                        <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50">
                            <Shield size={40} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">Siap Untuk Patroli?</h2>
                        <p className="text-xs text-slate-500 font-medium px-10 leading-relaxed">Pastikan Anda berada di area kawasan dan GPS dalam keadaan aktif.</p>
                    </div>
                    <Button 
                        onClick={handleStartSession} 
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] py-8 shadow-xl shadow-indigo-500/20"
                    >
                        {isSubmitting ? <RefreshCw className="animate-spin" /> : <><Play className="mr-2 h-5 w-5 fill-current" /> Mulai Putaran</>}
                    </Button>
                </div>
            ) : selectedCp ? (
                /* Capture Form */
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-3 p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                        <MapPin size={24} />
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Checking Point</p>
                            <h3 className="text-lg font-black uppercase tracking-tight">{selectedCp.name}</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={resetState} className="text-white hover:bg-white/10"><X size={20} /></Button>
                    </div>

                    <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border-4 border-white dark:border-slate-800">
                        {image ? (
                            <ZoomableImage src={image} alt="Captured Area" className="w-full h-full object-cover" />
                        ) : isCapturing ? (
                            <>
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {zoomCaps && (
                                    <div className="absolute left-6 right-6 bottom-32 flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md p-3 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between w-full px-2">
                                            <ZoomOut size={16} className="text-white/60" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{zoomValue.toFixed(1)}x</span>
                                            <ZoomIn size={16} className="text-white/60" />
                                        </div>
                                        <input 
                                            type="range" 
                                            min={zoomCaps.min} 
                                            max={zoomCaps.max} 
                                            step={zoomCaps.step} 
                                            value={zoomValue}
                                            onChange={handleZoomChange}
                                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Camera size={40} />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest">Ambil Foto Area</p>
                            </div>
                        )}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                            {!image && !isCapturing && (
                                <>
                                    <Button onClick={startCamera} className="rounded-full h-16 w-16 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl">
                                        <Camera size={24} />
                                    </Button>
                                    <Button onClick={() => fileInputRef.current?.click()} className="rounded-full h-16 w-16 bg-slate-800 hover:bg-slate-700 text-white shadow-xl">
                                        <Upload size={24} />
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                    />
                                </>
                            )}
                            {!image && isCapturing && <Button onClick={takePhoto} className="rounded-full h-20 w-20 bg-white text-indigo-600 border-8 border-indigo-600/20 shadow-2xl scale-110 active:scale-90 transition-all"><div className="w-full h-full rounded-full border-2 border-indigo-600" /></Button>}
                            {image && <Button onClick={() => setImage(null)} className="rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest">Ulangi Foto</Button>}
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Keterangan / Temuan</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                    { label: 'Aman', text: 'Lokasi aman dan kondusif.' },
                                    { label: 'Gembok OK', text: 'Semua gembok dan kunci dalam keadaan terkunci.' },
                                    { label: 'Lampu Mati', text: 'Lampu mati di area ini.' },
                                    { label: 'Pintu Buka', text: 'Pintu/Gerbang terbuka.' },
                                    { label: 'CCTV OK', text: 'CCTV terpantau aktif dan bersih.' },
                                    { label: 'Sampah', text: 'Sampah menumpuk, butuh pembersihan.' },
                                    { label: 'Rokok', text: 'Ditemukan puntung rokok di area dilarang merokok.' },
                                ].map(t => (
                                    <button 
                                        key={t.label} 
                                        type="button"
                                        onClick={() => setNotes(t.text)} 
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all", 
                                            notes === t.text 
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20" 
                                                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]" placeholder="Catatan patroli..." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['AMAN', 'TEMUAN'].map(s => (
                                <button key={s} onClick={() => setStatus(s)} className={cn("py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all", status === s ? (s === 'AMAN' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-rose-50 border-rose-500 text-rose-600") : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400")}>
                                    {s === 'AMAN' ? 'Aman' : 'Ada Temuan'}
                                </button>
                            ))}
                        </div>
                        <Button disabled={isSubmitting || !image} onClick={handleSubmit} className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest py-8 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all">
                            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-3" /> Kirim Laporan</>}
                        </Button>
                    </div>
                </div>
            ) : (
                /* List Checkpoints in Session */
                <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                <Clock className="text-emerald-600" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Putaran Berjalan</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Dimulai oleh: <span className="text-indigo-600">{(activeSession as any).user?.name || 'Sistem'}</span>
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleEndSession}
                            className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 h-12 shadow-lg shadow-rose-200 dark:shadow-none"
                        >
                            Selesaikan
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Daftar Titik Putaran Ini</p>
                        {checkpoints.map((cp) => {
                            const isChecked = checkedPointIds.includes(cp.id);
                            const dist = currentPos ? calculateDistance(currentPos.lat, currentPos.lon, cp.latitude, cp.longitude) : 999;
                            const isNearby = dist < 50;

                            return (
                                <button
                                    key={cp.id}
                                    disabled={isChecked}
                                    onClick={() => setSelectedCp(cp)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                        isChecked 
                                            ? "bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50" 
                                            : isNearby 
                                                ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/5" 
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                                            isChecked ? "bg-emerald-500 text-white scale-90" : isNearby ? "bg-indigo-100 text-indigo-600 scale-100" : "bg-slate-200 text-slate-500 scale-100"
                                        )}>
                                            {isChecked ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
                                        </div>
                                        <div>
                                            <h4 className={cn("text-sm font-black uppercase tracking-tight", isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>{cp.name}</h4>
                                            <p className={cn("text-[9px] font-bold uppercase tracking-widest", isChecked ? "text-emerald-500/70" : "text-slate-400")}>
                                                {isChecked ? 'Sudah Selesai' : isNearby ? 'Siap Scan' : `${Math.round(dist)}m`}
                                            </p>
                                        </div>
                                    </div>
                                    {isChecked ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">SELESAI</span>
                                        </div>
                                    ) : (
                                        isNearby && <div className="bg-indigo-600 text-white p-1.5 rounded-full animate-bounce"><Navigation size={12} /></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <Button 
                        onClick={handleEndSession}
                        disabled={isSubmitting}
                        variant="outline"
                        className="w-full rounded-2xl border-2 border-rose-100 text-rose-600 font-black uppercase text-xs tracking-widest py-8 hover:bg-rose-50 transition-all"
                    >
                        {isSubmitting ? <RefreshCw className="animate-spin" /> : <><Flag className="mr-2 h-5 w-5" /> Selesai Putaran</>}
                    </Button>
                </div>
            )}
        </div>
    );
}

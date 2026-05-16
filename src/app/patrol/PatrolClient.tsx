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
    Clock
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
    const watchId = useRef<number | null>(null);

    const init = React.useCallback(async () => {
        setIsLoading(true);
        await Promise.all([
            fetchCheckpoints(),
            fetchActiveSession(),
            startLocationWatch()
        ]);
        loadOfflineQueue();
        setIsLoading(false);
    }, [userId]);

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

    const fetchCheckpoints = async () => {
        const result = await getCheckpoints();
        if (result.success && result.data) {
            setCheckpoints(result.data as Checkpoint[]);
        }
    };

    const fetchActiveSession = async () => {
        const result = await getActiveSession(userId);
        if (result.success && result.data) {
            setActiveSession(result.data as unknown as PatrolSession);
            setCheckedPointIds((result.data as any).logs.map((l: any) => l.checkpointId));
        }
    };

    const startLocationWatch = () => {
        if (!navigator.geolocation) return;
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    };

    const loadOfflineQueue = () => {
        const saved = localStorage.getItem('patrol_offline_queue');
        if (saved) {
            try {
                setOfflineQueue(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading queue', e);
            }
        }
    };

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

    const addToQueue = (data: any) => {
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
            fetchActiveSession(); // Update status
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            toast.error('Gagal membuka kamera');
            setIsCapturing(false);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
                stopCamera();
                setImage(dataUrl);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
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
                        {image ? <img src={image} className="w-full h-full object-cover" /> : isCapturing ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4"><div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center"><Camera size={40} /></div><p className="text-xs font-black uppercase tracking-widest">Ambil Foto Area</p></div>}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                            {!image && !isCapturing && <Button onClick={startCamera} className="rounded-full h-16 w-16 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl"><Camera size={24} /></Button>}
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
                    <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Mulai</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                                    {format(new Date(activeSession.startTime), 'HH:mm:ss')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                            <p className="text-xs font-black text-indigo-600">{checkedPointIds.length} / {checkpoints.length}</p>
                        </div>
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
                                            ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50" 
                                            : isNearby 
                                                ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/5" 
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isChecked ? "bg-emerald-100 text-emerald-600" : isNearby ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {isChecked ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{cp.name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {isChecked ? 'Sudah Dicek' : isNearby ? 'Anda Sudah di Lokasi' : `${Math.round(dist)}m dari Anda`}
                                            </p>
                                        </div>
                                    </div>
                                    {!isChecked && isNearby && <div className="bg-indigo-600 text-white p-1.5 rounded-full animate-bounce"><Navigation size={12} /></div>}
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

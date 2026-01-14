'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    AlertTriangle,
    Camera,
    MapPin,
    X,
    Save,
    Loader2,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Mic,
    MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { createIncidentReport } from '@/actions/incident';
import { cn } from '@/lib/utils';

interface IncidentReportDialogProps {
    userId: string;
    onSuccess?: () => void;
    variant?: 'default' | 'shortcut';
    disabled?: boolean;
}

const CATEGORIES = [
    'Pencurian / Kehilangan',
    'Kerusakan Fasilitas',
    'Orang Mencurigakan',
    'Kecelakaan',
    'Kebakaran',
    'Lainnya'
];

export default function IncidentReportDialog({ userId, onSuccess, variant = 'default', disabled = false }: IncidentReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: Camera, 3: Success

    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Browser Anda tidak mendukung fitur Suara-ke-Teks.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID'; // Set to Indonesian
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info('Silakan bicara sekarang...');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech Recognition Error:', event.error);
            setIsListening(false);
            toast.error('Gagal mengenali suara. Coba lagi.');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleOpen = () => {
        if (disabled) {
            toast.error('Tombol Laporan Terkunci. Anda harus melakukan Clock In terlebih dahulu.');
            return;
        }
        setIsOpen(true);
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Get location automatically when dialog opens
    useEffect(() => {
        if (isOpen) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => toast.error('Gagal mendapatkan lokasi GPS otomatis.')
                );
            }
        }
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Back camera preferred for incidents
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            toast.error('Gagal mengakses kamera.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Set canvas dimensions to match video
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;

                // Draw current video frame to canvas
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

                // Convert to base64
                const data = canvasRef.current.toDataURL('image/jpeg', 0.8);
                setCapturedImage(data);

                // Stop camera and return to form
                stopCamera();
                setStep(1);
            }
        }
    };

    const handleSubmit = async () => {
        if (!category || !description || !location) {
            toast.error('Harap lengkapi kategori, deskripsi dan lokasi.');
            return;
        }

        setLoading(true);
        const result = await createIncidentReport({
            userId,
            category,
            description,
            latitude: location.lat,
            longitude: location.lng,
            evidenceImg: capturedImage || undefined
        });

        if (result.success) {
            setStep(3);
            toast.success('Laporan Berhasil Terkirim!');
            if (onSuccess) onSuccess();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const reset = () => {
        setStep(1);
        setCategory('');
        setDescription('');
        setCapturedImage(null);
        setLocation(null);
        setIsOpen(false);
        stopCamera();
    };

    if (!isOpen) {
        if (variant === 'shortcut') {
            return (
                <button
                    onClick={handleOpen}
                    className={cn(
                        "flex flex-col items-center space-y-3 group transition-all",
                        disabled && "opacity-40 grayscale"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg transition-all",
                        disabled
                            ? "from-slate-400 to-slate-500 shadow-none cursor-not-allowed"
                            : "from-rose-500 to-rose-600 shadow-rose-200 dark:shadow-none active:scale-90 group-hover:translate-y-[-4px]"
                    )}>
                        <AlertTriangle size={24} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-600 transition-colors text-center whitespace-nowrap">Lapor</span>
                </button>
            );
        }
        return (
            <button
                onClick={handleOpen}
                className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-3xl font-bold group transition-all shadow-lg",
                    disabled
                        ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 opacity-60 shadow-none cursor-not-allowed"
                        : "bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 active:scale-95 shadow-rose-200/50 dark:shadow-none"
                )}
            >
                <AlertTriangle className={cn("w-8 h-8 mb-2 transition-transform", !disabled && "group-hover:scale-110")} />
                <span className="text-[10px] uppercase tracking-widest font-black">Lapor Kejadian</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Laporan Kejadian</h2>
                            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Darurat & Insiden Lapangan</p>
                        </div>
                    </div>
                    <button onClick={reset} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Peristiwa</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Kejadian</label>
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all",
                                            isListening
                                                ? "bg-rose-500 text-white animate-pulse"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500"
                                        )}
                                    >
                                        {isListening ? <MicOff size={10} /> : <Mic size={10} />}
                                        {isListening ? 'Mendengarkan...' : 'Gunakan Suara'}
                                    </button>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Jelaskan apa yang terjadi secara detail..."
                                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setStep(2); startCamera(); }}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 group transition-all",
                                        capturedImage ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200 hover:border-rose-500 text-slate-400 hover:text-rose-600"
                                    )}
                                >
                                    {capturedImage ? <img src={capturedImage} className="w-10 h-10 object-cover rounded-lg" /> : <Camera size={20} />}
                                    <span className="text-xs font-black uppercase tracking-widest">{capturedImage ? 'Ganti Foto' : 'Ambil Foto Bukti'}</span>
                                </button>

                                <div className={cn(
                                    "px-4 rounded-2xl flex items-center justify-center",
                                    location ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                )}>
                                    <MapPin size={20} className={location ? "animate-bounce" : ""} />
                                    {location && <CheckCircle2 size={12} className="ml-1" />}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !category || !description || !location}
                                className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                                <span>Kirim Laporan</span>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="relative aspect-[4/3] rounded-3xl bg-black overflow-hidden bg-slate-900 group">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-4 border-white/20 rounded-3xl pointer-events-none" />

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                                    <button
                                        onClick={() => { stopCamera(); setStep(1); }}
                                        className="h-12 px-6 rounded-2xl bg-black/60 backdrop-blur-md text-white font-bold text-xs uppercase"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={captureImage}
                                        className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-rose-600 shadow-xl active:scale-75 transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full border-4 border-rose-600" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Arahkan kamera ke obyek kejadian</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100 mb-2">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">LAPORAN TERKIRIM !</h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                                    Admin telah menerima laporan Anda. Mohon tetap waspada dan tunggu instruksi selanjutnya.
                                </p>
                            </div>
                            <button
                                onClick={reset}
                                className="px-8 h-12 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Kembali
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Warnings */}
                {step !== 3 && (
                    <div className="px-8 pb-8">
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                                Pastikan deskripsi jelas. Laporan palsu atau main-main akan dicatat dan dikenakan sanksi sesuai aturan BPL Marunda.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    MessageSquare,
    Clock,
    X,
    ChevronRight,
    MapPin,
    Maximize2,
    Send,
    Loader2,
    Mic,
    MicOff
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { addIncidentComment } from '@/actions/incident';
import { toast } from 'sonner';

interface ReviewIncidentsProps {
    incidents: any[];
    userId: string;
}

export default function ReviewIncidents({ incidents, userId }: ReviewIncidentsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
    const [userResponse, setUserResponse] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Browser tidak mendukung pendeteksi suara.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info('Bicaralah sekarang...');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserResponse(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
            toast.error('Gagal mengenali suara.');
        };

        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    // Auto-cycle incidents every 5 seconds
    useEffect(() => {
        if (!incidents || incidents.length <= 1 || selectedIncident) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                if (incidents.length === 0) return 0;
                return (prev + 1) % incidents.length;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [incidents?.length, !!selectedIncident]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedIncident?.comments]);

    if (!incidents || incidents.length === 0) return null;

    // Safety check for index
    const safeIndex = currentIndex >= incidents.length ? 0 : currentIndex;
    const current = incidents[safeIndex];

    const handleSendResponse = async () => {
        if (!userResponse.trim() || !selectedIncident) return;

        setIsSending(true);
        try {
            const result = await addIncidentComment(selectedIncident.id, userId, userResponse);
            if (result.success) {
                toast.success('Tanggapan terkirim.');
                setUserResponse('');
                // Ideally refresh the specific incident's comments
                // For now, we close it to force a refresh on next open since parent data changed
                setSelectedIncident(null);
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error('Gagal mengirim tanggapan.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <h3 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Respon Insiden Aktif</h3>
                </div>
                <div className="flex gap-1">
                    {incidents.slice(0, 5).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                i === safeIndex ? "w-4 bg-rose-500" : "w-1 bg-slate-200 dark:bg-slate-800"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Compact Motion Carousel with Manual Swipe */}
            <div className="relative h-24 overflow-hidden touch-none">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={safeIndex}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                            const swipeThreshold = 50;
                            if (info.offset.x < -swipeThreshold) {
                                // Swipe Left -> Next
                                setCurrentIndex((prev) => (prev + 1) % incidents.length);
                            } else if (info.offset.x > swipeThreshold) {
                                // Swipe Right -> Prev
                                setCurrentIndex((prev) => (prev - 1 + incidents.length) % incidents.length);
                            }
                        }}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        onClick={(e) => {
                            // Only open if it wasn't a significant drag
                            if (Math.abs((e as any).movementX || 0) < 5) {
                                setSelectedIncident(current);
                            }
                        }}
                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    >
                        <div className="h-full bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none p-3 pr-4 flex items-center gap-4 overflow-hidden group">
                            <div className={cn(
                                "w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center relative bg-gradient-to-br transition-transform group-active:scale-95",
                                current.status === 'PENDING' ? "from-rose-500 to-rose-600 text-white" :
                                    current.status === 'ON_PROGRESS' ? "from-amber-500 to-amber-600 text-white" : "from-emerald-500 to-emerald-600 text-white"
                            )}>
                                {current.evidenceImg ? (
                                    <img src={current.evidenceImg} className="w-full h-full object-cover rounded-2xl" alt="Bukti" />
                                ) : (
                                    <AlertTriangle size={24} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 pointer-events-none select-none">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">{current.category}</span>
                                    <span className="text-[7px] font-bold text-slate-400">{format(new Date(current.createdAt), 'HH:mm', { locale: id })}</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{current.description}</p>

                                <div className="mt-1.5 flex items-center gap-2">
                                    {current.comments?.length > 0 ? (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50">
                                            <MessageSquare size={10} />
                                            <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[120px]">
                                                {current.comments[current.comments.length - 1].content}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700">
                                            <Clock size={10} />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">Menunggu Konfirmasi</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedIncident && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedIncident(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Photo Header */}
                            <div className="relative h-48 shrink-0 bg-slate-900">
                                {selectedIncident.evidenceImg ? (
                                    <img src={selectedIncident.evidenceImg} className="w-full h-full object-cover" alt="Bukti" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-rose-700">
                                        <AlertTriangle size={64} className="text-white/20" />
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedIncident(null)}
                                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest w-fit mb-1">{selectedIncident.category}</span>
                                    <h3 className="text-white font-black text-lg uppercase tracking-tight">{selectedIncident.status}</h3>
                                </div>
                            </div>

                            {/* Thread Title */}
                            <div className="p-6 pb-0">
                                <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    <MessageSquare size={14} />
                                    <span>Percakapan Insiden</span>
                                </div>
                            </div>

                            {/* Scrollable Thread */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar">
                                {/* Initial Case */}
                                <div className="flex flex-col items-start space-y-1">
                                    <div className="p-4 rounded-3xl rounded-tl-none bg-slate-100 dark:bg-slate-900 text-xs font-bold leading-relaxed">
                                        Laporan: {selectedIncident.description}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">Saya • {format(new Date(selectedIncident.createdAt), 'HH:mm', { locale: id })}</span>
                                </div>

                                {selectedIncident.comments?.map((comment: any) => {
                                    const isAdmin = ['ADMIN', 'PIC'].includes(comment.user.role);
                                    return (
                                        <div key={comment.id} className={cn(
                                            "flex flex-col space-y-1",
                                            isAdmin ? "items-start" : "items-end"
                                        )}>
                                            <div className={cn(
                                                "max-w-[85%] p-4 rounded-3xl text-xs font-bold leading-relaxed",
                                                isAdmin
                                                    ? "rounded-tl-none bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50"
                                                    : "rounded-tr-none bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300"
                                            )}>
                                                {comment.content}
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mx-1">
                                                {isAdmin ? 'Admin' : 'Saya'} • {format(new Date(comment.createdAt), 'HH:mm', { locale: id })}
                                            </span>
                                        </div>
                                    );
                                })}

                                {selectedIncident.comments?.length === 0 && (
                                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <Clock size={24} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menunggu respon admin...</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Footer */}
                            <div className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-900 space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            value={userResponse}
                                            onChange={(e) => setUserResponse(e.target.value)}
                                            placeholder="Balas instruksi admin..."
                                            className="w-full h-12 px-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-rose-500 outline-none transition-all pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleListening}
                                            className={cn(
                                                "absolute right-2 top-2 h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                isListening ? "bg-rose-500 text-white animate-pulse" : "text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSendResponse}
                                        disabled={isSending || !userResponse.trim()}
                                        className="h-12 w-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`, '_blank')}
                                    className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <MapPin size={12} />
                                    Buka Peta Lokasi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

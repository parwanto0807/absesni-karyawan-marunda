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
import { getPusherClient } from '@/lib/pusher-client';

interface ReviewIncidentsProps {
    incidents: any[];
    userId: string;
}

export default function ReviewIncidents({ incidents: initialIncidents, userId }: ReviewIncidentsProps) {
    const [incidents, setIncidents] = useState<any[]>(initialIncidents);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sync state with props when data is refreshed from server
    useEffect(() => {
        setIncidents(initialIncidents);
    }, [initialIncidents]);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [userResponse, setUserResponse] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Single Source of Truth: Find selected incident from the shared list
    const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
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
        if (!incidents || incidents.length <= 1 || selectedIncidentId) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                if (incidents.length === 0) return 0;
                return (prev + 1) % incidents.length;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [incidents?.length, !!selectedIncidentId]);

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
                // If Pusher is working, we don't need to do anything, 
                // but as a fallback, we could fetch updated data here.
                // For now, let's NOT close the modal for better UX.
                // setSelectedIncident(null);
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

            {/* Realtime: Background Notifications (Global) */}
            <GlobalNotificationListener
                incidents={incidents}
                setIncidents={setIncidents}
                userId={userId}
                setSelectedIncidentId={setSelectedIncidentId}
                selectedIncidentId={selectedIncidentId}
            />

            {/* Realtime: Listen for new incidents */}
            <RealtimeIncidentListener
                setIncidents={setIncidents}
            />

            {/* Realtime Messages Listener (Active when dialog is open) */}
            <RealtimeCommentListener
                selectedIncidentId={selectedIncidentId}
                setIncidents={setIncidents}
                userId={userId}
            />

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
                                setSelectedIncidentId(current.id);
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
                            onClick={() => setSelectedIncidentId(null)}
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
                                    onClick={() => setSelectedIncidentId(null)}
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
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                        <MessageSquare size={14} />
                                        <span>Percakapan Insiden</span>
                                    </div>
                                    <RealtimeStatusBadge selectedIncident={selectedIncident} />
                                </div>
                            </div>

                            {/* Scrollable Thread */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar">
                                {/* Initial Case */}
                                <div className="flex flex-col items-start space-y-1">
                                    <div className="p-4 rounded-3xl rounded-tl-none bg-slate-100 dark:bg-slate-900 text-xs font-bold leading-relaxed">
                                        Laporan: {selectedIncident.description}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                                        {selectedIncident.userId === userId ? 'Saya' : selectedIncident.user?.name} • {format(new Date(selectedIncident.createdAt), 'HH:mm', { locale: id })}
                                    </span>
                                </div>

                                {selectedIncident.comments?.map((comment: any) => {
                                    const isMe = comment.userId === userId;
                                    const isAdmin = ['ADMIN', 'PIC', 'RT'].includes(comment.user.role);

                                    return (
                                        <div key={comment.id} className={cn(
                                            "flex flex-col space-y-1",
                                            isMe ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "max-w-[85%] p-4 rounded-3xl text-xs font-bold leading-relaxed",
                                                isMe
                                                    ? "rounded-tr-none bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300"
                                                    : "rounded-tl-none bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50"
                                            )}>
                                                {comment.content}
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mx-1">
                                                {isMe ? 'Saya' : (comment.user.name || 'User')} • {format(new Date(comment.createdAt), 'HH:mm', { locale: id })}
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
                                            placeholder="Balas Percakapan Insiden..."
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
                )
                }
            </AnimatePresence >
        </div >
    );
}

function RealtimeIncidentListener({ setIncidents }: { setIncidents: (fn: (prev: any[]) => any[]) => void }) {
    useEffect(() => {
        let channel: any;
        const initPusher = async () => {
            const pusher = await getPusherClient();
            if (pusher) {
                channel = pusher.subscribe('incidents');
                channel.bind('new-incident', (newReport: any) => {
                    setIncidents(prev => {
                        if (prev.some(r => r.id === newReport.id)) return prev;
                        return [newReport, ...prev];
                    });
                    toast.info('Ada Laporan Kejadian Baru!');
                });
            }
        };
        initPusher();
        return () => {
            if (channel) channel.unbind_all().unsubscribe();
        };
    }, []);

    return null;
}

function GlobalNotificationListener({ incidents, setIncidents, userId, setSelectedIncidentId, selectedIncidentId }: { incidents: any[], setIncidents: any, userId: string, setSelectedIncidentId: any, selectedIncidentId?: string | null }) {
    const incidentsRef = useRef(incidents);
    const selectedIdRef = useRef(selectedIncidentId);

    // Sync refs
    useEffect(() => { incidentsRef.current = incidents; }, [incidents]);
    useEffect(() => { selectedIdRef.current = selectedIncidentId; }, [selectedIncidentId]);

    useEffect(() => {
        let channel: any;
        const init = async () => {
            const pusher = await getPusherClient();
            if (pusher) {
                channel = pusher.subscribe('incident-globals');
                console.log('[Global Listener] PERSISTENT Channel Active');

                channel.bind('update', (data: any) => {
                    const currentIncidents = incidentsRef.current;
                    const activeId = selectedIdRef.current;
                    const exists = currentIncidents.some(r => r.id === data.incidentId);

                    if (exists) {
                        // 1. Show notification ONLY if chat is closed OR focused on DIFFERENT incident
                        // AND sender is NOT me
                        if (data.senderId !== userId && data.incidentId !== activeId) {
                            toast.message(`Instruksi Baru: ${data.senderName}`, {
                                description: data.lastMessage + (data.lastMessage.length >= 30 ? '...' : ''),
                                action: {
                                    label: "Lihat",
                                    onClick: () => setSelectedIncidentId(data.incidentId)
                                }
                            });
                        }

                        // 2. Continuous Sync to state
                        setIncidents((prev: any[]) => prev.map(r => {
                            if (r.id === data.incidentId) {
                                const currentComments = r.comments || [];
                                const commentExists = currentComments.some((c: any) => c.id === data.fullComment?.id);
                                return {
                                    ...r,
                                    status: data.newStatus || r.status,
                                    comments: commentExists ? currentComments : [...currentComments, data.fullComment]
                                };
                            }
                            return r;
                        }));
                    }
                });
            }
        };
        init();
        return () => { if (channel) channel.unbind_all().unsubscribe(); };
    }, [userId, setIncidents]); // Removed selectedIncidentId from dependency for persistency

    return null;
}

function RealtimeStatusBadge({ selectedIncident }: { selectedIncident: any }) {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            const pusher = await getPusherClient();
            if (pusher && isMounted) {
                setStatus(pusher.connection.state as any);
                pusher.connection.bind('state_change', (states: any) => {
                    if (isMounted) setStatus(states.current);
                });
            } else {
                if (isMounted) setStatus('disconnected');
            }
        };
        init();
        return () => { isMounted = false; };
    }, [selectedIncident?.id]);

    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className={cn(
                "h-1 w-1 rounded-full",
                status === 'connected' ? "bg-emerald-500 shadow-[0_0_4px] shadow-emerald-500" :
                    status === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-slate-400"
            )} />
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                {status === 'connected' ? 'Live' : status === 'connecting' ? 'Hold' : 'Off'}
            </span>
        </div>
    );
}

function RealtimeCommentListener({ selectedIncidentId, setIncidents, userId }: { selectedIncidentId: string | null, setIncidents: any, userId: string }) {
    useEffect(() => {
        if (!selectedIncidentId) return;
        let channel: any;
        const initPusher = async () => {
            const pusher = await getPusherClient();
            if (pusher) {
                channel = pusher.subscribe(`incident-${selectedIncidentId}`);
                channel.bind('new-comment', (data: any) => {
                    setIncidents((prevList: any[]) => prevList.map(r => {
                        if (r.id === selectedIncidentId) {
                            const comments = r.comments || [];
                            if (comments.some((c: any) => c.id === data.id)) return r;

                            // Show toast if from someone else
                            if (data.userId !== userId) {
                                toast.message(`Pesan Baru dari ${data.user.name}`, {
                                    description: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                                });
                            }

                            return {
                                ...r,
                                status: data.newStatus || r.status,
                                comments: [...comments, data]
                            };
                        }
                        return r;
                    }));
                });
            }
        };
        initPusher();
        return () => { if (channel) channel.unbind_all().unsubscribe(); };
    }, [selectedIncidentId]);

    return null;
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    MessageSquare,
    MapPin,
    Clock,
    ChevronRight,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Send,
    Filter,
    ShieldAlert,
    History,
    UserCircle2,
    FileText,
    Download,
    Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { getIncidentReports, addIncidentComment, updateIncidentAdminNotes } from '@/actions/incident';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateIncidentPDF } from '@/lib/incident-pdf';
import { getPusherClient } from '@/lib/pusher-client';

export default function IncidentCenter({ adminId }: { adminId: string }) {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [reply, setReply] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
    const [actionDetail, setActionDetail] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [improvement, setImprovement] = useState('');
    const [notesLoading, setNotesLoading] = useState(false);
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedReport) {
            setActionDetail(selectedReport.actionDetail || '');
            setAnalysis(selectedReport.analysis || '');
            setImprovement(selectedReport.improvement || '');
        }
    }, [selectedReport?.id]);

    useEffect(() => {
        fetchReports();
    }, []);

    // Realtime: Connection Status & Global Listeners
    useEffect(() => {
        let channel: any;
        let commentChannel: any;
        const initPusher = async () => {
            const pusher = await getPusherClient();
            if (pusher) {
                setRealtimeStatus(pusher.connection.state as any);
                pusher.connection.bind('state_change', (states: any) => {
                    setRealtimeStatus(states.current);
                });

                // Listen for new incidents (global)
                channel = pusher.subscribe('incidents');
                console.log('[Pusher] Subscribed to: incidents');

                channel.bind('new-incident', (newReport: any) => {
                    console.log('[Pusher] New Incident received:', newReport.id);
                    setReports(prev => {
                        if (prev.some(r => r.id === newReport.id)) return prev;
                        return [newReport, ...prev];
                    });
                    toast.info('Laporan Kejadian Baru!', {
                        description: `${newReport.category}: ${newReport.description.substring(0, 30)}...`
                    });
                });

                // Global Updates for List (Status changes & New comments everywhere)
                const globalChannel = pusher.subscribe('incident-globals');
                console.log('[Pusher] Subscribed to: incident-globals');
                globalChannel.bind('update', (data: any) => {
                    console.log('[Pusher] Global update received for:', data.incidentId);
                    setReports(prev => prev.map(r => {
                        if (r.id === data.incidentId) {
                            return {
                                ...r,
                                status: data.newStatus || r.status,
                                updatedAt: new Date().toISOString()
                            };
                        }
                        return r;
                    }));
                });
            } else {
                setRealtimeStatus('disconnected');
            }
        };
        initPusher();
        return () => {
            if (channel) channel.unbind_all().unsubscribe();
            // Also unsubscribe globals
        };
    }, []);

    // Realtime: Listen for new comments on selected report
    useEffect(() => {
        if (!selectedReport) return;
        let channel: any;
        const initPusher = async () => {
            const pusher = await getPusherClient();
            if (pusher) {
                const channelName = `incident-${selectedReport.id}`;
                channel = pusher.subscribe(channelName);
                console.log(`[Pusher] Subscribed to detail: ${channelName}`);

                channel.bind('new-comment', (data: any) => {
                    console.log('[Pusher] New Comment received on detail:', data.id);

                    // 1. Update the main reports list (sidebar)
                    setReports(prevList => {
                        return prevList.map(r => {
                            if (r.id === selectedReport.id) {
                                const currentComments = r.comments || [];
                                if (currentComments.some((c: any) => c.id === data.id)) return r;
                                return {
                                    ...r,
                                    status: data.newStatus || r.status,
                                    updatedAt: new Date().toISOString(),
                                    comments: [...currentComments, data]
                                };
                            }
                            return r;
                        });
                    });

                    // 2. Update the currently selected report (chat area)
                    setSelectedReport((prev: any) => {
                        if (!prev || prev.id !== selectedReport.id) return prev;

                        const exists = prev.comments.some((c: any) => c.id === data.id);
                        if (exists) {
                            // If it exists but status changed, update status
                            if (data.newStatus && data.newStatus !== prev.status) {
                                return { ...prev, status: data.newStatus };
                            }
                            return prev;
                        }

                        // Add toast notification if message is from someone else
                        if (data.userId !== adminId) {
                            toast.message(`Pesan Baru dari ${data.user?.name || 'Petugas'}`, {
                                description: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                            });
                        }

                        // Return a NEW object to force re-render
                        return {
                            ...prev,
                            status: data.newStatus || prev.status,
                            updatedAt: new Date().toISOString(),
                            comments: [...(prev.comments || []), data]
                        };
                    });
                });
            }
        };
        initPusher();
        return () => {
            if (channel) {
                console.log(`[Pusher] Unsubscribing from detail`);
                channel.unbind_all().unsubscribe();
            }
        };
    }, [selectedReport?.id]);

    const fetchReports = async () => {
        setLoading(true);
        const result = await getIncidentReports();
        if (result.success) {
            setReports(result.data || []);
            // Update selected report if it exists
            if (selectedReport) {
                const updated = result.data?.find((r: any) => r.id === selectedReport.id);
                if (updated) setSelectedReport(updated);
            }
        }
        setLoading(false);
    };



    const handleReply = async (status: string) => {
        let finalMessage = reply.trim();

        // Allow empty message for RESOLVED status (Close Case)
        if (status === 'RESOLVED' && !finalMessage) {
            finalMessage = "Laporan ditandai SELESAI (CLOSED) oleh Admin.";
        } else if (!finalMessage) {
            toast.error('Harap isi pesan atau instruksi.');
            return;
        }

        setReplyLoading(true);
        const result = await addIncidentComment(selectedReport.id, adminId, finalMessage, status);
        if (result.success) {
            toast.success(status === 'RESOLVED' ? 'Laporan Berhasil Ditutup!' : 'Komentar Terkirim!');
            setReply('');
            // Optimistic update or just refetch
            fetchReports();
        } else {
            toast.error(result.message);
        }
        setReplyLoading(false);
    };

    const handleUpdateNotes = async () => {
        if (!selectedReport) return;
        setNotesLoading(true);
        const result = await updateIncidentAdminNotes(selectedReport.id, {
            actionDetail,
            analysis,
            improvement
        });
        if (result.success) {
            toast.success('Catatan admin berhasil disimpan');
            fetchReports();
        } else {
            toast.error(result.message);
        }
        setNotesLoading(false);
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return r.status === 'PENDING' || r.status === 'ON_PROGRESS';
        return r.status === filter;
    });

    if (loading && reports.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Pusat Insiden...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* List Reports */}
            <div className={cn(
                "lg:col-span-1 space-y-6",
                selectedReport ? "hidden lg:block" : "block"
            )}>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-5 md:p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Antrean Laporan</h3>
                            <button onClick={fetchReports} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <History size={16} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'PENDING', 'RESOLVED'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800"
                                    )}
                                >
                                    {f === 'ALL' ? 'Semua' : f === 'PENDING' ? 'Aktif' : 'Selesai'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredReports.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                                <ShieldAlert size={48} className="mb-2 opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest">Antrean Kosong</p>
                            </div>
                        ) : (
                            filteredReports.map(report => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={cn(
                                        "w-full p-4 rounded-3xl border text-left transition-all group flex items-start gap-4",
                                        selectedReport?.id === report.id
                                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20"
                                            : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center",
                                        report.status === 'PENDING' ? "bg-rose-100 text-rose-600 animate-pulse" :
                                            report.status === 'ON_PROGRESS' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">{report.category}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{format(new Date(report.createdAt), 'HH:mm', { locale: id })}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{report.description}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                                <div className="w-4 h-4 rounded-full bg-slate-200 overflow-hidden">
                                                    {report.user.image ? <img src={report.user.image} className="w-full h-full object-cover" /> : <UserCircle2 size={16} />}
                                                </div>
                                                {report.user.name.split(' ')[0]}
                                            </div>
                                            {report.comments?.length > 0 && (
                                                <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500">
                                                    <MessageSquare size={10} />
                                                    {report.comments.length}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Content Detail & Multi-Comment Thread */}
            <div className={cn(
                "lg:col-span-2 space-y-6",
                !selectedReport ? "hidden lg:block" : "block"
            )}>
                {selectedReport ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[700px] flex flex-col">
                        {/* Header */}
                        <div className="p-5 md:p-8 bg-slate-900 text-white relative">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">{selectedReport.category}</h2>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                selectedReport.status === 'PENDING' ? "bg-rose-500" :
                                                    selectedReport.status === 'ON_PROGRESS' ? "bg-amber-500" : "bg-emerald-500"
                                            )}>
                                                {selectedReport.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedReport.user.name} • {format(new Date(selectedReport.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 md:mt-0 ml-auto md:ml-0">
                                    <button
                                        onClick={() => generateIncidentPDF(selectedReport)}
                                        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-rose-400 border border-rose-400/20"
                                    >
                                        <Printer size={14} />
                                        <span className="hidden sm:inline">Print PDF</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`, '_blank')}
                                        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <MapPin size={14} />
                                        <span className="hidden sm:inline">Peta</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Thread & Comments */}
                        <div ref={scrollRef} className="flex-1 p-5 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Kejadian</label>
                                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm font-medium leading-relaxed">
                                        {selectedReport.description}
                                    </div>
                                </div>
                                {selectedReport.evidenceImg && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Foto</label>
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer" onClick={() => window.open(selectedReport.evidenceImg, '_blank')}>
                                            <img src={selectedReport.evidenceImg} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLink className="text-white" size={24} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Post-Incident Form */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-rose-600" />
                                    <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Catatan & Analisa Admin (Pasca Kejadian)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tindakan Diambil (Action)</label>
                                        <textarea
                                            value={actionDetail}
                                            onChange={(e) => setActionDetail(e.target.value)}
                                            placeholder="Tindakan yang dilakukan..."
                                            className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold outline-none focus:border-rose-400 transition-all resize-none shadow-sm placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Analisa (Analysis)</label>
                                        <textarea
                                            value={analysis}
                                            onChange={(e) => setAnalysis(e.target.value)}
                                            placeholder="Analisa penyebab..."
                                            className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold outline-none focus:border-rose-400 transition-all resize-none shadow-sm placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Perbaikan (Improvement)</label>
                                        <textarea
                                            value={improvement}
                                            onChange={(e) => setImprovement(e.target.value)}
                                            placeholder="Rekomendasi perbaikan..."
                                            className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold outline-none focus:border-rose-400 transition-all resize-none shadow-sm placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleUpdateNotes}
                                        disabled={notesLoading}
                                        className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-rose-100 dark:shadow-none"
                                    >
                                        {notesLoading ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                                        Simpan Catatan Admin
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={16} className="text-indigo-600" />
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Percakapan & Instruksi</h3>
                                </div>

                                {/* First Message from Reporter (Virtual) */}
                                <div className="flex flex-col items-start space-y-1">
                                    <div className="max-w-[80%] p-4 rounded-3xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Laporan awal: {selectedReport.description}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase px-1">{selectedReport.user.name} • {format(new Date(selectedReport.createdAt), 'HH:mm', { locale: id })}</span>
                                </div>

                                {/* Iterating Comments */}
                                {selectedReport.comments?.map((comment: any) => {
                                    const isAdmin = ['ADMIN', 'PIC', 'RT'].includes(comment.user.role);
                                    return (
                                        <div key={comment.id} className={cn(
                                            "flex flex-col space-y-1 animate-in slide-in-from-bottom-2 duration-300",
                                            isAdmin ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "max-w-[80%] p-4 rounded-3xl transition-all",
                                                isAdmin
                                                    ? "rounded-tr-none bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                                                    : "rounded-tl-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50"
                                            )}>
                                                <p className="text-xs font-bold leading-relaxed">{comment.content}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase px-1">
                                                {isAdmin ? '🛡️ Admin' : comment.user.name} • {format(new Date(comment.createdAt), 'HH:mm', { locale: id })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-5 md:p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                            {selectedReport.status !== 'RESOLVED' ? (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <textarea
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                                placeholder="Tulis instruksi tambahan pesan di sini..."
                                                className="w-full h-24 p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleReply('ON_PROGRESS')}
                                                disabled={replyLoading || !reply.trim()}
                                                className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg"
                                            >
                                                {replyLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                                Balas
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Segera meluncur', 'Amankan lokasi', 'Harap lapor koordinator', 'Dokumentasikan kerusakan'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setReply(t)}
                                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-500 transition-all"
                                            >
                                                + {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-emerald-600/50 dark:text-emerald-400/50">
                                    <CheckCircle2 size={48} />
                                    <p className="text-xs font-black uppercase tracking-widest">Laporan Telah Diselesaikan</p>
                                </div>
                            )}

                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                {selectedReport.status !== 'RESOLVED' && (
                                    <button
                                        onClick={() => handleReply('RESOLVED')}
                                        disabled={replyLoading}
                                        className="w-full h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} />
                                        Tandai Selesai (Close Case)
                                    </button>
                                )}

                                {/* Mobile Back Button (Bottom Right) */}
                                <div className="lg:hidden flex justify-end mt-4">
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-xl"
                                    >
                                        Kembali
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[700px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-slate-400">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
                                <ShieldAlert size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Monitor</span>
                            </div>
                            {/* Connection Status Dot */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-all duration-500",
                                    realtimeStatus === 'connected' ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500" :
                                        realtimeStatus === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                                )} />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    {realtimeStatus === 'connected' ? 'Online' : realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Pilih Laporan</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] text-center">Silakan pilih laporan di sisi kiri untuk melihat detail.</p>
                    </div>
                )}
            </div>
        </div >
    );
}

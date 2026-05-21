'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    History, 
    Search,
    ChevronRight,
    X,
    Clock,
    Shield,
    Navigation,
    ExternalLink,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getRecentPatrolLogs, getMyPatrolLogs, getCheckpoints } from '@/actions/patrol';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LazyPatrolImage } from '@/components/LazyPatrolImage';

interface PatrolLog {
    id: string;
    userId: string;
    user: {
        name: string;
        role: string;
    };
    checkpointId: string;
    checkpoint: {
        name: string;
        location: string | null;
    };
    status: string;
    notes: string | null;
    image: string | null;
    latitude: number;
    longitude: number;
    sessionId?: string | null;
    createdAt: Date;
}

interface GroupedSession {
    id: string;
    isReal: boolean;
    user: {
        name: string;
        role: string;
    };
    startTime: Date;
    endTime: Date;
    status: string;
    logs: PatrolLog[];
}

interface PatrolHistoryClientProps {
    currentUserRole?: string;
    currentUserId?: string;
}

export default function PatrolHistoryClient({ currentUserRole = 'ADMIN', currentUserId = '' }: PatrolHistoryClientProps) {
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState<GroupedSession | null>(null);
    const [totalCheckpointsCount, setTotalCheckpointsCount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 100;

    useEffect(() => {
        if (selectedSession) {
            setActiveTab('timeline');
        }
    }, [selectedSession]);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        
        // Fetch active checkpoints count
        const cpResult = await getCheckpoints();
        if (cpResult.success && cpResult.data) {
            setTotalCheckpointsCount(cpResult.data.length);
        }

        const result = currentUserRole === 'SECURITY' 
            ? await getMyPatrolLogs(currentUserId, limit, 2, page)
            : await getRecentPatrolLogs(limit, page);
        
        if (result.success && result.data) {
            setLogs(result.data as PatrolLog[]);
            if ((result as any).pagination) {
                setTotalPages((result as any).pagination.totalPages);
            }
        } else {
            toast.error(result.message || 'Gagal mengambil riwayat');
        }
        setIsLoading(false);
    }, [currentUserRole, currentUserId, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Client-side grouping logic: Group logs by sessionId or virtual session
    const sessionsMap = new Map<string, GroupedSession>();

    logs.forEach(log => {
        const logDate = new Date(log.createdAt);
        if (log.sessionId) {
            if (!sessionsMap.has(log.sessionId)) {
                sessionsMap.set(log.sessionId, {
                    id: log.sessionId,
                    isReal: true,
                    user: log.user,
                    startTime: logDate,
                    endTime: logDate,
                    status: 'AMAN',
                    logs: []
                });
            }
            const sess = sessionsMap.get(log.sessionId)!;
            sess.logs.push(log);
            
            if (logDate < sess.startTime) sess.startTime = logDate;
            if (logDate > sess.endTime) sess.endTime = logDate;
            
            if (log.status === 'TEMUAN') {
                sess.status = 'TEMUAN';
            }
        } else {
            // Group independent non-session logs of the same user on the same calendar day
            const dateKey = format(logDate, 'yyyy-MM-dd');
            const virtualSessId = `virtual-${log.userId}-${dateKey}`;
            
            if (!sessionsMap.has(virtualSessId)) {
                sessionsMap.set(virtualSessId, {
                    id: virtualSessId,
                    isReal: false,
                    user: log.user,
                    startTime: logDate,
                    endTime: logDate,
                    status: 'AMAN',
                    logs: []
                });
            }
            const sess = sessionsMap.get(virtualSessId)!;
            sess.logs.push(log);
            
            if (logDate < sess.startTime) sess.startTime = logDate;
            if (logDate > sess.endTime) sess.endTime = logDate;
            
            if (log.status === 'TEMUAN') {
                sess.status = 'TEMUAN';
            }
        }
    });

    const groupedSessions = Array.from(sessionsMap.values())
        .map(sess => {
            // Sort checkpoints within the session chronologically
            sess.logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return sess;
        })
        // Sort sessions by start time descending (most recent first)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    const filteredSessions = groupedSessions.filter(sess => 
        sess.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sess.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sess.isReal && `putaran #${sess.id.substring(sess.id.length - 4)}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (!sess.isReal && 'patroli mandiri'.includes(searchQuery.toLowerCase())) ||
        sess.logs.some(log => 
            log.checkpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    );

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    {currentUserRole === 'SECURITY' ? 'Riwayat Patroli Anda' : 'Riwayat Putaran Patroli'}
                </h2>
                <div className="relative w-full md:w-80">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        placeholder={currentUserRole === 'SECURITY' ? "Cari titik, status, atau putaran..." : "Cari petugas, titik, status, atau putaran..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs py-5"
                    />
                </div>
            </div>

            {/* Session Grouped Table (Desktop View) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal & Waktu</th>
                                {currentUserRole !== 'SECURITY' && (
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Petugas</th>
                                )}
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Putaran / Sesi</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Progres Checkpoint</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status Sesi</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={currentUserRole === 'SECURITY' ? 5 : 6} className="px-6 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={currentUserRole === 'SECURITY' ? 5 : 6} className="px-6 py-12 text-center text-xs text-slate-400 italic">Belum ada riwayat putaran patroli.</td>
                                </tr>
                            ) : (
                                filteredSessions.map((sess) => (
                                    <tr 
                                        key={sess.id} 
                                        onClick={() => setSelectedSession(sess)}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {format(new Date(sess.startTime), 'HH:mm', { locale: id })} - {format(new Date(sess.endTime), 'HH:mm', { locale: id })}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                    {format(new Date(sess.startTime), 'dd MMM yyyy', { locale: id })}
                                                </span>
                                            </div>
                                        </td>
                                        {currentUserRole !== 'SECURITY' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-600">
                                                        {sess.user.name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{sess.user.name}</span>
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{sess.user.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sess.isReal ? (
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                    Putaran #{sess.id.substring(sess.id.length - 4)}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider italic">
                                                    Patroli Mandiri
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sess.isReal ? (() => {
                                                const total = totalCheckpointsCount || 12;
                                                const completed = sess.logs.length;
                                                const remaining = Math.max(0, total - completed);
                                                const percentage = Math.min(100, Math.round((completed / total) * 100));
                                                return (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">
                                                            {completed} / {total} Selesai ({percentage}%)
                                                        </span>
                                                        {remaining > 0 ? (
                                                            <span className="inline-flex items-center w-max px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 animate-pulse">
                                                                🚨 {remaining} Titik Belum Selesai
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center w-max px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                                                                ✅ Selesai Semua
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })() : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                                                        {sess.logs.length} Titik
                                                    </span>
                                                    <span className="inline-flex items-center w-max px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                                        Mandiri
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                sess.status === 'AMAN' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/50" 
                                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-800/50"
                                            )}>
                                                {sess.status === 'AMAN' ? '🟢 AMAN' : '🚨 TEMUAN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 transition-all">
                                                <ChevronRight size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List (Mobile View) */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                            </div>
                            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/5" />
                            </div>
                        </div>
                    ))
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 italic">
                        Belum ada riwayat putaran patroli.
                    </div>
                ) : (
                    filteredSessions.map((sess) => (
                        <div 
                            key={sess.id}
                            onClick={() => setSelectedSession(sess)}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm active:bg-slate-50 dark:active:bg-slate-850 transition-all space-y-4"
                        >
                            {/* Card Header: Time & Code */}
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    {format(new Date(sess.startTime), 'dd MMM yyyy', { locale: id })}
                                </span>
                                {sess.isReal ? (
                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase tracking-wider">
                                        #{sess.id.substring(sess.id.length - 4)}
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider italic">
                                        Mandiri
                                    </span>
                                )}
                            </div>

                            {/* Card Body: Officer & Progress */}
                            <div className="flex items-center justify-between gap-3">
                                {currentUserRole !== 'SECURITY' ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">
                                            {sess.user.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{sess.user.name}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sess.user.role}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                                            <Shield size={16} />
                                        </div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-350 uppercase tracking-tight">Putaran Patroli Anda</span>
                                    </div>
                                )}
                                <div className="text-right flex flex-col items-end">
                                    {sess.isReal ? (() => {
                                        const total = totalCheckpointsCount || 12;
                                        const completed = sess.logs.length;
                                        const remaining = Math.max(0, total - completed);
                                        const percentage = Math.min(100, Math.round((completed / total) * 100));
                                        return (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 block leading-tight">
                                                    {completed}/{total} Titik ({percentage}%)
                                                </span>
                                                {remaining > 0 ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 animate-pulse">
                                                        🚨 {remaining} Sisa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                                                        ✅ Lengkap
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <>
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 block">{sess.logs.length} Titik</span>
                                            <span className="text-[7px] font-bold text-slate-450 uppercase block tracking-wider mt-0.5">Mandiri</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer: Time Range & Status */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1">
                                    <Clock size={10} className="text-slate-400" />
                                    {format(new Date(sess.startTime), 'HH:mm', { locale: id })} - {format(new Date(sess.endTime), 'HH:mm', { locale: id })}
                                </span>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                    sess.status === 'AMAN' 
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/50" 
                                        : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-800/50"
                                )}>
                                    {sess.status === 'AMAN' ? '🟢 AMAN' : '🚨 TEMUAN'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden gap-2">
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            variant="outline"
                            className="w-full rounded-xl text-xs font-bold"
                        >
                            Sebelumnya
                        </Button>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                            variant="outline"
                            className="w-full rounded-xl text-xs font-bold"
                        >
                            Selanjutnya
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Halaman <span className="text-slate-900 dark:text-white">{page}</span> dari <span className="text-slate-900 dark:text-white">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                                <Button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                    variant="outline"
                                    className="rounded-l-xl rounded-r-none text-xs font-bold h-9 border-slate-200 dark:border-slate-700"
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isLoading}
                                    variant="outline"
                                    className="rounded-r-xl rounded-l-none text-xs font-bold h-9 border-slate-200 dark:border-slate-700"
                                >
                                    Selanjutnya
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedSession(null)}>
                    <div 
                        className={cn(
                            "bg-white dark:bg-slate-900 w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]",
                            currentUserRole !== 'SECURITY' ? "max-w-5xl" : "max-w-2xl"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 md:p-8 bg-indigo-600 text-white relative shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Detail Sesi Putaran Patroli</p>
                                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <Shield className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                                        {selectedSession.isReal ? `Putaran #${selectedSession.id.substring(selectedSession.id.length - 4)}` : 'Patroli Mandiri'}
                                    </h3>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setSelectedSession(null)}
                                    className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20 text-xs">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Petugas</span>
                                    <span className="font-black uppercase">{currentUserRole === 'SECURITY' ? 'Anda' : selectedSession.user.name}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Tanggal</span>
                                    <span className="font-black">{format(new Date(selectedSession.startTime), 'dd MMMM yyyy', { locale: id })}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Waktu Sesi</span>
                                    <span className="font-black">
                                        {format(new Date(selectedSession.startTime), 'HH:mm', { locale: id })} - {format(new Date(selectedSession.endTime), 'HH:mm', { locale: id })} WIB
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Status Keseluruhan</span>
                                    <span className={cn(
                                        "inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                        selectedSession.status === 'AMAN' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                    )}>
                                        {selectedSession.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile Tab Switcher: Only visible on mobile/tablet (md:hidden) and only if it's an Admin/non-Security */}
                        {currentUserRole !== 'SECURITY' && (
                            <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0 md:hidden bg-slate-50/50 dark:bg-slate-900/50">
                                <button
                                    onClick={() => setActiveTab('timeline')}
                                    className={cn(
                                        "flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2",
                                        activeTab === 'timeline'
                                            ? "border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400"
                                            : "border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
                                    )}
                                >
                                    📷 Foto & Linimasa
                                </button>
                                <button
                                    onClick={() => setActiveTab('map')}
                                    className={cn(
                                        "flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2",
                                        activeTab === 'map'
                                            ? "border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400"
                                            : "border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
                                    )}
                                >
                                    🗺️ Jalur Peta
                                </button>
                            </div>
                        )}

                        {/* Modal Body - Grid layout for Admin, simple for Security */}
                        <div className={cn(
                            "flex-1 overflow-hidden grid grid-cols-1",
                            currentUserRole !== 'SECURITY' ? "md:grid-cols-2" : ""
                        )}>
                            {/* Left Column: Chronological Timeline */}
                            <div className={cn(
                                "p-6 md:p-8 overflow-y-auto max-h-[60vh] space-y-6 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 hide-scrollbar",
                                currentUserRole !== 'SECURITY' 
                                    ? (activeTab === 'timeline' ? "order-2 md:order-1 block" : "order-2 md:order-1 hidden md:block") 
                                    : "block"
                            )}>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garis Waktu Kunjungan Titik</h4>
                                
                                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-8">
                                    {selectedSession.logs.map((log, index) => (
                                        <div key={log.id} className="relative group/timeline animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                            {/* Timeline Dot Indicator */}
                                            <div className={cn(
                                                "absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm",
                                                log.status === 'AMAN' ? "bg-emerald-500" : "bg-rose-500"
                                            )}>
                                                {log.status === 'AMAN' ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <AlertTriangle className="w-2.5 h-2.5 text-white" />}
                                            </div>

                                            {/* Timeline Content Card */}
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                                {/* Line Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                            Titik #{index + 1}
                                                        </span>
                                                        <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                                                            {log.checkpoint.name}
                                                        </h5>
                                                        {log.checkpoint.location && (
                                                            <div className="flex items-start gap-1.5 mt-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">Ket:</span>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                    {log.checkpoint.location}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {format(new Date(log.createdAt), 'HH:mm:ss', { locale: id })}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                            log.status === 'AMAN' 
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800" 
                                                                : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-800"
                                                        )}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Catatan Petugas</span>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                                        &quot;{log.notes || 'Kondisi terpantau aman.'}&quot;
                                                    </p>
                                                </div>

                                                {/* Log Image */}
                                                <LazyPatrolImage logId={log.id} checkpointName={log.checkpoint.name} />

                                                {/* GPS details */}
                                                {currentUserRole !== 'SECURITY' && (
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                        <span className="flex items-center gap-1 font-bold">
                                                            <Navigation size={10} className="text-indigo-500" />
                                                            GPS: <code>{log.latitude}, {log.longitude}</code>
                                                        </span>
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} 
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center uppercase tracking-widest"
                                                        >
                                                            Maps <ExternalLink size={10} className="ml-1" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Path Map (Admin Only) */}
                            {currentUserRole !== 'SECURITY' && (
                                <div className={cn(
                                    "p-6 md:p-8 flex flex-col bg-white dark:bg-slate-900 space-y-4 max-h-[60vh] overflow-y-auto order-1 md:order-2 md:flex",
                                    activeTab === 'map' ? "flex" : "hidden md:flex"
                                )}>
                                    <div className="flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                                <Navigation size={16} />
                                            </div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jalur Pergerakan Patroli</h4>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                            {selectedSession.logs.length} Titik Pengecekan
                                        </span>
                                    </div>

                                    {/* Selected Checkpoint Map Preview */}
                                    <div className="h-[220px] md:h-auto md:flex-1 md:min-h-[320px] rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative overflow-hidden shadow-inner shrink-0">
                                        {(() => {
                                            const sortedLogs = [...selectedSession.logs].sort(
                                                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                            );
                                            
                                            if (sortedLogs.length === 0) {
                                                return (
                                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        Tidak ada koordinat terinput.
                                                    </div>
                                                );
                                            }

                                            let mapUrl = "";
                                            if (sortedLogs.length === 1) {
                                                const log = sortedLogs[0];
                                                mapUrl = `https://maps.google.com/maps?q=${log.latitude},${log.longitude}&z=16&output=embed`;
                                            } else {
                                                const first = sortedLogs[0];
                                                const last = sortedLogs[sortedLogs.length - 1];
                                                const middle = sortedLogs.slice(1, sortedLogs.length - 1);
                                                
                                                let daddrStr = "";
                                                if (middle.length > 0) {
                                                    daddrStr = middle.map(l => `${l.latitude},${l.longitude}`).join('+to:') + `+to:${last.latitude},${last.longitude}`;
                                                } else {
                                                    daddrStr = `${last.latitude},${last.longitude}`;
                                                }
                                                
                                                mapUrl = `https://maps.google.com/maps?saddr=${first.latitude},${first.longitude}&daddr=${daddrStr}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                                            }

                                            return (
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    className="absolute inset-0"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    src={mapUrl}
                                                />
                                            );
                                        })()}
                                    </div>

                                    {/* Action Button: Open Path in Google Maps */}
                                    {(() => {
                                        const sortedLogs = [...selectedSession.logs].sort(
                                            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                        );
                                        const waypoints = sortedLogs.map(l => `${l.latitude},${l.longitude}`).join('/');
                                        const googleMapsDirUrl = `https://www.google.com/maps/dir/${waypoints}`;

                                        return (
                                            <div className="space-y-2 shrink-0">
                                                <Button 
                                                    onClick={() => window.open(googleMapsDirUrl, '_blank')}
                                                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest py-5 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                                                    disabled={sortedLogs.length === 0}
                                                >
                                                    <ExternalLink size={12} />
                                                    Buka Rute Pergerakan Lengkap
                                                </Button>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase text-center leading-relaxed">
                                                    *Membuka peta navigasi rute berurutan dari titik pertama ke titik terakhir di Google Maps.
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex shrink-0">
                            <Button 
                                onClick={() => setSelectedSession(null)}
                                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest py-6"
                            >
                                Tutup Rincian Putaran
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

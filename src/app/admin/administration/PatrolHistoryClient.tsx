'use client';

import React, { useState, useEffect } from 'react';
import { 
    History, 
    Search,
    ChevronRight,
    X,
    User,
    Clock,
    Shield,
    Navigation,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getRecentPatrolLogs } from '@/actions/patrol';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    };
    status: string;
    notes: string | null;
    image: string | null;
    latitude: number;
    longitude: number;
    sessionId?: string | null;
    createdAt: Date;
}

export default function PatrolHistoryClient() {
    const [logs, setLogs] = useState<PatrolLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<PatrolLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        const result = await getRecentPatrolLogs(100); // Get last 100 logs
        if (result.success && result.data) {
            setLogs(result.data as PatrolLog[]);
        } else {
            toast.error(result.message || 'Gagal mengambil riwayat');
        }
        setIsLoading(false);
    };

    const filteredLogs = logs.filter(log => 
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.checkpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    Riwayat Laporan Patroli
                </h2>
                <div className="relative w-full md:w-80">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                        placeholder="Cari petugas, titik, atau status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs py-5"
                    />
                </div>
            </div>

            {/* Simplified Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Petugas</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Titik Patroli</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Putaran</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400 italic">Belum ada riwayat laporan.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr 
                                        key={log.id} 
                                        onClick={() => setSelectedLog(log)}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {format(new Date(log.createdAt), 'HH:mm', { locale: id })}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase">
                                                    {format(new Date(log.createdAt), 'dd MMM yy', { locale: id })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-600">
                                                    {log.user.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{log.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight line-clamp-1">
                                                {log.checkpoint.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.sessionId ? (
                                                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded uppercase">
                                                    #{log.sessionId.substring(log.sessionId.length - 4)}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-300 italic">No Session</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                                log.status === 'AMAN' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
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

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedLog(null)}>
                    <div 
                        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative h-48 bg-indigo-600 overflow-hidden">
                            {selectedLog.image ? (
                                <img src={selectedLog.image} alt="Bukti Patroli" className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Shield size={64} className="text-indigo-400/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Detail Laporan Patroli</p>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedLog.checkpoint.name}</h3>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setSelectedLog(null)}
                                className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto hide-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <User size={12} className="text-indigo-500" /> Petugas
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedLog.user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLog.user.role}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} className="text-indigo-500" /> Waktu Laporan
                                    </p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                        {format(new Date(selectedLog.createdAt), 'HH:mm:ss', { locale: id })} WIB
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {format(new Date(selectedLog.createdAt), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Keamanan</p>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2",
                                        selectedLog.status === 'AMAN' 
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-500/20" 
                                            : "bg-rose-50 text-rose-600 border-rose-500/20"
                                    )}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan / Temuan</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                        &quot;{selectedLog.notes || 'Laporan rutin, kondisi terpantau aman.'}&quot;
                                    </p>
                                </div>
                            </div>

                            {selectedLog.image && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Bukti Lapangan</p>
                                    <div className="rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                                        <img src={selectedLog.image} alt="Detail Bukti Patroli" className="w-full h-auto object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Navigation size={12} className="text-indigo-500" /> Lokasi GPS
                                </p>
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <code className="text-[10px] font-bold text-slate-500">{selectedLog.latitude}, {selectedLog.longitude}</code>
                                    <a 
                                        href={`https://www.google.com/maps?q=${selectedLog.latitude},${selectedLog.longitude}`} 
                                        target="_blank"
                                        className="text-[10px] font-black text-indigo-600 hover:underline flex items-center uppercase tracking-widest"
                                    >
                                        Buka di Maps <ExternalLink size={12} className="ml-1" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <Button 
                                onClick={() => setSelectedLog(null)}
                                className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest py-6"
                            >
                                Selesai Meninjau
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

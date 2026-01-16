'use client';

import React, { useState, useEffect } from 'react';
import { getActivityLogs, getUsers, deleteActivityLogs } from '@/actions/activity';
import { Loader2, History as HistoryIcon, User, Clock, Monitor, Trash2, CheckSquare, Square, Smartphone, Laptop, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';

interface Log {
    id: string;
    action: string;
    target: string | null;
    device: string | null;
    createdAt: Date;
    user: {
        name: string;
        username: string;
        image: string | null;
    };
}

interface FilterUser {
    id: string;
    name: string;
    username: string;
}

export default function ActivityLogTab() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [users, setUsers] = useState<FilterUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [logsData, usersData] = await Promise.all([
            getActivityLogs(50, selectedUserId),
            getUsers()
        ]);
        setLogs(logsData);
        setUsers(usersData);
        setLoading(false);
    };

    const loadLogsOnly = async () => {
        setLoading(true);
        const logsData = await getActivityLogs(50, selectedUserId);
        setLogs(logsData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) {
            loadLogsOnly();
            setSelectedIds([]); // Reset selection when user filter changes
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUserId]);

    const handleSelectAll = () => {
        if (selectedIds.length === logs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(logs.map(log => log.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Hapus ${selectedIds.length} data log terpilih?`)) return;

        setDeleting(true);
        try {
            const result = await deleteActivityLogs(selectedIds);
            if (result.success) {
                toast.success('Data Berhasil Dihapus', {
                    description: `${selectedIds.length} log aktivitas telah dihapus.`
                });
                setSelectedIds([]);
                loadLogsOnly();
            } else {
                toast.error(result.message || 'Gagal menghapus data');
            }
        } catch (_error) {
            toast.error('Terjadi kesalahan saat menghapus data');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Log Aktivitas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Aktivitas Terbaru</h2>
                    <p className="text-[10px] md:text-xs text-slate-500">Mencatat riwayat akses menu selama 3 hari terakhir (Auto-clean)</p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    >
                        <option value="all">SEMUA USER</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name.toUpperCase()} (@{user.username})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={loadLogsOnly}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                        <HistoryIcon size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                            <span className="sm:hidden">{selectedIds.length}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-4 py-4 w-10">
                                    <button
                                        onClick={handleSelectAll}
                                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 transition-colors"
                                    >
                                        {selectedIds.length === logs.length && logs.length > 0 ? (
                                            <CheckSquare size={16} />
                                        ) : (
                                            <Square size={16} className="text-slate-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Device</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        Belum ada data log aktivitas.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedIds.includes(log.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                            }`}
                                        onClick={() => toggleSelect(log.id)}
                                    >
                                        <td className="px-4 py-4">
                                            <button className="text-indigo-600">
                                                {selectedIds.includes(log.id) ? (
                                                    <CheckSquare size={16} />
                                                ) : (
                                                    <Square size={16} className="text-slate-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                    {log.user.image ? (
                                                        <Image src={log.user.image} alt={log.user.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={14} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{log.user.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">@{log.user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {log.device === 'MOBILE' ? (
                                                    <div className="flex flex-col items-center gap-1 group">
                                                        <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50">
                                                            <Smartphone size={14} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">Mobile</span>
                                                    </div>
                                                ) : log.device === 'WINDOWS' ? (
                                                    <div className="flex flex-col items-center gap-1 group">
                                                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                                            <Laptop size={14} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Windows</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 group">
                                                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                                                            <Monitor size={14} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{log.device || 'Unknown'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                                                {log.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Monitor size={12} className="text-slate-400" />
                                                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{log.target || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                    {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile & Tablet View: List Cards */}
            <div className="lg:hidden space-y-3">
                {logs.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 italic text-sm">
                        Belum ada data log aktivitas.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            onClick={() => toggleSelect(log.id)}
                            className={`bg-white dark:bg-slate-900 rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer ${selectedIds.includes(log.id) ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="text-indigo-600">
                                        {selectedIds.includes(log.id) ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        {log.user.image ? (
                                            <Image src={log.user.image} alt={log.user.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={16} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{log.user.name}</p>
                                        <p className="text-[10px] text-slate-500">@{log.user.username}</p>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {log.action}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Monitor size={12} />
                                        <span>Device</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold">
                                        {log.device === 'MOBILE' ? (
                                            <><Smartphone size={10} className="text-orange-500" /> <span className="text-orange-600">MOBILE</span></>
                                        ) : log.device === 'WINDOWS' ? (
                                            <><Laptop size={10} className="text-blue-500" /> <span className="text-blue-600">WINDOWS</span></>
                                        ) : (
                                            <><Monitor size={10} className="text-slate-400" /> <span className="text-slate-500">{log.device || 'UNKNOWN'}</span></>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <ShieldCheck size={12} />
                                        <span>Target</span>
                                    </div>
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.target || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock size={12} />
                                        <span>Waktu</span>
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {format(new Date(log.createdAt), 'dd MMM, HH:mm', { locale: id })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

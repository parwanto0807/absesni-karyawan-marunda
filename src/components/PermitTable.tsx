'use client';

import React, { useState } from 'react';
import { Check, X, Shield, Users, UserCog, Camera, Loader2, RotateCcw } from 'lucide-react';
import { approvePermit, resetPermit } from '@/actions/permits';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PermitTable({ permits, currentUser }: { permits: any[], currentUser: any }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const totalPages = Math.ceil(permits.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRows = permits.slice(startIndex, startIndex + rowsPerPage);

    const handleAction = async (permitId: string, status: 'APPROVED' | 'REJECTED') => {
        setLoading(`${permitId}-${status}`);
        const result = await approvePermit(permitId, currentUser.role, status, currentUser.id);
        setLoading(null);
        if (result.success) {
            toast.success('Pembaruan Berhasil', {
                description: result.message
            });
        } else {
            toast.error('Pembaruan Gagal', {
                description: result.message
            });
        }
    };

    const handleReset = async (permitId: string) => {
        setLoading(`${permitId}-RESET`);
        const result = await resetPermit(permitId, currentUser.role);
        setLoading(null);
        if (result.success) {
            toast.success('Reset Berhasil', {
                description: result.message
            });
        } else {
            toast.error('Reset Gagal', {
                description: result.message
            });
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED': return "bg-emerald-500 text-white";
            case 'REJECTED': return "bg-rose-500 text-white";
            default: return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return "DISETUJUI";
            case 'REJECTED': return "DITOLAK";
            default: return "PENDING";
        }
    };

    const isPermitExpired = (endDate: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        return end < today;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">

            {/* Mobile View (Cards) */}
            <div className="md:hidden">
                {permits.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Shield size={40} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada pengajuan izin</span>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentRows.map((permit) => (
                            <div key={permit.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                {/* Header: User Info & Status */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-xs overflow-hidden">
                                            {permit.user.image ? (
                                                <img src={permit.user.image} alt={permit.user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                permit.user.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{permit.user.name}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                {permit.user.employeeId}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest", getStatusStyles(permit.finalStatus))}>
                                        {getStatusLabel(permit.finalStatus)}
                                    </span>
                                </div>

                                {/* Content: Date & Reason */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md px-1.5 py-0.5 text-[8px] font-black">{permit.type}</span>
                                        <div className="flex h-full items-center space-x-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                {new Date(permit.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-300">→</span>
                                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                {new Date(permit.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        {permit.image && (
                                            <a href={permit.image} target="_blank" rel="noreferrer" className="shrink-0 h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all border border-indigo-200 dark:border-indigo-800">
                                                <Camera size={12} />
                                            </a>
                                        )}
                                        <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                                            {permit.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {(currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.finalStatus === 'PENDING' ? (
                                    <div className="flex justify-end space-x-2 pt-1">
                                        <button
                                            onClick={() => handleAction(permit.id, 'APPROVED')}
                                            disabled={!!loading}
                                            className="flex-1 h-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest space-x-1"
                                        >
                                            {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <><Check size={12} /><span>Setujui</span></>}
                                        </button>
                                        <button
                                            onClick={() => handleAction(permit.id, 'REJECTED')}
                                            disabled={!!loading}
                                            className="flex-1 h-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest space-x-1"
                                        >
                                            {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <><X size={12} /><span>Tolak</span></>}
                                        </button>
                                    </div>
                                ) : (currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && (permit.finalStatus === 'APPROVED' || permit.finalStatus === 'REJECTED') && !isPermitExpired(permit.endDate) ? (
                                    <div className="flex justify-end pt-1">
                                        <button
                                            onClick={() => handleReset(permit.id)}
                                            disabled={!!loading}
                                            className="h-8 px-4 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest space-x-1"
                                        >
                                            {loading === `${permit.id}-RESET` ? <Loader2 className="animate-spin h-3 w-3" /> : <><RotateCcw size={12} /><span>Reset</span></>}
                                        </button>
                                    </div>
                                ) : (
                                    permit.finalStatus === 'PENDING' && (
                                        <div className="pt-1">
                                            <div className="w-full h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30 flex items-center justify-center animate-pulse">
                                                Menunggu Approval
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop/Tablet View (Table) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Karyawan</th>
                            <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Jenis & Tanggal</th>
                            <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Alasan & Lampiran</th>
                            <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                            <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permits.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                        <Shield size={40} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada pengajuan izin</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            currentRows.map((permit) => (
                                <tr key={permit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-xs md:text-base overflow-hidden">
                                                {permit.user.image ? (
                                                    <img src={permit.user.image} alt={permit.user.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    permit.user.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{permit.user.name}</div>
                                                <div className="text-[9px] md:text-base font-bold text-slate-400 uppercase tracking-widest">
                                                    {permit.user.employeeId} <span className="text-slate-300 mx-1">|</span> <span className="text-indigo-600">{permit.user.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="space-y-1">
                                            <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md px-1.5 py-0.5 text-[8px] md:text-[10px] font-black">{permit.type}</span>
                                            <div className="flex items-center pt-0.5">
                                                <div className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center space-x-1">
                                                    <span className="text-[8px] md:text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                        {new Date(permit.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\./g, '-')}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-300">→</span>
                                                    <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                        {new Date(permit.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\./g, '-')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center space-x-2">
                                            {permit.image && (
                                                <a href={permit.image} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm hover:shadow-md" title="Lihat Lampiran">
                                                    <Camera size={16} />
                                                </a>
                                            )}
                                            <span className="text-[9px] md:text-sm font-bold text-slate-500 dark:text-slate-400 text-wrap max-w-[440px]" title={permit.reason}>{permit.reason}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={cn("px-2.5 py-1 rounded-md text-[8px] md:text-xs font-black uppercase tracking-widest", getStatusStyles(permit.finalStatus))}>
                                            {getStatusLabel(permit.finalStatus)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end space-x-1.5">
                                            {(currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.finalStatus === 'PENDING' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'APPROVED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Setujui"
                                                    >
                                                        {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'REJECTED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Tolak"
                                                    >
                                                        {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={14} />}
                                                    </button>
                                                </>
                                            ) : (currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && (permit.finalStatus === 'APPROVED' || permit.finalStatus === 'REJECTED') && !isPermitExpired(permit.endDate) ? (
                                                <button
                                                    onClick={() => handleReset(permit.id)}
                                                    disabled={!!loading}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                    title="Reset ke Pending"
                                                >
                                                    {loading === `${permit.id}-RESET` ? <Loader2 className="animate-spin h-3 w-3" /> : <RotateCcw size={14} />}
                                                </button>
                                            ) : (
                                                <div className="flex items-center">
                                                    {permit.finalStatus === 'PENDING' ? (
                                                        <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30 animate-pulse">
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800">
                                                            Selesai
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {permits.length > 0 && (
                <div className="px-4 md:px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[8px] md:text-sm font-black uppercase tracking-widest text-slate-400">
                        {startIndex + 1}-{Math.min(startIndex + rowsPerPage, permits.length)} dari {permits.length}
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-7 px-2 md:px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[8px] md:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all active:scale-95"
                        >
                            Prev
                        </button>
                        <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-[8px] md:text-sm font-black shadow-lg shadow-indigo-200/50 dark:shadow-none">
                            {currentPage}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-7 px-2 md:px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[8px] md:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

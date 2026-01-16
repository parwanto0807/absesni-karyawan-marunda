'use client';

import React, { useState } from 'react';
import { Check, X, Shield, Users, UserCog, Camera, Loader2, RotateCcw } from 'lucide-react';
import { approvePermit, resetPermit } from '@/actions/permits';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TIMEZONE } from '@/lib/date-utils';
import NextImage from 'next/image';

interface User {
    name: string;
    employeeId: string;
    role: string;
    image: string | null;
}

interface Permit {
    id: string;
    userId: string;
    type: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    image: string | null;
    adminStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rt03Status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rt04Status: 'PENDING' | 'APPROVED' | 'REJECTED';
    finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    user: User;
}

interface PermitTableProps {
    permits: Permit[];
    currentUser: {
        id: string;
        role: string;
        employeeId: string;
    };
}

export default function PermitTable({ permits, currentUser }: PermitTableProps) {
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
        const result = await resetPermit(permitId, currentUser.role, currentUser.id);
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
                                        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md px-1.5 py-0.5 text-[8px] font-black">{permit.type.replace(/_/g, ' ')}</span>
                                        <div className="flex h-full items-center space-x-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                {new Date(permit.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: TIMEZONE })}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-300">→</span>
                                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                {new Date(permit.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: TIMEZONE })}
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
                                {/* Dual Approval Progress */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    {/* Admin/PIC Column */}
                                    <div className="col-span-2 flex flex-col space-y-1 items-center pb-2 mb-1 border-b border-slate-50 dark:border-slate-800/50 text-center">
                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Admin BPL</div>
                                        {(currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.adminStatus === 'PENDING' ? (
                                            <div className="flex items-center space-x-1 w-full max-w-[240px]">
                                                <button
                                                    onClick={() => handleAction(permit.id, 'APPROVED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(permit.id, 'REJECTED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={12} />}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "h-7 w-full max-w-[240px] rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center border",
                                                permit.adminStatus === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.adminStatus === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                {permit.adminStatus === 'APPROVED' ? "Menyetujui" : permit.adminStatus === 'REJECTED' ? "Ditolak" : "Belum Menyetujui"}
                                            </div>
                                        )}
                                    </div>

                                    {/* RT-03 Column */}
                                    <div className="flex flex-col space-y-1 items-center text-center">
                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ketua RT-03</div>
                                        {currentUser.role === 'RT' && currentUser.employeeId === 'RT-03' && permit.rt03Status === 'PENDING' ? (
                                            <div className="flex items-center space-x-1 w-full">
                                                <button
                                                    onClick={() => handleAction(permit.id, 'APPROVED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center px-1"
                                                >
                                                    {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(permit.id, 'REJECTED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center px-1"
                                                >
                                                    {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={12} />}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "h-7 w-full rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center border",
                                                permit.rt03Status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.rt03Status === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                {permit.rt03Status === 'APPROVED' ? "Menyetujui" : permit.rt03Status === 'REJECTED' ? "Ditolak" : "Belum Menyetujui"}
                                            </div>
                                        )}
                                    </div>

                                    {/* RT-04 Column */}
                                    <div className="flex flex-col space-y-1 items-center text-center">
                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ketua RT-04</div>
                                        {currentUser.role === 'RT' && currentUser.employeeId === 'RT-04' && permit.rt04Status === 'PENDING' ? (
                                            <div className="flex items-center space-x-1 w-full">
                                                <button
                                                    onClick={() => handleAction(permit.id, 'APPROVED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center px-1"
                                                >
                                                    {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(permit.id, 'REJECTED')}
                                                    disabled={!!loading}
                                                    className="flex-1 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center px-1"
                                                >
                                                    {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={12} />}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "h-7 w-full rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center border",
                                                permit.rt04Status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.rt04Status === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                {permit.rt04Status === 'APPROVED' ? "Menyetujui" : permit.rt04Status === 'REJECTED' ? "Ditolak" : "Belum Menyetujui"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reset Button (Only for the role that has already made a decision) */}
                                {((((currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.adminStatus !== 'PENDING') ||
                                    (currentUser.role === 'RT' && currentUser.employeeId === 'RT-03' && permit.rt03Status !== 'PENDING') ||
                                    (currentUser.role === 'RT' && currentUser.employeeId === 'RT-04' && permit.rt04Status !== 'PENDING'))) && (
                                        <div className="pt-2">
                                            <button
                                                onClick={() => handleReset(permit.id)}
                                                disabled={!!loading}
                                                className="w-full h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest space-x-1"
                                            >
                                                {loading === `${permit.id}-RESET` ? <Loader2 className="animate-spin h-3 w-3" /> : <><RotateCcw size={12} /><span>Reset Approval {(currentUser.role === 'RT' ? `RT-${currentUser.employeeId.split('-')[1]}` : 'Admin')}</span></>}
                                            </button>
                                        </div>
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
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-xs md:text-base overflow-hidden relative">
                                                {permit.user.image ? (
                                                    <NextImage src={permit.user.image} alt={permit.user.name} fill className="object-cover" unoptimized />
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
                                            <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md px-1.5 py-0.5 text-[8px] md:text-[10px] font-black">{permit.type.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center pt-0.5">
                                                <div className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center space-x-1">
                                                    <span className="text-[8px] md:text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                        {new Date(permit.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', timeZone: TIMEZONE }).replace(/\./g, '-')}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-300">→</span>
                                                    <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                        {new Date(permit.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', timeZone: TIMEZONE }).replace(/\./g, '-')}
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
                                    <td className="px-5 py-3 text-center min-w-[150px]">
                                        <div className="flex flex-col items-center space-y-1.5">
                                            <span className={cn("px-2.5 py-1 rounded-md text-[8px] md:text-[11px] font-black uppercase tracking-widest border whitespace-nowrap w-full",
                                                permit.adminStatus === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.adminStatus === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                Admin: {permit.adminStatus === 'APPROVED' ? "Setuju" : permit.adminStatus === 'REJECTED' ? "Tolak" : "..."}
                                            </span>
                                            <span className={cn("px-2.5 py-1 rounded-md text-[8px] md:text-[11px] font-black uppercase tracking-widest border whitespace-nowrap w-full",
                                                permit.rt03Status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.rt03Status === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                RT-03: {permit.rt03Status === 'APPROVED' ? "Menyetujui" : permit.rt03Status === 'REJECTED' ? "Ditolak" : "Belum Menyetujui"}
                                            </span>
                                            <span className={cn("px-2.5 py-1 rounded-md text-[8px] md:text-[11px] font-black uppercase tracking-widest border whitespace-nowrap w-full",
                                                permit.rt04Status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    permit.rt04Status === 'REJECTED' ? "bg-rose-50 border-rose-100 text-rose-600" :
                                                        "bg-slate-50 border-slate-100 text-slate-400"
                                            )}>
                                                RT-04: {permit.rt04Status === 'APPROVED' ? "Menyetujui" : permit.rt04Status === 'REJECTED' ? "Ditolak" : "Belum Menyetujui"}
                                            </span>
                                            <div className="pt-0.5">
                                                <span className={cn("px-3 py-1 rounded-full text-[9px] md:text-[12px] font-black uppercase tracking-widest shadow-sm", getStatusStyles(permit.finalStatus))}>
                                                    {getStatusLabel(permit.finalStatus)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex flex-col space-y-2">
                                            {/* Action for Admin/PIC */}
                                            {(currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.adminStatus === 'PENDING' && (
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'APPROVED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Setujui (Admin BPL)"
                                                    >
                                                        {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'REJECTED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Tolak (Admin BPL)"
                                                    >
                                                        {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={14} />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action for RT-03 */}
                                            {currentUser.role === 'RT' && currentUser.employeeId === 'RT-03' && permit.rt03Status === 'PENDING' && (
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'APPROVED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Setujui (Ketua RT-03)"
                                                    >
                                                        {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'REJECTED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Tolak (Ketua RT-03)"
                                                    >
                                                        {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={14} />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action for RT-04 */}
                                            {currentUser.role === 'RT' && currentUser.employeeId === 'RT-04' && permit.rt04Status === 'PENDING' && (
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'APPROVED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Setujui (Ketua RT-04)"
                                                    >
                                                        {loading === `${permit.id}-APPROVED` ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(permit.id, 'REJECTED')}
                                                        disabled={!!loading}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50"
                                                        title="Tolak (Ketua RT-04)"
                                                    >
                                                        {loading === `${permit.id}-REJECTED` ? <Loader2 className="animate-spin h-3 w-3" /> : <X size={14} />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Reset Action (Only for the role that has already made a decision) */}
                                            {((((currentUser.role === 'ADMIN' || currentUser.role === 'PIC') && permit.adminStatus !== 'PENDING') ||
                                                (currentUser.role === 'RT' && currentUser.employeeId === 'RT-03' && permit.rt03Status !== 'PENDING') ||
                                                (currentUser.role === 'RT' && currentUser.employeeId === 'RT-04' && permit.rt04Status !== 'PENDING'))) && !isPermitExpired(permit.endDate) && (
                                                    <button
                                                        onClick={() => handleReset(permit.id)}
                                                        disabled={!!loading}
                                                        className="h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 shadow-lg shadow-amber-200/50 dark:shadow-none transition-all active:scale-90 disabled:opacity-50 text-[9px] font-black uppercase tracking-widest"
                                                        title={`Reset Approval ${(currentUser.role === 'RT' ? `RT-${currentUser.employeeId.split('-')[1]}` : 'Admin')}`}
                                                    >
                                                        {loading === `${permit.id}-RESET` ? <Loader2 className="animate-spin h-3 w-3" /> : <div className="flex items-center space-x-1"><RotateCcw size={14} /><span>Reset {(currentUser.role === 'RT' ? `RT-${currentUser.employeeId.split('-')[1]}` : 'Admin')}</span></div>}
                                                    </button>
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

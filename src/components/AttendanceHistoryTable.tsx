'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMEZONE } from '@/lib/date-utils';
import UserAvatar from '@/components/UserAvatar';
import { ImageModal, ImageModalMobile } from '@/components/ImageModal';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';
import Pagination from './Pagination';

interface VirtualAttendance {
    id: string;
    userId: string;
    clockIn: Date;
    clockOut: Date | null;
    status: any;
    shiftType: string;
    scheduledClockIn?: Date | null;
    scheduledClockOut?: Date | null;
    notes?: string | null;
    isLate: boolean;
    lateMinutes: number;
    isEarlyLeave: boolean;
    earlyLeaveMinutes: number;
    latitude: number;
    longitude: number;
    address: string | null;
    image: string | null;
    user: {
        name: string;
        employeeId: string;
        role: string;
        image: string | null;
    };
}

interface AttendanceHistoryTableProps {
    initialAttendances: VirtualAttendance[];
}

export default function AttendanceHistoryTable({ initialAttendances }: AttendanceHistoryTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const totalPages = Math.ceil(initialAttendances.length / ITEMS_PER_PAGE);
    const paginatedAttendances = initialAttendances.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'LATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ABSENT': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'SICK': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PERMIT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'SHIFT_CHANGE': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
    };

    return (
        <div className="space-y-6">
            {/* Top Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={initialAttendances.length}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mb-0 pt-0"
            />

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {paginatedAttendances.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-lg p-12 text-center text-slate-400">
                        <Clock size={48} className="mx-auto mb-2 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada riwayat absensi</span>
                    </div>
                ) : (
                    paginatedAttendances.map((attendance) => (
                        <div key={attendance.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-3">
                            {/* Header: User Info & Status */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <UserAvatar
                                        userId={attendance.userId}
                                        userName={attendance.user.name}
                                        className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-xs uppercase overflow-hidden shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{attendance.user.name}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{attendance.user.employeeId}</div>
                                    </div>
                                </div>
                                <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0", getStatusColor(attendance.status))}>
                                    {attendance.status === 'PRESENT' ? 'HADIR' :
                                        attendance.status === 'ABSENT' ? 'TIDAK HADIR' :
                                            attendance.status === 'SICK' ? 'SAKIT' :
                                                attendance.status === 'PERMIT' ? 'IZIN' :
                                                    attendance.status === 'SHIFT_CHANGE' ? 'TUKAR SHIFT' :
                                                        attendance.status}
                                </span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center justify-between text-[9px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="flex items-center space-x-1">
                                    <Calendar size={10} className="text-slate-400" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE })}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end space-y-2 mt-1">
                                    {/* IN Group */}
                                    <div className="flex flex-col items-end">
                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            <span className="text-slate-400 mr-1">In:</span>
                                            <span className="font-bold text-indigo-600">{new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB</span>
                                        </div>
                                        {attendance.isLate && (
                                            <span className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900">
                                                Telat {formatDuration(attendance.lateMinutes)}
                                            </span>
                                        )}
                                    </div>

                                    {/* OUT Group */}
                                    {(attendance.clockOut || attendance.scheduledClockOut) && (
                                        <div className="flex flex-col items-end">
                                            {attendance.clockOut ? (
                                                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                    <span className="text-slate-400 mr-1">Out:</span>
                                                    <span className="font-bold text-indigo-600">{new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] italic text-slate-300">Belum Absen Pulang</span>
                                            )}

                                            {attendance.isEarlyLeave && (
                                                <span className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900">
                                                    Cepat {formatDuration(attendance.earlyLeaveMinutes)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <MapPin size={12} className="text-rose-500 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-500 truncate">
                                        {attendance.address || (attendance.latitude ? `${attendance.latitude}, ${attendance.longitude}` : '---')}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Perf</span>
                                        <span className={cn("text-[10px] font-black", getPerformanceColor(calculateDailyPerformance(attendance)).split(' ')[0])}>
                                            {calculateDailyPerformance(attendance)}%
                                        </span>
                                    </div>
                                    {attendance.image ? (
                                        <ImageModalMobile src={attendance.image} alt="Absen" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                                            <XCircle size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400">Karyawan</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center">Jadwal Shift</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center">Waktu Absen</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400">Lokasi / GPS</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center">Performance</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400">Foto</th>
                                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAttendances.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center text-slate-300">
                                        <Clock size={48} className="mx-auto mb-2 opacity-20" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Belum ada riwayat absensi</span>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAttendances.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <UserAvatar
                                                    userId={attendance.userId}
                                                    userName={attendance.user.name}
                                                    className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-sm uppercase overflow-hidden"
                                                />
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{attendance.user.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{attendance.user.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 mb-2">
                                                    {attendance.shiftType || 'OFF'}
                                                </span>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    {attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                    {' - '}
                                                    {attendance.scheduledClockOut ? new Date(attendance.scheduledClockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                                                    {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE })}
                                                </div>
                                                <div className="text-[11px] font-bold">
                                                    <span className="text-indigo-600">IN: {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })}</span>
                                                    {attendance.clockOut && (
                                                        <span className="text-slate-400 ml-2">OUT: {new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })}</span>
                                                    )}
                                                </div>
                                                {(attendance.isLate || attendance.isEarlyLeave) && (
                                                    <div className="flex gap-1 mt-1">
                                                        {attendance.isLate && <span className="text-[9px] font-bold text-amber-600 uppercase">Telat</span>}
                                                        {attendance.isEarlyLeave && <span className="text-[9px] font-bold text-rose-600 uppercase">Cepat</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 max-w-[200px]">
                                                <MapPin size={14} className="text-rose-500 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-500 truncate" title={attendance.address ?? undefined}>
                                                    {attendance.address || (attendance.latitude ? `${attendance.latitude}, ${attendance.longitude}` : '---')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center w-24 mx-auto">
                                                <span className={cn("text-[10px] font-black mb-1", getPerformanceColor(calculateDailyPerformance(attendance)).split(' ')[0])}>
                                                    {calculateDailyPerformance(attendance)}%
                                                </span>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", getPerformanceBarColor(calculateDailyPerformance(attendance)))}
                                                        style={{ width: `${calculateDailyPerformance(attendance)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {attendance.image ? (
                                                <ImageModal src={attendance.image} alt="Absen" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mx-auto">
                                                    <XCircle size={16} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", getStatusColor(attendance.status))}>
                                                {attendance.status === 'PRESENT' ? 'HADIR' :
                                                    attendance.status === 'ABSENT' ? 'TIDAK HADIR' :
                                                        attendance.status === 'SICK' ? 'SAKIT' :
                                                            attendance.status === 'PERMIT' ? 'IZIN' :
                                                                attendance.status === 'SHIFT_CHANGE' ? 'TUKAR SHIFT' :
                                                                    attendance.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={initialAttendances.length}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-6"
            />
        </div>
    );
}

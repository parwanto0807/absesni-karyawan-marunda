import React from 'react';
import { getAttendances } from '@/actions/attendance';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Clock, Download, Filter, Search, Calendar, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIMEZONE } from '@/lib/date-utils';
import { fromZonedTime } from 'date-fns-tz';
import { ImageModal, ImageModalMobile } from '@/components/ImageModal';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';

import { prisma } from '@/lib/db';
import HistoryFilter from '@/components/HistoryFilter';
import ExportButtons from '@/components/ExportButtons';
import { getShiftForDate, getStaticSchedule, getShiftTimings, ShiftCode } from '@/lib/schedule-utils';
import { getStartOfDayJakarta, getEndOfDayJakarta } from '@/lib/date-utils';

export default async function HistoryPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    // Fetch users for filter (Admin/PIC only)
    let filterUsers;
    if (session.role === 'ADMIN' || session.role === 'PIC') {
        filterUsers = await prisma.user.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    // Determine filter parameters
    let targetUserId: string | undefined = session.userId;
    if (session.role === 'ADMIN' || session.role === 'PIC') {
        const pUserId = searchParams.userId;
        const pUserIdStr = Array.isArray(pUserId) ? pUserId[0] : pUserId;
        targetUserId = pUserIdStr || undefined;
    }

    const parseDate = (d: string | string[] | undefined) => {
        if (!d) return undefined;
        const str = Array.isArray(d) ? d[0] : d;
        // Interpret as 00:00:00 in Jakarta
        const date = fromZonedTime(`${str} 00:00:00`, TIMEZONE);
        return isNaN(date.getTime()) ? undefined : date;
    };

    const startDate = parseDate(searchParams.startDate) || getStartOfDayJakarta(new Date('2026-01-12'));
    const endDate = parseDate(searchParams.endDate) || getEndOfDayJakarta(new Date());

    // 1. Fetch Actual Attendances
    const actualAttendances = await getAttendances(targetUserId, startDate, endDate);

    // 2. Fetch Users to check for absence
    const usersForAbsence = await prisma.user.findMany({
        where: {
            role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] },
            ...(targetUserId ? { id: targetUserId } : {})
        },
        include: {
            schedules: {
                where: {
                    date: { gte: startDate, lte: endDate }
                }
            },
            permits: {
                where: {
                    finalStatus: 'APPROVED',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                }
            }
        }
    });

    // 3. Generate Virtual Records
    const virtualRecords: any[] = [];
    const dateRange: Date[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        dateRange.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const now = new Date();

    for (const user of usersForAbsence) {
        for (const date of dateRange) {
            const dayStart = getStartOfDayJakarta(date);

            // Check if user has attendance for this day
            const hasAttendance = actualAttendances.some(att =>
                att.userId === user.id &&
                getStartOfDayJakarta(new Date(att.clockIn)).getTime() === dayStart.getTime()
            );

            if (!hasAttendance) {
                // Determine shift
                let shiftCode = 'OFF';
                const manual = user.schedules.find(s => getStartOfDayJakarta(s.date).getTime() === dayStart.getTime());

                if (manual) {
                    shiftCode = manual.shiftCode;
                } else if (user.role === 'LINGKUNGAN' || user.role === 'KEBERSIHAN') {
                    shiftCode = getStaticSchedule(user.role, date);
                } else {
                    shiftCode = getShiftForDate(user.rotationOffset, date);
                }

                if (shiftCode !== 'OFF') {
                    const timings = getShiftTimings(shiftCode, date);
                    if (timings) {
                        // Check for approved permit
                        const permit = user.permits.find(p =>
                            getStartOfDayJakarta(p.startDate).getTime() <= dayStart.getTime() &&
                            getEndOfDayJakarta(p.endDate).getTime() >= dayStart.getTime()
                        );

                        // Only show absence if shift start window has passed (allowing some buffer)
                        // Or if it's a past date
                        const isPastDate = dayStart.getTime() < getStartOfDayJakarta(now).getTime();
                        const isToday = dayStart.getTime() === getStartOfDayJakarta(now).getTime();
                        const waitTimePassed = isToday && now.getTime() > (timings.start.getTime() + 2 * 60 * 60 * 1000);

                        if (isPastDate || waitTimePassed || permit) {
                            virtualRecords.push({
                                id: `absent-${user.id}-${dayStart.getTime()}`,
                                userId: user.id,
                                clockIn: timings.start,
                                status: permit ? (permit.type === 'SAKIT' ? 'SICK' : 'PERMIT') : 'ABSENT',
                                shiftType: shiftCode,
                                scheduledClockIn: timings.start,
                                scheduledClockOut: timings.end,
                                notes: permit ? permit.reason : 'Tidak ada keterangan',
                                user: {
                                    name: user.name,
                                    employeeId: user.employeeId,
                                    role: user.role,
                                    image: user.image
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    // 4. Merge and Sort
    const attendances = [...actualAttendances, ...virtualRecords].sort((a, b) =>
        new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
    );

    // Get filter info for export
    const selectedUser = filterUsers?.find(u => u.id === targetUserId);
    const filterInfo = {
        userName: selectedUser?.name,
        startDate: searchParams.startDate ? String(searchParams.startDate) : undefined,
        endDate: searchParams.endDate ? String(searchParams.endDate) : undefined,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'LATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ABSENT': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'SICK': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PERMIT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    // Helper to format duration: > 60 mins becomes "X Jam Y Menit"
    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
    };

    return (
        <div className="w-full mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                    <div className="inline-flex items-center space-x-2 px-2 md:px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                        <Clock size={10} className="md:w-3 md:h-3" />
                        <span>Log Kehadiran</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                        Riwayat <span className="text-indigo-600">Absensi</span>
                    </h1>
                    <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {session.role === 'ADMIN' || session.role === 'PIC'
                            ? 'Memantau seluruh data absensi karyawan Cluster Taman Marunda .'
                            : 'Melihat catatan kehadiran pribadi Anda.'}
                    </p>
                </div>

                <ExportButtons attendances={attendances} filterInfo={filterInfo} />
            </div>

            <HistoryFilter users={filterUsers} />

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {attendances.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-lg p-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                            <Clock size={40} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada riwayat absensi</span>
                        </div>
                    </div>
                ) : (
                    attendances.map((attendance) => (
                        <div key={attendance.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-3">
                            {/* Header: User Info & Status */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-xs uppercase overflow-hidden shrink-0">
                                        {attendance.user.image ? (
                                            <img src={attendance.user.image} alt={attendance.user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            attendance.user.name.charAt(0)
                                        )}
                                    </div>
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

                                    {/* Shift Info (Compact) */}
                                    {(attendance.scheduledClockIn || attendance.shiftType) && (
                                        <div className="flex items-center justify-end space-x-1 text-[8px] font-medium text-slate-300 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 w-full">
                                            <span className="uppercase tracking-widest">{attendance.shiftType || 'SHIFT'}</span>
                                            <span>
                                                {attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                <span className="mx-1">||</span>
                                                {attendance.scheduledClockOut ? new Date(attendance.scheduledClockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <MapPin size={12} className="text-rose-500 shrink-0" />
                                    <div className="flex items-center space-x-1 min-w-0">
                                        <span className="text-[9px] font-bold text-slate-500 truncate" title={attendance.address ?? undefined}>
                                            {attendance.address || `${attendance.latitude}, ${attendance.longitude}`}
                                        </span>
                                        {attendance.address && <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />}
                                    </div>
                                </div>

                                {/* Mobile Performance Indicator */}
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
                            {attendances.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                            <Clock size={48} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Belum ada riwayat absensi</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attendances.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center font-black text-sm uppercase overflow-hidden">
                                                    {attendance.user.image ? (
                                                        <img src={attendance.user.image} alt={attendance.user.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        attendance.user.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{attendance.user.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{attendance.user.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center w-full min-w-[150px]">
                                                {/* Shift Badge Row */}
                                                <div className="flex items-center justify-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 w-full">
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                        {attendance.shiftType || 'OFF'}
                                                    </span>
                                                </div>

                                                {/* Scheduled Times Grid */}
                                                <div className="grid grid-cols-2 gap-4 w-full uppercase font-bold">
                                                    {/* IN Column */}
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="text-[12px] font-medium whitespace-nowrap">
                                                            <span className="text-slate-400 font-bold mr-1">In :</span>
                                                            <span className="text-slate-600 dark:text-slate-300 font-bold">
                                                                {attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* OUT Column */}
                                                    <div className="flex flex-col items-center justify-center border-l border-slate-100 dark:border-slate-800 pl-4">
                                                        <div className="text-[12px] font-medium whitespace-nowrap">
                                                            <span className="text-slate-400 font-bold mr-1">Out :</span>
                                                            <span className="text-slate-600 dark:text-slate-300 font-bold">
                                                                {attendance.scheduledClockOut ? new Date(attendance.scheduledClockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center w-full min-w-[200px]">
                                                {/* Date Row */}
                                                <div className="flex items-center justify-center space-x-1.5 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 w-full">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE })}
                                                    </span>
                                                </div>

                                                {/* Times Grid */}
                                                <div className="grid grid-cols-2 gap-4 w-full uppercase">
                                                    {/* IN Column */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-[12px] font-bold whitespace-nowrap mb-1">
                                                            <span className="text-slate-400 font-normal mr-1 text-[12px]">In :</span>
                                                            <span className="text-indigo-600 font-black">{new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB</span>
                                                        </div>
                                                        {attendance.isLate ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900 w-full text-center">
                                                                Telat {formatDuration(attendance.lateMinutes)}
                                                            </span>
                                                        ) : (
                                                            <span className="h-[22px]"></span> // Spacer to keep alignment
                                                        )}
                                                    </div>

                                                    {/* OUT Column */}
                                                    <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800 pl-4">
                                                        {attendance.clockOut ? (
                                                            <>
                                                                <div className="text-[12px] font-bold whitespace-nowrap mb-1">
                                                                    <span className="text-slate-400 font-normal mr-1 text-[12px]">Out :</span>
                                                                    <span className="text-indigo-600 font-black text-[12px]">{new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB</span>
                                                                </div>
                                                                {attendance.isEarlyLeave ? (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900 w-full text-center">
                                                                        Cepat {formatDuration(attendance.earlyLeaveMinutes)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="h-[22px]"></span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                <span className="text-[9px] italic text-slate-300">
                                                                    {attendance.status === 'ABSENT' || attendance.status === 'SICK' || attendance.status === 'PERMIT' ? '---' : 'Belum Absen'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 max-w-[200px]">
                                                <MapPin size={14} className="text-rose-500 shrink-0" />
                                                <div className="flex items-center space-x-1 min-w-0">
                                                    <span className="text-[10px] font-bold text-slate-500 truncate" title={attendance.address ?? undefined}>
                                                        {attendance.address || (attendance.latitude ? `${attendance.latitude}, ${attendance.longitude}` : '---')}
                                                    </span>
                                                    {attendance.latitude && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center w-24">
                                                <div className="flex items-center justify-between w-full mb-1">
                                                    <span className={cn("text-[10px] font-black", getPerformanceColor(calculateDailyPerformance(attendance)).split(' ')[0])}>
                                                        {calculateDailyPerformance(attendance)}%
                                                    </span>
                                                </div>
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
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
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
        </div>
    );
}

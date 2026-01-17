import React from 'react';
import { getAttendances } from '@/actions/attendance';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';
import { fromZonedTime } from 'date-fns-tz';
import { prisma } from '@/lib/db';
import HistoryFilter from '@/components/HistoryFilter';
import ExportButtons from '@/components/ExportButtons';
import { getShiftForDate, getStaticSchedule, getShiftTimings } from '@/lib/schedule-utils';
import { getStartOfDayJakarta, getEndOfDayJakarta, TIMEZONE } from '@/lib/date-utils';
import AttendanceHistoryTable from '@/components/AttendanceHistoryTable';

import { AttendanceStatus } from '@prisma/client';

interface VirtualAttendance {
    id: string;
    userId: string;
    clockIn: Date;
    clockOut: Date | null;
    status: AttendanceStatus | 'ABSENT' | 'SICK' | 'PERMIT' | 'SHIFT_CHANGE';
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

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ userId?: string, startDate?: string, endDate?: string, page?: string, limit?: string }> }) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '15');
    const skip = (page - 1) * limit;

    // Fetch users for filter (Admin/PIC only)
    let filterUsers;
    if (session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT') {
        filterUsers = await prisma.user.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    // Determine filter parameters
    let targetUserId: string | undefined = session.userId;
    if (session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT') {
        const pUserId = params.userId;
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

    // Performance optimization: default to last 30 days if no range provided
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startDate = parseDate(params.startDate) || getStartOfDayJakarta(thirtyDaysAgo);
    const endDate = parseDate(params.endDate) || getEndOfDayJakarta(new Date());

    // 1. Fetch Actual Attendances 
    // We fetch a larger batch because we need to merge with virtual records before slicing
    // But we limit it to 1000 if no specific dates are given to avoid crashing
    const actualAttendances = await getAttendances(targetUserId, startDate, endDate, 0, 1000);

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
    const virtualRecords: VirtualAttendance[] = [];
    const dateRange: Date[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        dateRange.push(new Date(current));
        current = new Date(current.setDate(current.getDate() + 1));
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
                                clockOut: null,
                                status: permit ? (permit.type === 'SAKIT' ? 'SICK' : (permit.type === 'PERUBAHAN_SHIFT' ? 'SHIFT_CHANGE' : 'PERMIT')) : 'ABSENT',
                                shiftType: shiftCode,
                                scheduledClockIn: timings.start,
                                scheduledClockOut: timings.end,
                                notes: permit ? permit.reason : 'Tidak ada keterangan',
                                isLate: false,
                                lateMinutes: 0,
                                isEarlyLeave: false,
                                earlyLeaveMinutes: 0,
                                latitude: 0,
                                longitude: 0,
                                address: null,
                                image: null,
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
    const allAttendances = [...actualAttendances, ...virtualRecords].sort((a, b) =>
        new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
    );

    // 5. Paginate on Server
    const totalItems = allAttendances.length;
    const paginatedAttendances = allAttendances.slice(skip, skip + limit);

    // Get filter info for export
    const selectedUser = filterUsers?.find(u => u.id === targetUserId);
    const filterInfo = {
        userName: selectedUser?.name,
        startDate: params.startDate ? String(params.startDate) : undefined,
        endDate: params.endDate ? String(params.endDate) : undefined,
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
                        {session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT'
                            ? 'Memantau seluruh data absensi karyawan Cluster Taman Marunda .'
                            : 'Melihat catatan kehadiran pribadi Anda.'}
                    </p>
                </div>

                <ExportButtons attendances={allAttendances} filterInfo={filterInfo} />
            </div>

            <HistoryFilter users={filterUsers} />

            <AttendanceHistoryTable
                initialAttendances={paginatedAttendances as VirtualAttendance[]}
                totalCount={totalItems}
                currentPage={page}
                pageSize={limit}
            />
        </div>
    );
}

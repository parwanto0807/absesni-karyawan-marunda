import React from 'react';
import { prisma } from '@/lib/db';
import { SHIFT_DETAILS } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import ScheduleClientHelper from '@/components/ScheduleClientHelper';
import ScheduleGrid from '@/components/ScheduleGrid';
import { getSession } from '@/lib/auth';

export default async function SchedulesPage({
    searchParams
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const session = await getSession();
    const params = await searchParams;
    const now = new Date();

    // Logic permission: SECURITY dan LINGKUNGAN tidak bisa edit
    const isRestricted = session?.role === 'SECURITY' || session?.role === 'LINGKUNGAN';
    const canEdit = session ? !isRestricted : false;

    // Ambil bulan/tahun dari URL atau gunakan default bulan ini
    const currentMonth = params.month ? parseInt(params.month) : now.getMonth();
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();

    // Hitung tanggal untuk navigasi
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

    // Ambil semua user dengan role SECURITY
    const securityUsers = await prisma.user.findMany({
        where: {
            role: 'SECURITY'
        },
        orderBy: {
            name: 'asc'
        }
    }) as any[];

    // Hitung jumlah hari dalam bulan yang dipilih
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Ambil manual overrides untuk bulan ini
    const manualSchedules = await prisma.schedule.findMany({
        where: {
            userId: { in: securityUsers.map(u => u.id) },
            date: {
                gte: new Date(currentYear, currentMonth, 1),
                lte: new Date(currentYear, currentMonth, daysInMonth)
            }
        }
    });

    const monthName = new Date(currentYear, currentMonth).toLocaleString('id-ID', { month: 'long' });

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Jadwal Shift Security</h1>
                    <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400">Rotasi otomatis: P → PM → M → OFF → OFF</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                        <Link
                            href={`/schedules?month=${prevMonthDate.getMonth()}&year=${prevMonthDate.getFullYear()}`}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <ChevronLeft size={16} />
                        </Link>
                        <div className="px-3 font-bold text-xs flex items-center space-x-2">
                            <CalendarIcon size={14} className="text-indigo-600" />
                            <span className="uppercase tracking-widest">{monthName} {currentYear}</span>
                        </div>
                        <Link
                            href={`/schedules?month=${nextMonthDate.getMonth()}&year=${nextMonthDate.getFullYear()}`}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                    {/* Atur Offset Component (Client Side) - Hanya jika bisa edit */}
                    {canEdit && (
                        <ScheduleClientHelper securityUsers={securityUsers} />
                    )}
                </div>
            </div>

            {/* Schedule Table/Grid Container */}
            <ScheduleGrid
                users={securityUsers}
                days={days}
                currentMonth={currentMonth}
                currentYear={currentYear}
                manualSchedules={manualSchedules}
                canEdit={canEdit}
            />

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(SHIFT_DETAILS).map(([code, det]) => (
                    <div key={code} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
                        <div className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-[10px] md:text-xs shadow-sm border border-slate-100 dark:border-slate-700", det.color)}>
                            {code}
                        </div>
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{det.label}</div>
                            <div className="text-[9px] md:text-[10px] font-bold text-slate-900 dark:text-white uppercase">{det.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import React from 'react';
import { prisma } from '@/lib/db';
import { SHIFT_DETAILS } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { getJakartaTime } from '@/lib/date-utils';
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
    // Use Jakarta time to determine "now" safely (so we get correct Month/Year)
    const now = getJakartaTime();

    // Logic permission: SECURITY dan LINGKUNGAN tidak bisa edit
    const isRestricted = session?.role === 'SECURITY' || session?.role === 'LINGKUNGAN';
    const canEdit = session ? !isRestricted : false;

    // Ambil bulan/tahun dari URL atau gunakan default bulan ini
    const currentMonth = params.month ? parseInt(params.month) : now.getMonth();
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();

    // Hitung tanggal untuk navigasi
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

    // Ambil user per divisi
    const securityUsers = await prisma.user.findMany({
        where: { role: 'SECURITY' },
        orderBy: { name: 'asc' }
    }) as any[];

    const lingkunganUsers = await prisma.user.findMany({
        where: { role: 'LINGKUNGAN' },
        orderBy: { name: 'asc' }
    }) as any[];

    const kebersihanUsers = await prisma.user.findMany({
        where: { role: 'KEBERSIHAN' },
        orderBy: { name: 'asc' }
    }) as any[];

    // Hitung jumlah hari dalam bulan yang dipilih
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Ambil manual overrides untuk semua relevan users
    const allUserIds = [
        ...securityUsers.map(u => u.id),
        ...lingkunganUsers.map(u => u.id),
        ...kebersihanUsers.map(u => u.id)
    ];

    const manualSchedules = await prisma.schedule.findMany({
        where: {
            userId: { in: allUserIds },
            date: {
                gte: new Date(currentYear, currentMonth, 1),
                lte: new Date(currentYear, currentMonth, daysInMonth)
            }
        }
    });

    const monthName = new Date(currentYear, currentMonth).toLocaleString('id-ID', { month: 'long' });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Jadwal Shift Karyawan</h1>
                    <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400">
                        Security (Rotasi 5 Hari) | Lingkungan (Sen-Jum) | Kebersihan (Sen-Sab)
                    </p>
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
                </div>
            </div>

            {/* 1. SECURITY SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3" />
                        Divisi Security
                    </h2>
                    {canEdit && securityUsers.length > 0 && (
                        <ScheduleClientHelper securityUsers={securityUsers} />
                    )}
                </div>
                <ScheduleGrid
                    users={securityUsers}
                    days={days}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    manualSchedules={manualSchedules}
                    canEdit={canEdit}
                />
            </div>

            {/* 2. LINGKUNGAN SECTION */}
            {lingkunganUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center">
                        <div className="w-2 h-6 bg-orange-500 rounded-full mr-3" />
                        Divisi Lingkungan
                    </h2>
                    <ScheduleGrid
                        users={lingkunganUsers}
                        days={days}
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        manualSchedules={manualSchedules}
                        canEdit={canEdit}
                    />
                </div>
            )}

            {/* 3. KEBERSIHAN SECTION */}
            {kebersihanUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center">
                        <div className="w-2 h-6 bg-teal-500 rounded-full mr-3" />
                        Divisi Kebersihan
                    </h2>
                    <ScheduleGrid
                        users={kebersihanUsers}
                        days={days}
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        manualSchedules={manualSchedules}
                        canEdit={canEdit}
                    />
                </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
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

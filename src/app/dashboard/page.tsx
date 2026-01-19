import React from 'react';
import {
    Users,
    UserCheck,
    Clock,
    ShieldCheck,
    Calendar,
    FileText,
    UserPlus,
    Activity,
    ChevronRight,
    TrendingUp
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getIncidentReports } from '@/actions/incident';
import { prisma } from '@/lib/db';
import PatroliButton from '@/components/PatroliButton';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { ImageModal } from '@/components/ImageModal';
import { calculateDailyPerformance, getPerformanceBarColor } from '@/lib/performance-utils';
import { TIMEZONE, getStartOfDayJakarta, getEndOfDayJakarta } from '@/lib/date-utils';
import { getShiftForDate, getStaticSchedule, getShiftTimings } from '@/lib/schedule-utils';
import DigitalClock from '@/components/DigitalClock';
import IncidentReportDialog from '@/components/IncidentReportDialog';
import ReviewIncidents from '@/components/ReviewIncidents';
import { AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { IncidentReport } from '@/types/incident';
import UserAvatar from '@/components/UserAvatar';
import { getDashboardInfo } from '@/actions/info';
import InfoCarousel from '@/components/InfoCarousel';

interface DashboardEmployee {
    id: string;
    name: string;
    role: string;
    employeeId: string | null;
    imageUrl: string;
    status: 'ONLINE' | 'PERMIT';
    isPending: boolean;
    permitType?: string;
}

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const isPowerful = session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT';
    const isFieldRole = ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'].includes(session.role);

    // Date for 3 days ago (Jakarta Time)
    const threeDaysAgo = getStartOfDayJakarta();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);



    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
    };

    // Calculate performance for field personnel - OPTIMIZED
    let myPerformance: { score: number; totalAttendance: number } | null = null;

    if (isFieldRole) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startOfMonth.setHours(0, 0, 0, 0);

        const myAttendances = await prisma.attendance.findMany({
            where: {
                userId: session.userId,
                clockIn: { gte: startOfMonth, lte: endOfMonth },
                status: { in: ['PRESENT', 'LATE'] }
            },
            select: { lateMinutes: true, earlyLeaveMinutes: true, status: true }
        });

        if (myAttendances.length > 0) {
            const totalScore = myAttendances.reduce((sum, att) => sum + calculateDailyPerformance(att), 0);
            const averageScore = totalScore / myAttendances.length;
            myPerformance = {
                score: Math.round(averageScore),
                totalAttendance: myAttendances.length
            };
        } else {
            myPerformance = { score: 0, totalAttendance: 0 };
        }
    }

    // 1. Data untuk Security/Lingkungan: History 7 hari rekan kerja
    const teamAttendanceRaw = await prisma.attendance.findMany({
        where: {
            ...(isFieldRole ? { userId: session.userId } : {}),
            clockIn: { gte: threeDaysAgo }
        },
        include: {
            user: { select: { id: true, name: true, employeeId: true, role: true } }
        },
        orderBy: { clockIn: 'desc' },
        take: isFieldRole ? 15 : 30
    });

    const teamAttendance = teamAttendanceRaw.map(record => ({
        ...record,
        user: {
            ...record.user,
            imageUrl: `/api/images/users/${record.user.id}`
        },
        // Proxy attendance image through API
        image: record.image ? `/api/images/attendance/${record.id}` : null,
        imageOut: record.imageOut ? `/api/images/attendance/${record.id}?type=out` : null
    }));

    const activeWindow = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    const presentSecurityRaw = await prisma.attendance.findMany({
        where: {
            clockIn: { gte: activeWindow },
            clockOut: null,
            user: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } }
        },
        include: {
            user: { select: { id: true, name: true, role: true, employeeId: true, rotationOffset: true } }
        },
        orderBy: [
            { userId: 'asc' },
            { clockIn: 'desc' }
        ],
        distinct: ['userId']
    });

    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            userId: session.userId,
            clockIn: { gte: activeWindow },
            clockOut: null
        }
    });
    const isOnDuty = !!currentAttendance;

    // 2. Data Izin Aktif Hari Ini (Jakarta Time)
    const todayStart = getStartOfDayJakarta();
    const todayEnd = getEndOfDayJakarta();

    const activePermits = await prisma.permit.findMany({
        where: {
            finalStatus: { in: ['APPROVED', 'PENDING'] },
            startDate: { lte: todayEnd },
            endDate: { gte: todayStart }
        },
        include: {
            user: { select: { id: true, name: true, role: true, employeeId: true, rotationOffset: true } }
        }
    });

    // 3. Data Jadwal Hari Ini untuk filter Izin Pending
    const todaySchedules = await prisma.schedule.findMany({
        where: {
            date: { gte: todayStart, lte: todayEnd }
        }
    });

    // Merge Clocked-in and Permits
    const securityEmployees: DashboardEmployee[] = [
        ...presentSecurityRaw.map(a => ({
            ...a.user,
            imageUrl: `/api/images/users/${a.user.id}`,
            status: 'ONLINE' as const,
            isPending: false
        })),
        ...activePermits
            .filter(p => {
                // Jangan duplikat jika sudah clock in
                if (presentSecurityRaw.some(a => a.userId === p.userId)) return false;

                // Jika statusnya APPROVED atau PENDING, tentukan shift-nya
                let shift = 'OFF';
                const targetDate = new Date();

                // 1. Cek Jadwal Manual
                const manual = todaySchedules.find(s => s.userId === p.userId);
                if (manual) {
                    shift = manual.shiftCode;
                } else {
                    // 2. Jika tidak ada manual, gunakan Rotasi atau Static Schedule
                    // PENTING: Gunakan raw Date() karena getShiftForDate akan mengonversinya ke Jakarta secara internal
                    if (p.user.role === 'SECURITY') {
                        shift = getShiftForDate(p.user.rotationOffset, targetDate);
                    } else if (p.user.role === 'LINGKUNGAN' || p.user.role === 'KEBERSIHAN') {
                        shift = getStaticSchedule(p.user.role, targetDate);
                    }
                }

                // Hanya munculkan jika Shift yang terdeteksi bukan OFF
                if (shift === 'OFF') return false;

                // 3. Cek apakah SEKARANG sedang dalam jam shift tersebut
                const timings = getShiftTimings(shift, targetDate);
                if (!timings) return false;

                // Berikan buffer 30 menit sebelum/sesudah jika perlu,
                // tapi standarnya kita cek apakah current time berada di dalam rentang
                const now = new Date();
                return now >= timings.start && now <= timings.end;
            })
            .map(p => ({
                ...p.user,
                imageUrl: `/api/images/users/${p.user.id}`,
                status: 'PERMIT' as const,
                permitType: p.type,
                isPending: p.finalStatus === 'PENDING'
            }))
    ];

    let myRecentIncidents: IncidentReport[] = [];
    if (isPowerful || isFieldRole) {
        const incidentsResult = await getIncidentReports(true);
        myRecentIncidents = (incidentsResult.success && incidentsResult.data) ? (incidentsResult.data as IncidentReport[]).slice(0, 10) : [];
    }

    const stats = {
        totalEmployees: await prisma.user.count({
            where: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } }
        }),
        presentToday: securityEmployees.filter(e => e.status === 'ONLINE').length,
        pendingPermits: await prisma.permit.count({ where: { finalStatus: 'PENDING' } }),
        pendingIncidents: await prisma.incidentReport.count({ where: { status: 'PENDING' } }),
        onDutyToday: await prisma.attendance.count({
            where: {
                clockIn: { gte: activeWindow },
                clockOut: null,
                user: { role: 'SECURITY' },
                status: { in: ['PRESENT', 'LATE'] }
            }
        })
    };

    const settings = await prisma.setting.findMany({
        select: { key: true, value: true }
    });
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => settingsMap[s.key] = s.value);

    const info = await getDashboardInfo();


    /* const getDutyForRole = (role: string) => {
        if (role === 'SECURITY') return settingsMap.DUTY_SECURITY;
        if (role === 'KEBERSIHAN') return settingsMap.DUTY_KEBERSIHAN;
        if (role === 'LINGKUNGAN') return settingsMap.DUTY_LINGKUNGAN;
        return null;
    }; */



    return (
        <div className="space-y-6 md:space-y-8 pb-24 md:pb-8 font-sans">
            {/* --- TOP BAR --- */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-row items-center justify-between w-full md:w-auto md:justify-start gap-4 md:gap-8">
                    <div>
                        <h1 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter shrink-0">
                            {isFieldRole ? 'Portal' : 'Halo,'} <span className="text-indigo-600">{isFieldRole ? session.role : session.username}</span>
                        </h1>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center">
                            <Calendar size={10} className="mr-1" />
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TIMEZONE })}
                        </p>
                    </div>
                    <DigitalClock />
                </div>
                <div className="flex items-center space-x-3">
                    {isPowerful && (
                        <Link href="/employees" className="hidden md:flex h-12 items-center space-x-2 rounded-2xl bg-indigo-600 px-6 text-xs font-black text-white shadow-xl shadow-indigo-200 uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95 dark:shadow-none">
                            <UserPlus size={16} />
                            <span>Karyawan</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* --- PERFORMANCE CARD FOR FIELD PERSONNEL --- */}
            {isFieldRole && myPerformance && (
                <>
                    {/* Mobile Compact Version - Full Width */}
                    <div className="md:hidden">
                        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl border-2 border-white/20 shadow-xl p-3 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl" />
                            </div>
                            <div className="relative flex items-center justify-between">
                                {/* Left: Circular Progress + Score */}
                                <div className="flex items-center space-x-3">
                                    <div className="relative w-10 h-10 shrink-0">
                                        <svg className="transform -rotate-90 w-full h-full">
                                            <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                                            <circle
                                                cx="50%" cy="50%" r="45%"
                                                stroke="white" strokeWidth="3" fill="none"
                                                strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - myPerformance.score / 100)}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-white">{myPerformance.score}%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Performance Kehadiran</span>
                                        <span className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                                            {myPerformance.score >= 98 ? '🏆 Teladan' :
                                                myPerformance.score >= 95 ? '⭐ Sangat Disiplin' :
                                                    myPerformance.score >= 90 ? '✅ Standar' :
                                                        myPerformance.score >= 85 ? '⚠️ Butuh Perhatian' :
                                                            '🚨 Peringatan'}
                                        </span>
                                        <span className="text-[7px] font-bold text-white/60 italic mt-0.5">
                                            {myPerformance.score >= 98 ? 'Pertahankan dedikasi sebagai penjaga terbaik!' :
                                                myPerformance.score >= 95 ? 'Kehadiran Anda bantu stabilitas keamanan!' :
                                                    myPerformance.score >= 90 ? 'Kurangi keterlambatan agar makin prima!' :
                                                        myPerformance.score >= 85 ? 'Tingkatkan kedisiplinan demi penghuni!' :
                                                            'Segera koordinasi dengan komandan regu!'}
                                        </span>
                                    </div>
                                </div>
                                {/* Right: Days */}
                                <div className="text-right">
                                    <span className="text-xl font-black text-white">{myPerformance.totalAttendance}</span>
                                    <span className="text-[8px] font-bold text-white/70 uppercase block">Hari Hadir</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Full Version */}
                    <div className="hidden md:block bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] border-2 border-white/20 shadow-2xl overflow-hidden relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                        </div>

                        <div className="relative p-8">
                            <div className="flex items-center justify-between gap-6">
                                {/* Left: Performance Score */}
                                <div className="flex items-center space-x-6">
                                    <div className="relative">
                                        {/* Circular Progress */}
                                        <div className="relative w-32 h-32">
                                            <svg className="transform -rotate-90 w-full h-full">
                                                <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                                <circle
                                                    cx="50%" cy="50%" r="45%"
                                                    stroke="white" strokeWidth="8" fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - myPerformance.score / 100)}`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-white">{myPerformance.score}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                            <Activity size={14} className="text-white" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Performance Bulan Ini</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">
                                            {myPerformance.score >= 98 ? '🏆 Teladan' :
                                                myPerformance.score >= 95 ? '⭐ Sangat Disiplin' :
                                                    myPerformance.score >= 90 ? '✅ Standar' :
                                                        myPerformance.score >= 85 ? '⚠️ Butuh Perhatian' :
                                                            '🚨 Peringatan'}
                                        </h2>
                                        <p className="text-base text-white/90 font-bold">
                                            {myPerformance.totalAttendance} hari hadir bulan ini
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Motivational Message */}
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md">
                                    <div className="flex items-start space-x-3">
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <TrendingUp size={20} className="text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                                                {myPerformance.score >= 98 ? 'Anda adalah Teladan!' :
                                                    myPerformance.score >= 95 ? 'Disiplin Luar Biasa!' :
                                                        myPerformance.score >= 90 ? 'Pertahankan Standar!' :
                                                            myPerformance.score >= 85 ? 'Perlu Perbaikan!' :
                                                                'Perhatian Khusus Diperlukan!'}
                                            </h3>
                                            <p className="text-sm text-white/80 leading-relaxed font-medium">
                                                {myPerformance.score >= 98 ? 'Luar biasa! Pertahankan dedikasi Anda sebagai penjaga keamanan terbaik.' :
                                                    myPerformance.score >= 95 ? 'Kerja bagus! Kehadiran Anda sangat membantu stabilitas keamanan cluster.' :
                                                        myPerformance.score >= 90 ? 'Kehadiran cukup baik. Yuk, kurangi keterlambatan agar performa makin prima.' :
                                                            myPerformance.score >= 85 ? 'Mohon tingkatkan kedisiplinan Anda demi kenyamanan penghuni cluster.' :
                                                                'Segera koordinasi dengan komandan regu terkait kendala kehadiran Anda.'}
                                            </p>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white rounded-full transition-all duration-1000"
                                                        style={{ width: `${myPerformance.score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-white">
                                                    {myPerformance.score >= 98 ? 'Target: 100% (Sempurna)' :
                                                        myPerformance.score >= 95 ? 'Target: 98% (Teladan)' :
                                                            myPerformance.score >= 90 ? 'Target: 95% (Sangat Disiplin)' :
                                                                myPerformance.score >= 85 ? 'Target: 90% (Standar)' :
                                                                    'Target: 85% (Minimal)'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* --- INFO CAROUSEL (Prayer, News, Weather) --- */}
            {info.success && info.data && (
                <InfoCarousel data={info.data} />
            )}

            {/* --- MOBILE SHORTCUTS --- */}
            <div className="grid grid-cols-5 gap-4 md:hidden">
                {[
                    { icon: UserCheck, label: 'Absen', color: 'from-blue-500 to-blue-600', href: '/attendance', shadow: 'shadow-blue-200' },
                    { icon: Calendar, label: 'Izin', color: 'from-orange-500 to-orange-600', href: '/permits', shadow: 'shadow-orange-200' },
                    { icon: Clock, label: 'Jadwal', color: 'from-indigo-500 to-indigo-600', href: '/schedules', shadow: 'shadow-indigo-200' },
                    { icon: FileText, label: 'History', color: 'from-emerald-500 to-emerald-600', href: '/history', shadow: 'shadow-emerald-200' },
                ].map((item, i) => (
                    <Link key={i} href={item.href} className="flex flex-col items-center space-y-3 group">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg transition-all active:scale-90 group-hover:translate-y-[-4px]",
                            item.color,
                            item.shadow,
                            "dark:shadow-none"
                        )}>
                            <item.icon size={24} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600 transition-colors text-center">{item.label}</span>
                    </Link>
                ))}
                {(isFieldRole || isPowerful) && (
                    <IncidentReportDialog userId={session.userId} variant="shortcut" disabled={isFieldRole && !isOnDuty} />
                )}
            </div>

            {/* --- RECENT INCIDENTS CAROUSEL --- */}
            {myRecentIncidents.length > 0 && (
                <div className={cn(
                    "w-[calc(100%+2rem)] -mx-4 px-4 md:mx-0 md:w-full md:px-0",
                    isPowerful ? "" : "md:hidden"
                )}>
                    <ReviewIncidents incidents={myRecentIncidents} userId={session.userId} />
                </div>
            )}

            {/* --- DASHBOARD LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side: Stats (Top on Mobile) */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Karyawan" value={stats.totalEmployees.toString()} icon={Users} color="indigo" />
                        <StatCard title="Total Hadir" value={stats.presentToday.toString()} icon={UserCheck} color="emerald" />
                        <StatCard title="Izin" value={stats.pendingPermits.toString()} icon={Activity} color="rose" />
                        {isPowerful ? (
                            <Link href="/admin/incidents" className="group">
                                <StatCard title="Laporan" value={stats.pendingIncidents.toString()} icon={AlertTriangleIcon} color={stats.pendingIncidents > 0 ? "rose" : "amber"} />
                            </Link>
                        ) : (
                            <StatCard title="Security" value={stats.onDutyToday.toString()} icon={ShieldCheck} color="amber" />
                        )}
                    </div>
                </div>

                {/* Right Side: Sidebar (Middle on Mobile, Sticky-like on Desktop) */}
                <div className="lg:col-span-1 lg:row-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Personil Hadir</h3>
                        <div className="space-y-4">
                            {securityEmployees.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={32} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400 italic font-bold uppercase tracking-tighter">Belum ada personil hadir</p>
                                </div>
                            ) : (
                                securityEmployees.map((emp) => (
                                    <div key={emp.employeeId} className="flex items-center justify-between group">
                                        <div className="flex items-center space-x-3">
                                            <UserAvatar
                                                userId={emp.id}
                                                userName={emp.name}
                                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-50 dark:border-slate-800 group-hover:border-indigo-100 transition-colors shadow-sm"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{emp.name}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full shadow-[0_0_8px]",
                                                emp.status === 'ONLINE' ? "bg-emerald-500 shadow-emerald-500/50" :
                                                    emp.isPending ? "bg-rose-500 shadow-rose-500/50 animate-pulse" : "bg-amber-500 shadow-amber-500/50"
                                            )} />
                                            <span className={cn(
                                                "text-[7px] font-black uppercase mt-1 tracking-widest",
                                                emp.status === 'ONLINE' ? "text-emerald-600" :
                                                    emp.isPending ? "text-rose-600" : "text-amber-600"
                                            )}>
                                                {emp.status === 'ONLINE' ? 'ONLINE' :
                                                    `${emp.permitType}${emp.isPending ? ' (PENDING)' : ''}`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {isPowerful && <PerformanceDashboard />}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={48} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Patroli</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter">Status kawasan 100% aman.</p>
                        <PatroliButton />
                    </div>
                </div>

                {/* Left Side Bottom: Attendance History (Bottom on Mobile, Below Stats on Desktop) */}
                <div className="lg:col-span-3 w-full overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Riwayat Absensi (3 Hari)</h2>
                            </div>
                            <Link href="/history" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center space-x-1">
                                <span>Semua</span>
                                <ChevronRight size={12} />
                            </Link>
                        </div>

                        {/* --- DESKTOP TABLE VIEW (Visible on LG and up) --- */}
                        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Karyawan</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Jadwal Shift</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Waktu Absen</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lokasi / GPS</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Foto</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {teamAttendance.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-12 text-center text-xs text-slate-400 italic">Belum ada data riwayat absensi.</td>
                                        </tr>
                                    ) : (
                                        teamAttendance.map((attendance, i) => {
                                            const perfScore = calculateDailyPerformance(attendance);
                                            const scheduledIn = attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--.--';
                                            const scheduledOut = attendance.scheduledClockOut ? new Date(attendance.scheduledClockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--.--';

                                            return (
                                                <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors group">
                                                    {/* Karyawan Component */}
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center space-x-4">
                                                            <UserAvatar
                                                                userId={attendance.user.id}
                                                                userName={attendance.user.name}
                                                                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                                                                    {attendance.user.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    {attendance.user.employeeId || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Jadwal Shift Component */}
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-10 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                                                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{attendance.shiftType || '-'}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                <span>IN : <span className="text-slate-900 dark:text-slate-300">{scheduledIn}</span></span>
                                                                <span>OUT : <span className="text-slate-900 dark:text-slate-300">{scheduledOut}</span></span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Waktu Absen Component */}
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col items-center min-w-[140px]">
                                                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                                <Calendar size={12} className="mr-1.5 opacity-50" />
                                                                {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                            <div className="flex items-center justify-between w-full px-1">
                                                                <div className="flex flex-col items-start border-r border-slate-100 pr-4">
                                                                    <div className="flex items-center space-x-1">
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase">IN : </span>
                                                                        <span className="text-[11px] font-black text-indigo-600 uppercase">
                                                                            {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                                                                        </span>
                                                                    </div>
                                                                    {attendance.isLate && (
                                                                        <div className="mt-1 bg-amber-100/50 border border-amber-200 rounded px-2 py-0.5">
                                                                            <span className="text-[8px] font-black text-amber-700 uppercase italic">
                                                                                TELAT {attendance.lateMinutes} MENIT
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col items-end pl-4">
                                                                    <div className="flex items-center space-x-1">
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase">OUT : </span>
                                                                        {attendance.clockOut ? (
                                                                            <span className="text-[11px] font-black text-slate-500 uppercase">
                                                                                {new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">BELUM ABSEN</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Lokasi / GPS Component */}
                                                    <td className="px-6 py-6 border-r border-slate-50/50 last:border-r-0">
                                                        {attendance.latitude && attendance.longitude ? (
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                {attendance.latitude.toFixed(6)}, {attendance.longitude.toFixed(6)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 uppercase italic">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Performance Component */}
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col w-32">
                                                            <span className={cn("text-xs font-black mb-1.5", perfScore >= 90 ? "text-emerald-600" : perfScore >= 70 ? "text-amber-600" : "text-rose-600")}>
                                                                {perfScore}%
                                                            </span>
                                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full", getPerformanceBarColor(perfScore))}
                                                                    style={{ width: `${perfScore}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Foto Component */}
                                                    <td className="px-6 py-6 text-center">
                                                        {attendance.image ? (
                                                            <ImageModal src={attendance.image} alt={`Foto ${attendance.user.name}`} />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300">
                                                                <UserCheck size={16} />
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Status Component */}
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                                                            attendance.status === 'PRESENT' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                attendance.status === 'LATE' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                    "bg-rose-50 text-rose-600 border-rose-100"
                                                        )}>
                                                            {attendance.status === 'PRESENT' ? 'HADIR' : attendance.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* --- MOBILE CARD VIEW (Visible below LG) --- */}
                        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {teamAttendance.length === 0 ? (
                                <div className="px-6 py-12 text-center text-xs text-slate-400 italic">Belum ada data riwayat absensi.</div>
                            ) : (
                                teamAttendance.map((attendance, i) => {
                                    const perfScore = calculateDailyPerformance(attendance);
                                    return (
                                        <div key={i} className="p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <UserAvatar
                                                        userId={attendance.user.id}
                                                        userName={attendance.user.name}
                                                        className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-100"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight">{attendance.user.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{attendance.user.employeeId}</span>
                                                    </div>
                                                </div>
                                                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    attendance.status === 'PRESENT' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                                    {attendance.status === 'PRESENT' ? 'HADIR' : attendance.status}
                                                </span>
                                            </div>

                                            {/* Date & Time Block (Inspired by History Mode) */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                    <div className="flex items-center space-x-1.5">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                            {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">
                                                        {attendance.shiftType || 'OFF'}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Time In */}
                                                    <div className="space-y-1">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu In</span>
                                                            <span className="text-[11px] font-black text-indigo-600 uppercase">
                                                                {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                                                            </span>
                                                        </div>
                                                        {attendance.isLate && (
                                                            <div className="inline-flex px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900 text-[8px] font-black uppercase italic">
                                                                TELAT {formatDuration(attendance.lateMinutes)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Time Out */}
                                                    <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu Out</span>
                                                            {attendance.clockOut ? (
                                                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">
                                                                    {new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-black text-slate-300 uppercase italic">BELUM ABSEN</span>
                                                            )}
                                                        </div>
                                                        {attendance.isEarlyLeave && (
                                                            <div className="inline-flex px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900 text-[8px] font-black uppercase italic">
                                                                CEPAT {formatDuration(attendance.earlyLeaveMinutes)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Scheduled Times */}
                                                {(attendance.scheduledClockIn || attendance.scheduledClockOut) && (
                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <div className="flex items-center space-x-1">
                                                            <span>Jadwal:</span>
                                                            <span className="text-slate-600 dark:text-slate-300">
                                                                {attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                                -
                                                                {attendance.scheduledClockOut ? new Date(attendance.scheduledClockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-slate-400 uppercase">Perf:</span>
                                                            <span className={cn("text-[9px] font-black", perfScore >= 90 ? "text-emerald-600" : "text-amber-600")}>{perfScore}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                                    {attendance.latitude && attendance.longitude
                                                        ? `${attendance.latitude.toFixed(6)}, ${attendance.longitude.toFixed(6)}`
                                                        : '-'}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">FOTO ABSEN:</span>
                                                    <ImageModal src={attendance.image || ''} alt="Absen" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

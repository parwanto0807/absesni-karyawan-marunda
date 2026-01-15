import React from 'react';
import {
    Users,
    UserCheck,
    Clock,
    MapPin,
    TrendingUp,
    ShieldCheck,
    Calendar,
    FileText,
    UserPlus,
    Bell,
    Settings,
    ChevronRight,
    ArrowRight,
    Activity,
    CheckCircle2,
    XCircle,
    ClipboardList
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAttendances } from '@/actions/attendance';
import { getIncidentReports, getMyRecentIncidents } from '@/actions/incident';
import { prisma } from '@/lib/db';
import PatroliButton from '@/components/PatroliButton';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { ImageModal } from '@/components/ImageModal';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';
import { TIMEZONE, getStartOfDayJakarta } from '@/lib/date-utils';
import DigitalClock from '@/components/DigitalClock';
import IncidentReportDialog from '@/components/IncidentReportDialog';
import ReviewIncidents from '@/components/ReviewIncidents';
import { AlertTriangle as AlertTriangleIcon } from 'lucide-react';

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const isPowerful = session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT';
    const isFieldRole = ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'].includes(session.role);

    // Date for 7 days ago (Jakarta Time)
    const sevenDaysAgo = getStartOfDayJakarta();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'LATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ALPH': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
    };

    // 1. Data untuk Security/Lingkungan: History 7 hari rekan kerja
    const teamAttendance = await prisma.attendance.findMany({
        where: {
            ...(isFieldRole ? { userId: session.userId } : {}),
            clockIn: { gte: sevenDaysAgo }
        },
        include: {
            user: { select: { name: true, employeeId: true, role: true, image: true } }
        },
        orderBy: { clockIn: 'desc' },
        take: 50
    });

    const activeWindow = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    const presentSecurity = await prisma.attendance.findMany({
        where: {
            clockIn: { gte: activeWindow },
            clockOut: null,
            user: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } }
        },
        include: {
            user: { select: { name: true, role: true, employeeId: true, image: true } }
        },
        orderBy: { clockIn: 'desc' },
        distinct: ['userId']
    });

    const securityEmployees = presentSecurity.map(a => a.user);

    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            userId: session.userId,
            clockIn: { gte: activeWindow },
            clockOut: null
        }
    });
    const isOnDuty = !!currentAttendance;

    const allPermitActivity = await prisma.permit.findMany({
        where: {
            endDate: { gte: getStartOfDayJakarta() }
        },
        take: 5,
        include: {
            user: { select: { name: true, employeeId: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    let myRecentIncidents: any[] = [];
    if (isPowerful || isFieldRole) {
        const incidentsResult = await getIncidentReports(true);
        myRecentIncidents = (incidentsResult.success && incidentsResult.data) ? incidentsResult.data.slice(0, 10) : [];
    }

    const stats = {
        totalEmployees: await prisma.user.count({
            where: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } }
        }),
        presentToday: await prisma.attendance.count({
            where: {
                clockIn: { gte: activeWindow },
                clockOut: null,
                user: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } },
                status: { in: ['PRESENT', 'LATE'] }
            }
        }),
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

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => settingsMap[s.key] = s.value);

    const getDutyForRole = (role: string) => {
        if (role === 'SECURITY') return settingsMap.DUTY_SECURITY;
        if (role === 'KEBERSIHAN') return settingsMap.DUTY_KEBERSIHAN;
        if (role === 'LINGKUNGAN') return settingsMap.DUTY_LINGKUNGAN;
        return null;
    };

    const myDuty = getDutyForRole(session.role);

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
                                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-50 dark:border-slate-800 group-hover:border-indigo-100 transition-colors shadow-sm">
                                                <img
                                                    src={emp.image || '/default-avatar.png'}
                                                    alt={emp.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{emp.name}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50" />
                                            <span className="text-[7px] font-black text-emerald-600 uppercase mt-1 tracking-widest">ONLINE</span>
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
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Riwayat Absensi (7 Hari)</h2>
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
                                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                                                                <img src={attendance.user.image || '/default-avatar.png'} alt={attendance.user.name} className="w-full h-full object-cover" />
                                                            </div>
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
                                                            <a
                                                                href={`https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors group/map"
                                                            >
                                                                <MapPin size={12} className="text-rose-500" />
                                                                <span className="uppercase tracking-tighter">Lokasi GPS: {attendance.latitude.toFixed(6)}, {attendance.longitude.toFixed(6)}</span>
                                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 uppercase italic">Tanpa Koordinat GPS</span>
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
                                                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-slate-100">
                                                        <img src={attendance.user.image || '/default-avatar.png'} alt={attendance.user.name} className="w-full h-full object-cover" />
                                                    </div>
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

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Shift / Waktu</span>
                                                    <div className="flex items-center space-x-1 mb-1">
                                                        <div className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">{attendance.shiftType || '-'}</div>
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase italic">
                                                            {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Performance</span>
                                                    <span className={cn("text-xs font-black mb-1.5", perfScore >= 90 ? "text-emerald-600" : "text-amber-600")}>{perfScore}%</span>
                                                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className={cn("h-full", getPerformanceBarColor(perfScore))} style={{ width: `${perfScore}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <a href={`https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`} target="_blank"
                                                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-colors">
                                                    <MapPin size={12} className="text-rose-500" />
                                                    <span>Lokasi GPS</span>
                                                </a>
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

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
import { prisma } from '@/lib/db';
import PatroliButton from '@/components/PatroliButton';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { ImageModal } from '@/components/ImageModal';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';
import { TIMEZONE, getStartOfDayJakarta } from '@/lib/date-utils';
import DigitalClock from '@/components/DigitalClock';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const isPowerful = session.role === 'ADMIN' || session.role === 'PIC';
  const isFieldRole = session.role === 'SECURITY' || session.role === 'LINGKUNGAN';

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
      // Jika Field Role, lihat security/lingkungan saja (atau semua jika diinginkan, tapi default rekan kerja). 
      // User request: "Dashboard Mode Desktop... riwayat Absensi... 7 hari terakhir"
      // Asumsikan menampilkan data relevan user.
      ...(isFieldRole ? { userId: session.userId } : {}),
      clockIn: { gte: sevenDaysAgo }
    },
    include: {
      user: { select: { name: true, employeeId: true, role: true, image: true } }
    },
    orderBy: { clockIn: 'desc' },
    take: 50
  });

  // 2. Daftar Personil (Security & Lingkungan) yang Hadir/Aktif saat ini
  // Kita ambil yang belum clock-out dalam 24 jam terakhir agar Shift Malam (M) terbawa
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

  // 3. Aktifitas Pengajuan
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
    onDutyToday: await prisma.attendance.count({
      where: {
        clockIn: { gte: activeWindow },
        clockOut: null,
        user: { role: 'SECURITY' },
        status: { in: ['PRESENT', 'LATE'] }
      }
    })
  };

  // 4. Ambil Tugas & Kewajiban (SOP)
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
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8 font-sans animate-in fade-in duration-700">
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

      {/* --- MOBILE SHORTCUTS (Hidden on Desktop) --- */}
      <div className="grid grid-cols-4 gap-4 md:hidden">
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
      </div>



      {/* --- DESKTOP DASHBOARD LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 grid-flow-row-dense">

        {/* --- 1. STATS SECTION (Main Col) --- */}
        <div className="lg:col-span-3 space-y-8">
          {/* STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Karyawan" value={stats.totalEmployees.toString()} icon={Users} color="indigo" />
            <StatCard title="Total Hadir (SCR,KBR,LNK)" value={stats.presentToday.toString()} icon={UserCheck} color="emerald" />
            <StatCard title="Izin (Menunggu)" value={stats.pendingPermits.toString()} icon={Activity} color="rose" />
            <StatCard title="Security Bertugas" value={stats.onDutyToday.toString()} icon={ShieldCheck} color="amber" />
          </div>
        </div>

        {/* --- 2. SIDEBAR (Right Column on Desktop, Middle on Mobile) --- */}
        <div className="lg:col-span-1 lg:row-span-2 space-y-6 h-fit">

          {/* A. DAFTAR PERSONIL */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Personil Hadir</h3>
              <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                {securityEmployees.length} ORG
              </div>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {securityEmployees.length === 0 ? (
                <p className="text-center text-xs text-slate-400 italic py-4">Belum ada personil hadir</p>
              ) : (
                securityEmployees.map((emp) => (
                  <div key={emp.employeeId} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {emp.image ? <img src={emp.image} className="h-full w-full object-cover rounded-2xl" /> : emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{emp.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</div>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* B. PERFORMANCE DASHBOARD (ADMIN/PIC ONLY) */}
          {isPowerful && (
            <PerformanceDashboard />
          )}

          {/* C. AKTIFITAS IZIN */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Izin Terbaru</h3>
            </div>
            <div className="space-y-4">
              {allPermitActivity.length === 0 ? (
                <p className="text-center text-xs text-slate-400 italic">Tidak ada pengajuan</p>
              ) : (
                allPermitActivity.slice(0, 3).map((permit, i) => (
                  <div key={i} className="flex items-start space-x-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="mt-0.5">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        permit.finalStatus === 'APPROVED' ? "bg-emerald-500" : permit.finalStatus === 'REJECTED' ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                      )} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">{permit.user.name}</div>
                      <div className="text-[10px] text-slate-500 leading-snug">
                        Mengajukan :  <span className="font-semibold text-indigo-600">{permit.type}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1">{new Date(permit.createdAt).toLocaleDateString('id-ID', { timeZone: TIMEZONE })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* D. PATROLI CARD (Moved to Bottom) */}
          <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-slate-800 dark:to-slate-900 p-6 text-white shadow-2xl relative overflow-hidden group border border-indigo-500/20 dark:border-slate-700">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-white/10 dark:group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <ShieldCheck size={36} className="text-white dark:text-indigo-400" />
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10">
                  <TrendingUp size={18} className="text-emerald-400 dark:text-emerald-500" />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-black leading-tight uppercase tracking-tighter text-white">Patroli Kawasan</h3>
              <p className="mt-2 text-[10px] text-indigo-100 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Status Keamanan 100% Kondusif.</p>
              <PatroliButton />
            </div>
          </div>

        </div>

        {/* --- 2. TASK & DUTIES (SOP) --- */}
        {myDuty && (
          <div className="lg:col-span-3 space-y-4 md:space-y-6 mt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 px-2">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100 dark:border-indigo-800">
                  <ClipboardList size={12} />
                  <span>Standar Operasional Prosedur</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  Tugas & <span className="text-indigo-600">Kewajiban</span>
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Panduan kerja resmi divisi {session.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Update Terakhir: {new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {myDuty.split(/(?=\d+\.)/).filter(t => t.trim()).map((section, sIdx) => {
                const lines = section.trim().split('\n');
                const title = lines[0].replace(/^\d+\.\s*/, '');
                const items = lines.slice(1).filter(l => l.trim().startsWith('-'));

                const getThemeColor = () => {
                  const role = session.role;
                  if (role === 'SECURITY') return 'indigo';
                  if (role === 'KEBERSIHAN') return 'emerald';
                  if (role === 'LINGKUNGAN') return 'orange';
                  return 'slate';
                };
                const theme = getThemeColor();

                return (
                  <div key={sIdx} className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 overflow-hidden flex flex-col">
                    {/* Card Header & Number */}
                    <div className={cn(
                      "p-6 pb-2 flex items-start justify-between",
                      `text-${theme}-600 dark:text-${theme}-400`
                    )}>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">Materi 0{sIdx + 1}</div>
                        <h4 className="text-sm md:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                          {title}
                        </h4>
                      </div>
                      <div className={cn(
                        "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center font-black text-lg border transition-transform group-hover:rotate-12 group-hover:scale-110",
                        theme === 'indigo' ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20" :
                          theme === 'emerald' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" :
                            "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20"
                      )}>
                        {sIdx + 1}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 pt-2 flex-grow">
                      <div className="space-y-3">
                        {items.map((item, iIdx) => (
                          <div key={iIdx} className="flex gap-3 group/item">
                            <div className={cn(
                              "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 transition-all group-hover/item:scale-150",
                              `bg-${theme}-500 shadow-[0_0_8px] shadow-${theme}-500/50`
                            )} />
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              {item.replace(/^-\s*/, '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Decoration */}
                    <div className={cn(
                      "h-1 w-full mt-auto opacity-20",
                      `bg-gradient-to-r from-transparent via-${theme}-500 to-transparent`
                    )} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 3. HISTORY SECTION (Main Col, Below Stats) --- */}
        <div className="lg:col-span-3 mt-10">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-5 md:h-6 w-1 bg-indigo-600 rounded-full" />
                <h2 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Riwayat Absensi (7 Hari)
                </h2>
              </div>
              <Link href="/history" className="text-[8px] md:text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline flex items-center">
                Semua <ChevronRight size={12} className="ml-1" />
              </Link>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {teamAttendance.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Activity size={32} className="mb-3 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada data</span>
                  </div>
                </div>
              ) : (
                teamAttendance.slice(0, 5).map((item, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                          {item.user.image ? <img src={item.user.image} className="w-full h-full object-cover rounded-lg" /> : item.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.user.name}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.user.role}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        item.status === 'PRESENT'
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                      )}>
                        {item.status === 'PRESENT' ? 'Hadir' : item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="font-medium">
                        {new Date(item.clockIn).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE })}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Activity size={32} className="mb-3 opacity-20" />
                          <span className="text-xs font-bold uppercase tracking-widest">Belum ada data rekaman</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((attendance: any, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
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
                            <div className="flex items-center justify-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 w-full">
                              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {attendance.shiftType === 'LINGKUNGAN' ? 'LNK' : attendance.shiftType === 'KEBERSIHAN' ? 'KBR' : attendance.shiftType || 'OFF'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full uppercase font-bold">
                              <div className="flex flex-col items-center justify-center">
                                <div className="text-[12px] font-medium whitespace-nowrap">
                                  <span className="text-slate-400 font-bold mr-1">In :</span>
                                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                                    {attendance.scheduledClockIn ? new Date(attendance.scheduledClockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }) : '--:--'}
                                  </span>
                                </div>
                              </div>
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
                            <div className="flex items-center justify-center space-x-1.5 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 w-full">
                              <Calendar size={12} className="text-slate-400" />
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIMEZONE })}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full uppercase">
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
                                  <span className="h-[22px]"></span>
                                )}
                              </div>
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
                                    <span className="text-[9px] italic text-slate-300">Belum Absen</span>
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
                                {attendance.address || `${attendance.latitude}, ${attendance.longitude}`}
                              </span>
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
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
                            {attendance.status === 'PRESENT' ? 'HADIR' : attendance.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <Link href="/history" className="text-[10px] md:text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                Lihat Seluruh Riwayat Absensi
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div >
  );
}

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
  Activity
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAttendances } from '@/actions/attendance';
import { prisma } from '@/lib/db';
import PatroliButton from '@/components/PatroliButton';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const isPowerful = session.role === 'ADMIN' || session.role === 'PIC';
  const isFieldRole = session.role === 'SECURITY' || session.role === 'LINGKUNGAN';

  // Date for 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 1. Data untuk Security/Lingkungan: History 7 hari rekan kerja
  const teamAttendance = await prisma.attendance.findMany({
    where: {
      // Jika Field Role, lihat security/lingkungan saja (atau semua jika diinginkan, tapi default rekan kerja). 
      // User request: "Dashboard Mode Desktop... riwayat Absensi... 7 hari terakhir"
      // Asumsikan menampilkan data relevan user.
      ...(isFieldRole ? { user: { role: { in: ['SECURITY', 'LINGKUNGAN'] } } } : {}),
      clockIn: { gte: sevenDaysAgo }
    },
    include: {
      user: { select: { name: true, employeeId: true, role: true } }
    },
    orderBy: { clockIn: 'desc' },
    take: 50
  });

  // 2. Daftar Personil (Security & Lingkungan) yang Hadir Hari Ini
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const presentSecurity = await prisma.attendance.findMany({
    where: {
      clockIn: { gte: todayStart },
      user: { role: { in: ['SECURITY', 'LINGKUNGAN'] } }
    },
    include: {
      user: { select: { name: true, role: true, employeeId: true } }
    },
    orderBy: { clockIn: 'desc' },
    distinct: ['userId']
  });

  const securityEmployees = presentSecurity.map(a => a.user);

  // 3. Aktifitas Pengajuan
  const allPermitActivity = await prisma.permit.findMany({
    where: {
      endDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    },
    take: 5,
    include: {
      user: { select: { name: true, employeeId: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    totalEmployees: await prisma.user.count({
      where: { role: { in: ['SECURITY', 'LINGKUNGAN'] } }
    }),
    presentToday: await prisma.attendance.count({
      where: {
        clockIn: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: 'PRESENT'
      }
    }),
    pendingPermits: await prisma.permit.count({ where: { finalStatus: 'PENDING' } }),
    onDutyToday: await prisma.attendance.count({
      where: {
        clockIn: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        user: { role: 'SECURITY' }
      }
    })
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8 font-sans animate-in fade-in duration-700">
      {/* --- TOP BAR --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            {isFieldRole ? 'Portal' : 'Halo,'} <span className="text-indigo-600">{isFieldRole ? session.role : session.username}</span>
          </h1>
          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center">
            <Calendar size={10} className="mr-1" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* --- LEFT COLUMN (MAIN - 3 COLS) --- */}
        <div className="lg:col-span-3 space-y-8">

          {/* 1. STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Karyawan" value={stats.totalEmployees.toString()} icon={Users} color="indigo" />
            <StatCard title="Hadir (Unit)" value={stats.presentToday.toString()} icon={UserCheck} color="emerald" />
            <StatCard title="Ijin (Pending)" value={stats.pendingPermits.toString()} icon={Activity} color="rose" />
            <StatCard title="Security On Duty" value={stats.onDutyToday.toString()} icon={ShieldCheck} color="amber" />
          </div>

          {/* 2. HISTORY ABSENSI CARD (7 DAYS) */}
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
                          {item.user.name.charAt(0)}
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
                        {new Date(item.clockIn).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Personil</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Jam Masuk</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teamAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Activity size={32} className="mb-3 opacity-20" />
                          <span className="text-xs font-bold uppercase tracking-widest">Belum ada data rekaman</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    teamAttendance.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              {item.user.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{item.user.role}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {new Date(item.clockIn).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            item.status === 'PRESENT'
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30"
                              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30"
                          )}>
                            {item.status === 'PRESENT' ? 'Hadir' : item.status}
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

        {/* --- RIGHT COLUMN (SIDEBAR - 1 COL) --- */}
        <div className="space-y-6">

          {/* 1. PATROLI CARD */}
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

          {/* 2. DAFTAR PERSONIL (NEW) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Personil Hadir Hari Ini</h3>
              <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                {securityEmployees.length} ORG
              </div>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {securityEmployees.map((emp) => (
                <div key={emp.employeeId} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{emp.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. AKTIFITAS IZIN (EXISTING) */}
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
                        Mengajukan <span className="font-semibold text-indigo-600">{permit.type}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1">{new Date(permit.createdAt).toLocaleDateString('id-ID')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div >
  );
}

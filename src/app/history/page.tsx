import React from 'react';
import { getAttendances } from '@/actions/attendance';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Clock, Download, Filter, Search, Calendar, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function HistoryPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    // Filter attendances based on role
    // Security and Lingkungan only see their own data
    const attendances = (session.role === 'ADMIN' || session.role === 'PIC')
        ? await getAttendances()
        : await getAttendances(session.userId);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'LATE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ALPH': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
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
                            ? 'Memantau seluruh data absensi karyawan Marunda Center.'
                            : 'Melihat catatan kehadiran pribadi Anda.'}
                    </p>
                </div>

                <div className="hidden md:flex items-center space-x-3">
                    <button className="h-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm flex items-center space-x-2 hover:bg-slate-50 transition-all">
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

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
                                    {attendance.status === 'PRESENT' ? 'HADIR' : attendance.status}
                                </span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center justify-between text-[9px] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="flex items-center space-x-1">
                                    <Calendar size={10} className="text-slate-400" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Clock size={10} className="text-slate-400" />
                                    <span className="font-black text-indigo-600">
                                        {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        {attendance.clockOut && ` - ${new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                                    </span>
                                </div>
                            </div>

                            {/* Location & Photo */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <MapPin size={12} className="text-rose-500 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-500 truncate" title={attendance.address ?? undefined}>
                                        {attendance.address || `${attendance.latitude}, ${attendance.longitude}`}
                                    </span>
                                </div>
                                {attendance.image ? (
                                    <a href={attendance.image} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all shrink-0">
                                        <img src={attendance.image} alt="Absen" className="w-full h-full object-cover" />
                                    </a>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                                        <XCircle size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Karyawan</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu Absen</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lokasi / GPS</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Foto</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="h-64 text-center">
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
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {new Date(attendance.clockIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase">
                                                        {new Date(attendance.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        {attendance.clockOut && ` - ${new Date(attendance.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 max-w-[200px]">
                                                <MapPin size={14} className="text-rose-500 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-500 truncate" title={attendance.address ?? undefined}>
                                                    {attendance.address || `${attendance.latitude}, ${attendance.longitude}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {attendance.image ? (
                                                <a href={attendance.image} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all">
                                                    <img src={attendance.image} alt="Absen" className="w-full h-full object-cover" />
                                                </a>
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
            </div>
        </div>
    );
}

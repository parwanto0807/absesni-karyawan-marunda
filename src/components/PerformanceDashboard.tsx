import React from 'react';
import { prisma } from '@/lib/db';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';
import { TrendingUp, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getJakartaTime } from '@/lib/date-utils';
import Image from 'next/image';

interface AttendanceRecord {
    lateMinutes: number | null;
    earlyLeaveMinutes: number | null;
    status: string;
}

interface EmployeeRecord {
    id: string;
    name: string;
    role: string;
    image: string | null;
    employeeId: string;
    attendances: AttendanceRecord[];
}

interface LeaderboardItem extends EmployeeRecord {
    averageScore: number;
    totalAttendance: number;
}

export default async function PerformanceDashboard() {
    const now = getJakartaTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startOfMonth.setHours(0, 0, 0, 0);

    const employees = await prisma.user.findMany({
        where: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } },
        select: {
            id: true, name: true, role: true, image: true, employeeId: true,
            attendances: {
                where: { clockIn: { gte: startOfMonth, lte: endOfMonth }, status: { in: ['PRESENT', 'LATE'] } },
                select: { lateMinutes: true, earlyLeaveMinutes: true, status: true }
            }
        }
    });

    const leaderboard: LeaderboardItem[] = employees.map((emp) => {
        if (!emp.attendances || emp.attendances.length === 0) {
            return { ...emp, averageScore: 0, totalAttendance: 0 };
        }
        const totalScore = emp.attendances.reduce((sum: number, att) => sum + calculateDailyPerformance(att), 0);
        const averageScore = emp.attendances.length > 0
            ? (totalScore / emp.attendances.length).toFixed(2)
            : "0.00";
        return { ...emp, averageScore: parseFloat(averageScore), totalAttendance: emp.attendances.length };
    }).sort((a, b) => (b.averageScore - a.averageScore) || (b.totalAttendance - a.totalAttendance));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
                        <Medal size={16} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">Performa Personil</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bulan {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 w-8 text-center">#</th>
                            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Personil</th>
                            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Hadir</th>
                            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 w-1/3">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {leaderboard.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 uppercase tracking-widest italic">Belum ada data bulan ini</td></tr>
                        ) : (
                            leaderboard.map((emp, index) => (
                                <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-3 py-2 text-center">
                                        {index < 3 ? (
                                            <span className={cn("flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black mx-auto", index === 0 ? "bg-amber-100 text-amber-600" : index === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600")}>{index + 1}</span>
                                        ) : (<span className="text-[9px] font-bold text-slate-400">#{index + 1}</span>)}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[9px] uppercase overflow-hidden shrink-0 relative">
                                                {emp.image ? (
                                                    <Image
                                                        src={emp.image}
                                                        alt={emp.name}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                ) : emp.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[80px] md:max-w-none">{emp.name}</div>
                                                <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2"><span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{emp.totalAttendance} Hr</span></td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full", getPerformanceBarColor(emp.averageScore))} style={{ width: `${emp.averageScore}%` }} />
                                            </div>
                                            <span className={cn("text-[9px] font-black w-8 text-right", getPerformanceColor(emp.averageScore).split(' ')[0])}>{emp.averageScore}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

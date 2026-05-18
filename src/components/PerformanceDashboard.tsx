import React from 'react';
import { prisma } from '@/lib/db';
import { calculateDailyPerformance, getPerformanceBarColor, getPerformanceColor } from '@/lib/performance-utils';
import { Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getShiftForDate, getStaticSchedule, getShiftTimings } from '@/lib/schedule-utils';
import { getStartOfDayJakarta, getEndOfDayJakarta, getJakartaTime } from '@/lib/date-utils';
import UserAvatar from '@/components/UserAvatar';


interface EmployeeRecord {
    id: string;
    name: string;
    role: string;
    employeeId: string;
    rotationOffset: number | null;
}

interface LeaderboardItem extends EmployeeRecord {
    averageScore: number;
    totalAttendance: number;
}

export default async function PerformanceDashboard() {
    const now = getJakartaTime();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const utcStartOfMonth = getStartOfDayJakarta(thirtyDaysAgo);
    const utcEndOfMonth = getEndOfDayJakarta(now);

    const employees = await prisma.user.findMany({
        where: { role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] } },
        select: {
            id: true,
            name: true,
            role: true,
            employeeId: true,
            rotationOffset: true,
            attendances: {
                where: { clockIn: { gte: utcStartOfMonth, lte: utcEndOfMonth } },
                select: { lateMinutes: true, earlyLeaveMinutes: true, status: true, clockIn: true }
            },
            schedules: {
                where: { date: { gte: utcStartOfMonth, lte: utcEndOfMonth } }
            },
            permits: {
                where: {
                    finalStatus: 'APPROVED',
                    startDate: { lte: utcEndOfMonth },
                    endDate: { gte: utcStartOfMonth }
                }
            }
        }
    });

    // Generate date range for virtual records
    const dateRange: Date[] = [];
    let current = new Date(utcStartOfMonth);
    while (current <= utcEndOfMonth) {
        dateRange.push(new Date(current));
        current = new Date(current.setDate(current.getDate() + 1));
    }

    const leaderboard: LeaderboardItem[] = employees.map((emp) => {
        const workDays = new Set<string>();
        const presentDays = new Set<string>();
        const dailyPerformances = new Map<string, number>();

        // 1. Process actual attendances
        emp.attendances.forEach(att => {
            const dateKey = new Date(att.clockIn).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
            workDays.add(dateKey);

            if (att.status === 'PRESENT' || att.status === 'LATE') {
                presentDays.add(dateKey);
            }

            const performance = calculateDailyPerformance(att);
            if (!dailyPerformances.has(dateKey) || performance < dailyPerformances.get(dateKey)!) {
                dailyPerformances.set(dateKey, performance);
            }
        });

        // 2. Generate virtual records for absences/permits
        const todayStart = getStartOfDayJakarta(new Date());

        dateRange.forEach(date => {
            const dayStart = getStartOfDayJakarta(date);
            const dateKey = date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

            const hasAttendance = emp.attendances.some(att => {
                const attDayStart = getStartOfDayJakarta(new Date(att.clockIn)).getTime();
                return attDayStart === dayStart.getTime();
            });

            if (!hasAttendance) {
                let shiftCode = 'OFF';
                const manual = emp.schedules.find(s => getStartOfDayJakarta(s.date).getTime() === dayStart.getTime());

                if (manual) {
                    shiftCode = manual.shiftCode;
                } else if (emp.role === 'LINGKUNGAN' || emp.role === 'KEBERSIHAN') {
                    shiftCode = getStaticSchedule(emp.role, date);
                } else {
                    shiftCode = getShiftForDate(emp.rotationOffset, date);
                }

                if (shiftCode !== 'OFF') {
                    const timings = getShiftTimings(shiftCode, date);
                    if (timings) {
                        const permit = emp.permits.find(p =>
                            getStartOfDayJakarta(p.startDate).getTime() <= dayStart.getTime() &&
                            getEndOfDayJakarta(p.endDate).getTime() >= dayStart.getTime()
                        );

                        const isPastDate = dayStart.getTime() < todayStart.getTime();
                        const isToday = dayStart.getTime() === todayStart.getTime();
                        const waitTimePassed = isToday && new Date().getTime() > (timings.start.getTime() + 2 * 60 * 60 * 1000);

                        if (isPastDate || waitTimePassed || permit) {
                            workDays.add(dateKey);

                            let virtualStatus = 'ABSENT';
                            if (permit) {
                                virtualStatus = permit.type === 'SAKIT' ? 'SICK' : (permit.type === 'PERUBAHAN_SHIFT' ? 'SHIFT_CHANGE' : 'PERMIT');
                            }

                            const performance = calculateDailyPerformance({ status: virtualStatus });
                            if (!dailyPerformances.has(dateKey) || performance < dailyPerformances.get(dateKey)!) {
                                dailyPerformances.set(dateKey, performance);
                            }
                        }
                    }
                }
            }
        });

        // 3. Calculate average score
        const totalScore = Array.from(dailyPerformances.values()).reduce((sum, val) => sum + val, 0);
        const averageScore = workDays.size > 0 ? (totalScore / workDays.size) : 0;

        return {
            id: emp.id,
            name: emp.name,
            role: emp.role,
            employeeId: emp.employeeId,
            rotationOffset: emp.rotationOffset,
            averageScore: Math.round(averageScore * 100) / 100, // Keep 2 decimals for precision
            totalAttendance: presentDays.size
        };
    }).sort((a: LeaderboardItem, b: LeaderboardItem) => (b.averageScore - a.averageScore) || (b.totalAttendance - a.totalAttendance));


    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
                        <Medal size={16} />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">Performa Personil</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">30 Hari Terakhir ({thirtyDaysAgo.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })})</p>
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
                                            <UserAvatar
                                                userId={emp.id}
                                                userName={emp.name}
                                                className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[9px] uppercase overflow-hidden shrink-0"
                                            />
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

import React from 'react';
import { prisma } from '@/lib/db';
import { getStartOfDayJakarta, getEndOfDayJakarta, TIMEZONE } from '@/lib/date-utils';
import LatenessChartClient from './LatenessChartClient';

export default async function LatenessMonitoringChart() {
    const now = new Date();

    // Calculate range: 30 days ending today
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 29);

    const dbStart = getStartOfDayJakarta(rangeStart);
    const dbEnd = getEndOfDayJakarta(now);

    // Fetch all late attendances in the range
    const lateAttendances = await prisma.attendance.findMany({
        where: {
            clockIn: {
                gte: dbStart,
                lte: dbEnd
            },
            lateMinutes: {
                gt: 0
            },
            user: {
                role: {
                    in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN']
                }
            }
        },
        select: {
            clockIn: true,
            lateMinutes: true
        }
    });

    // Process data to group by date
    const dailyDataMap = new Map<string, { totalLateMinutes: number; lateCount: number }>();

    // Initialize map with all dates in range
    // We loop using a temp date starting from dbStart
    const loopDate = new Date(dbStart);
    while (loopDate <= dbEnd) {
        const dateKey = loopDate.toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD
        dailyDataMap.set(dateKey, { totalLateMinutes: 0, lateCount: 0 });

        // Advance by 1 day
        loopDate.setDate(loopDate.getDate() + 1);
    }

    // Aggregate data
    lateAttendances.forEach(att => {
        // Convert clockIn (UTC) to Jakarta YYYY-MM-DD
        const dateKey = new Date(att.clockIn).toLocaleDateString('en-CA', { timeZone: TIMEZONE });

        if (dailyDataMap.has(dateKey)) {
            const current = dailyDataMap.get(dateKey)!;
            dailyDataMap.set(dateKey, {
                totalLateMinutes: current.totalLateMinutes + (att.lateMinutes || 0),
                lateCount: current.lateCount + 1
            });
        }
    });

    // Convert to array
    const chartData = Array.from(dailyDataMap.entries()).map(([dateKey, stats]) => {
        // Parse parts manually for correct locale formatting without timezone shift
        const [year, month, day] = dateKey.split('-').map(Number);
        // Create a date object that will format correctly.
        const localeDate = new Date(year, month - 1, day);
        const formattedDate = localeDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        return {
            date: dateKey,
            formattedDate,
            totalLateMinutes: stats.totalLateMinutes,
            lateCount: stats.lateCount
        };
    });

    // Sort by date
    chartData.sort((a, b) => a.date.localeCompare(b.date));

    return <LatenessChartClient data={chartData} />;
}

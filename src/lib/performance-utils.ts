
/**
 * Calculates a daily performance score (0-100) based on attendance data.
 * Logic:
 * - Absent (ALPH) = 0
 * - Present = Starts at 100
 * - Late Penalty: 1 point per minute
 * - Early Leave Penalty: 1 point per minute
 * - No Clock Out Penalty: 50 points (if shift is likely over, handled conceptually, typically creates early leave)
 */
export function calculateDailyPerformance(attendance: { status: string, lateMinutes?: number | null, earlyLeaveMinutes?: number | null }): number {
    if (attendance.status === 'ALPH' || attendance.status === 'ABSENT') return 0;

    // For now, only 'PRESENT' and 'LATE' get a calculated score.
    // Others like 'SICK', 'PERMIT' are neutral.
    if (attendance.status !== 'PRESENT' && attendance.status !== 'LATE') {
        if (['SICK', 'PERMIT', 'LEAVE', 'OFF'].includes(attendance.status)) return 100;
        return 0; // Unknown
    }

    let score = 100;

    // Penalties
    if (attendance.lateMinutes) {
        score -= attendance.lateMinutes; // 1% per minute
    }
    if (attendance.earlyLeaveMinutes) {
        score -= attendance.earlyLeaveMinutes; // 1% per minute
    }

    // Ensure range 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
}

export function getPerformanceColor(score: number): string {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'; // Excellent
    if (score >= 75) return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'; // Good
    if (score >= 50) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'; // Warning
    return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'; // Bad
}

export function getPerformanceBarColor(score: number): string {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-indigo-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
}

import { getShiftForDate, getStaticSchedule } from './schedule-utils';

/**
 * Calculates the number of expected work days for a role within a date range.
 */
export function calculateExpectedWorkDays(
    role: string, 
    startDate: Date, 
    endDate: Date, 
    rotationOffset?: number | null
): number {
    let count = 0;
    const current = new Date(startDate);
    // Ensure we work with day boundaries in the loop
    current.setHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setHours(23, 59, 59, 999);

    const temp = new Date(current);
    while (temp <= last) {
        let isWorkDay = false;
        if (role === 'SECURITY') {
            const shift = getShiftForDate(rotationOffset, temp);
            isWorkDay = shift !== 'OFF';
        } else if (role === 'LINGKUNGAN' || role === 'KEBERSIHAN') {
            const shift = getStaticSchedule(role, temp);
            isWorkDay = shift !== 'OFF';
        }
        
        if (isWorkDay) count++;
        temp.setDate(temp.getDate() + 1);
    }
    return count;
}

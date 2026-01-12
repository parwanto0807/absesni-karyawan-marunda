
/**
 * Calculates a daily performance score (0-100) based on attendance data.
 * Logic:
 * - Absent (ALPH) = 0
 * - Present = Starts at 100
 * - Late Penalty: 1 point per minute
 * - Early Leave Penalty: 1 point per minute
 * - No Clock Out Penalty: 50 points (if shift is likely over, handled conceptually, typically creates early leave)
 */
export function calculateDailyPerformance(attendance: any): number {
    if (attendance.status === 'ALPH') return 0;

    // For now, only 'PRESENT' gets a score. Others like 'SICK', 'PERMIT' are neutral or handled elsewhere.
    // If we want to visualize them, we could return 100 or null.
    // Let's assume if status is 'PRESENT' we score it, otherwise 100 (authorized) or 0 (unauthorized).
    if (attendance.status !== 'PRESENT') {
        // If it's a permit/sick/leave, it shouldn't penalize performance typically.
        if (['SICK', 'PERMIT', 'LEAVE', 'OFF'].includes(attendance.status)) return 100;
        return 0; // Unknown or ABSENT
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

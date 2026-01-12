// Shift schedule utilities
export type ShiftType = 'P' | 'PM' | 'M';

export interface ShiftSchedule {
    type: ShiftType;
    clockInTime: string; // HH:mm format
    clockOutTime: string;
    duration: number; // hours
}

export const SHIFT_SCHEDULES: Record<ShiftType, ShiftSchedule> = {
    P: {
        type: 'P',
        clockInTime: '08:00',
        clockOutTime: '20:00',
        duration: 12
    },
    PM: {
        type: 'PM',
        clockInTime: '13:00',
        clockOutTime: '20:00',
        duration: 7
    },
    M: {
        type: 'M',
        clockInTime: '20:00',
        clockOutTime: '08:00', // next day
        duration: 12
    }
};

export function getScheduledTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(hours, minutes, 0, 0);
    return scheduled;
}

export function calculateLateMinutes(actualClockIn: Date, scheduledClockIn: Date): number {
    const diffMs = actualClockIn.getTime() - scheduledClockIn.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? diffMinutes : 0;
}

export function isClockOutAllowed(currentTime: Date, scheduledClockOut: Date): boolean {
    // Toleransi 5 menit sebelum jadwal clock out
    const fiveMinutesBefore = new Date(scheduledClockOut.getTime() - 5 * 60 * 1000);
    return currentTime >= fiveMinutesBefore;
}

export function getShiftName(shiftType: ShiftType): string {
    const names: Record<ShiftType, string> = {
        P: 'Pagi (08:00 - 20:00)',
        PM: 'Pagi-Malam (13:00 - 20:00)',
        M: 'Malam (20:00 - 08:00)'
    };
    return names[shiftType];
}

export function getTodayShift(userId: string, date: Date): ShiftType | null {
    // This should query the Schedule model to get today's shift
    // For now, return null - will be implemented with actual schedule lookup
    return null;
}

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { TIMEZONE } from './date-utils';

export const SHIFT_ROTATION = ["P", "PM", "M", "OFF", "OFF"] as const;
export type ShiftCode = typeof SHIFT_ROTATION[number];

// Tanggal referensi (Day 0) - Misal 1 Januari 2026
export const ROTATION_START_DATE = new Date(2026, 0, 1);

/**
 * Menentukan shift untuk user pada tanggal tertentu berdasarkan offset-nya.
 * Menggunakan rumus: Index = (Selisih_Hari + Offset) mod 5
 * Menggunakan timezone Jakarta untuk memastikan perhitungan hari akurat.
 */
export function getShiftForDate(offset: number | null | undefined, targetDate: Date): ShiftCode {
    const safeOffset = offset || 0;

    // Normalisasi tanggal agar hanya membandingkan YYYY-MM-DD dalam konteks Jakarta
    const start = toZonedTime(ROTATION_START_DATE, TIMEZONE);
    start.setHours(0, 0, 0, 0);

    const target = toZonedTime(targetDate, TIMEZONE);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // JS % operator handles negative numbers differently, so use ((n % m) + m) % m
    const index = ((diffDays + safeOffset) % 5 + 5) % 5;

    return (SHIFT_ROTATION[index as unknown as 0] || "OFF") as ShiftCode;
}

export const SHIFT_DETAILS = {
    "P": { label: "PAGI", time: "08:00 - 20:00", color: "bg-white dark:bg-slate-900" },
    "PM": { label: "PAGI-MALAM", time: "13:00 - 08:00", color: "bg-blue-50 dark:bg-blue-900/20" },
    "M": { label: "MALAM", time: "20:00 - 08:00", color: "bg-slate-100 dark:bg-slate-800" },
    "OFF": { label: "OFF", time: "-", color: "bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700" },
    // Static Roles
    "LNK": { label: "REGULER", time: "08:00 - 17:00", color: "bg-orange-50 dark:bg-orange-900/20" },
    "KBR": { label: "REGULER", time: "07:00 - 16:00", color: "bg-teal-50 dark:bg-teal-900/20" }
};

export function getShiftTimings(shiftCode: string, targetDate: Date): { start: Date; end: Date } | null {
    if (shiftCode === 'OFF') return null;

    // Use Jakarta time to set the hours correctly
    const startJakarta = toZonedTime(targetDate, TIMEZONE);
    const endJakarta = toZonedTime(targetDate, TIMEZONE);

    // Reset seconds/ms
    startJakarta.setSeconds(0, 0);
    endJakarta.setSeconds(0, 0);

    switch (shiftCode) {
        // ROTATING SHIFTS
        case 'P': // 08:00 - 20:00
            startJakarta.setHours(8, 0);
            endJakarta.setHours(20, 0);
            break;
        case 'PM': // 13:00 - 20:00 (Logic kept from previous version despite label discrepancy)
            startJakarta.setHours(13, 0);
            endJakarta.setHours(20, 0);
            break;
        case 'M': // 20:00 - 08:00 (Next Day)
            startJakarta.setHours(20, 0);
            endJakarta.setDate(endJakarta.getDate() + 1);
            endJakarta.setHours(8, 0);
            break;

        // STATIC ROLES
        case 'LNK': // 08:00 - 17:00
            startJakarta.setHours(8, 0);
            endJakarta.setHours(17, 0);
            break;
        case 'KBR': // 07:00 - 16:00
            startJakarta.setHours(7, 0);
            endJakarta.setHours(16, 0);
            break;

        default:
            return null;
    }

    // Convert back to UTC timestamps so they can be stored/compared correctly
    return {
        start: fromZonedTime(startJakarta, TIMEZONE),
        end: fromZonedTime(endJakarta, TIMEZONE)
    };
}

export function getStaticSchedule(role: string, targetDate: Date): string {
    const zonedDate = toZonedTime(targetDate, TIMEZONE);
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

    if (role === 'LINGKUNGAN') {
        // MON (1) - FRI (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) return 'LNK';
        return 'OFF';
    }

    if (role === 'KEBERSIHAN') {
        // MON (1) - SAT (6)
        if (dayOfWeek >= 1 && dayOfWeek <= 6) return 'KBR';
        return 'OFF';
    }

    // Default fallback
    return 'OFF';
}

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
    "P": {
        label: "PAGI",
        time: "08:00 - 20:00",
        color: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-400 dark:border-orange-500/20"
    },
    "PM": {
        label: "PAGI-MALAM",
        time: "13:00 - 08:00",
        color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-400 dark:border-indigo-500/20"
    },
    "M": {
        label: "MALAM",
        time: "20:00 - 08:00",
        color: "bg-slate-400 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-500 dark:border-slate-700"
    },
    "OFF": {
        label: "OFF",
        time: "-",
        color: "bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800/50"
    },
    // Static Roles
    "LNK": {
        label: "REGULER",
        time: "07:00 - 17:00",
        color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-500/20"
    },
    "KBR": {
        label: "REGULER",
        time: "07:00 - 16:00",
        color: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-400 dark:border-teal-500/20"
    }
};

export function parseRoleScheduleSettings(settingsMap?: Record<string, string>) {
    const lingkunganWorkDays = settingsMap?.['SCHEDULE_LINGKUNGAN_WORK_DAYS']
        ? settingsMap['SCHEDULE_LINGKUNGAN_WORK_DAYS'].split(',').map(Number).filter(n => !isNaN(n))
        : [1, 2, 3, 4, 5];

    const lingkunganStart = settingsMap?.['SCHEDULE_LINGKUNGAN_START'] || '07:00';
    const lingkunganEnd = settingsMap?.['SCHEDULE_LINGKUNGAN_END'] || '17:00';

    const kebersihanWorkDays = settingsMap?.['SCHEDULE_KEBERSIHAN_WORK_DAYS']
        ? settingsMap['SCHEDULE_KEBERSIHAN_WORK_DAYS'].split(',').map(Number).filter(n => !isNaN(n))
        : [1, 2, 3, 4, 5, 6];

    const kebersihanStart = settingsMap?.['SCHEDULE_KEBERSIHAN_START'] || '07:00';
    const kebersihanEnd = settingsMap?.['SCHEDULE_KEBERSIHAN_END'] || '16:00';

    return {
        LINGKUNGAN: {
            startTime: lingkunganStart,
            endTime: lingkunganEnd,
            workDays: lingkunganWorkDays
        },
        KEBERSIHAN: {
            startTime: kebersihanStart,
            endTime: kebersihanEnd,
            workDays: kebersihanWorkDays
        }
    };
}

export function getDynamicShiftDetails(shiftCode: string, settingsMap?: Record<string, string>) {
    const base = SHIFT_DETAILS[shiftCode as keyof typeof SHIFT_DETAILS] || {
        label: "OFF",
        time: "-",
        color: "bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800/50"
    };

    if (!settingsMap) return base;

    const configs = parseRoleScheduleSettings(settingsMap);
    if (shiftCode === 'LNK') {
        return {
            ...base,
            time: `${configs.LINGKUNGAN.startTime} - ${configs.LINGKUNGAN.endTime}`
        };
    }
    if (shiftCode === 'KBR') {
        return {
            ...base,
            time: `${configs.KEBERSIHAN.startTime} - ${configs.KEBERSIHAN.endTime}`
        };
    }

    return base;
}

export function getShiftTimings(shiftCode: string, targetDate: Date, settingsMap?: Record<string, string>): { start: Date; end: Date } | null {
    if (shiftCode === 'OFF') return null;

    // Use Jakarta time to set the hours correctly
    const startJakarta = toZonedTime(targetDate, TIMEZONE);
    const endJakarta = toZonedTime(targetDate, TIMEZONE);

    // Reset seconds/ms
    startJakarta.setSeconds(0, 0);
    endJakarta.setSeconds(0, 0);

    const configs = parseRoleScheduleSettings(settingsMap);

    switch (shiftCode) {
        // ROTATING SHIFTS
        case 'P': // 08:00 - 20:00
            startJakarta.setHours(8, 0);
            endJakarta.setHours(20, 0);
            break;
        case 'PM': // 13:00 - 08:00 (Next Day)
            startJakarta.setHours(13, 0);
            endJakarta.setDate(endJakarta.getDate() + 1);
            endJakarta.setHours(8, 0);
            break;
        case 'M': // 20:00 - 08:00 (Next Day)
            startJakarta.setHours(20, 0);
            endJakarta.setDate(endJakarta.getDate() + 1);
            endJakarta.setHours(8, 0);
            break;

        // STATIC ROLES
        case 'LNK': {
            const [sHour, sMin] = configs.LINGKUNGAN.startTime.split(':').map(Number);
            const [eHour, eMin] = configs.LINGKUNGAN.endTime.split(':').map(Number);
            startJakarta.setHours(isNaN(sHour) ? 7 : sHour, isNaN(sMin) ? 0 : sMin);
            endJakarta.setHours(isNaN(eHour) ? 17 : eHour, isNaN(eMin) ? 0 : eMin);
            break;
        }
        case 'KBR': {
            const [sHour, sMin] = configs.KEBERSIHAN.startTime.split(':').map(Number);
            const [eHour, eMin] = configs.KEBERSIHAN.endTime.split(':').map(Number);
            startJakarta.setHours(isNaN(sHour) ? 7 : sHour, isNaN(sMin) ? 0 : sMin);
            endJakarta.setHours(isNaN(eHour) ? 16 : eHour, isNaN(eMin) ? 0 : eMin);
            break;
        }

        default:
            return null;
    }

    // Convert back to UTC timestamps so they can be stored/compared correctly
    return {
        start: fromZonedTime(startJakarta, TIMEZONE),
        end: fromZonedTime(endJakarta, TIMEZONE)
    };
}

export function getStaticSchedule(role: string, targetDate: Date, settingsMap?: Record<string, string>): string {
    const zonedDate = toZonedTime(targetDate, TIMEZONE);
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

    const configs = parseRoleScheduleSettings(settingsMap);

    if (role === 'LINGKUNGAN') {
        if (configs.LINGKUNGAN.workDays.includes(dayOfWeek)) return 'LNK';
        return 'OFF';
    }

    if (role === 'KEBERSIHAN') {
        if (configs.KEBERSIHAN.workDays.includes(dayOfWeek)) return 'KBR';
        return 'OFF';
    }

    // Default fallback
    return 'OFF';
}

export const SHIFT_ROTATION = ["P", "PM", "M", "OFF", "OFF"] as const;
export type ShiftCode = typeof SHIFT_ROTATION[number];

// Tanggal referensi (Day 0) - Misal 1 Januari 2026
export const ROTATION_START_DATE = new Date(2026, 0, 1);

/**
 * Menentukan shift untuk user pada tanggal tertentu berdasarkan offset-nya.
 * Menggunakan rumus: Index = (Selisih_Hari + Offset) mod 5
 */
export function getShiftForDate(offset: number | null | undefined, targetDate: Date): ShiftCode {
    const safeOffset = offset || 0;
    // Normalisasi tanggal agar hanya membandingkan YYYY-MM-DD
    const start = new Date(ROTATION_START_DATE);
    start.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
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
    "OFF": { label: "OFF", time: "-", color: "bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700" }
};

export function getShiftTimings(shiftCode: ShiftCode, targetDate: Date): { start: Date; end: Date } | null {
    if (shiftCode === 'OFF') return null;

    const start = new Date(targetDate);
    const end = new Date(targetDate);

    // Reset seconds/ms
    start.setSeconds(0, 0);
    end.setSeconds(0, 0);

    switch (shiftCode) {
        case 'P': // 08:00 - 20:00
            start.setHours(8, 0);
            end.setHours(20, 0);
            break;
        case 'PM': // 13:00 - 20:00 (Assuming 7 hours based on previous context)
            start.setHours(13, 0);
            end.setHours(20, 0);
            break;
        case 'M': // 20:00 - 08:00 (Next Day)
            start.setHours(20, 0);
            end.setDate(end.getDate() + 1);
            end.setHours(8, 0);
            break;
        default:
            return null;
    }

    return { start, end };
}

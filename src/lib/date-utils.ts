import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

export const TIMEZONE = 'Asia/Jakarta';

/**
 * Returns the current time but adjusted so that getHours/getDate/etc 
 * reflect Jakarta time. Be careful: the underlying timestamp is shifted.
 * Use this only for extracting day/month/year components.
 */
export function getJakartaTime(date: Date = new Date()): Date {
    return toZonedTime(date, TIMEZONE);
}

/**
 * Returns the actual UTC start of the day for Jakarta (00:00 WIB).
 * Use this for database queries (e.g. "Find records created today in Jakarta").
 */
export function getStartOfDayJakarta(date: Date = new Date()): Date {
    // 1. Get the current time as if we are in Jakarta
    const jakartaTime = toZonedTime(date, TIMEZONE);
    // 2. Set to midnight
    jakartaTime.setHours(0, 0, 0, 0);
    // 3. Convert back to real UTC timestamp
    return fromZonedTime(jakartaTime, TIMEZONE);
}

/**
 * Returns the actual UTC end of the day for Jakarta (23:59:59.999 WIB).
 */
export function getEndOfDayJakarta(date: Date = new Date()): Date {
    const jakartaTime = toZonedTime(date, TIMEZONE);
    jakartaTime.setHours(23, 59, 59, 999);
    return fromZonedTime(jakartaTime, TIMEZONE);
}

/**
 * Gets the offset in minutes for Jakarta (UTC+7 -> 420 minutes)
 * This doesn't change for Jakarta (no DST), but good to have if needed.
 */
export function getJakartaOffset(): number {
    return 7 * 60;
}

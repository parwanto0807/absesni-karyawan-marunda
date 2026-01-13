import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from './date-utils';

export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    isCutiBersama: boolean;
}

export const INDONESIAN_HOLIDAYS_2026: Holiday[] = [
    { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isCutiBersama: false },
    { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
    { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek', isCutiBersama: true },
    { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', isCutiBersama: false },
    { date: '2026-03-18', name: 'Cuti Bersama Hari Suci Nyepi', isCutiBersama: true },
    { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', isCutiBersama: false },
    { date: '2026-03-20', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H', isCutiBersama: true },
    { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H', isCutiBersama: false },
    { date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 H', isCutiBersama: false },
    { date: '2026-03-23', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H', isCutiBersama: true },
    { date: '2026-03-24', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H', isCutiBersama: true },
    { date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', isCutiBersama: false },
    { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah)', isCutiBersama: false },
    { date: '2026-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
    { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isCutiBersama: false },
    { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Yesus Kristus', isCutiBersama: true },
    { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H', isCutiBersama: false },
    { date: '2026-05-28', name: 'Cuti Bersama Hari Raya Idul Adha 1447 H', isCutiBersama: true },
    { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isCutiBersama: false },
    { date: '2026-06-01', name: 'Hari Lahir Pancasila', isCutiBersama: false },
    { date: '2026-06-16', name: 'Tahun Baru Islam 1448 H', isCutiBersama: false },
    { date: '2026-08-17', name: 'Hari Kemerdekaan RI', isCutiBersama: false },
    { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
    { date: '2026-12-24', name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },
    { date: '2026-12-25', name: 'Hari Raya Natal', isCutiBersama: false },
];

export function getHoliday(date: Date, customHolidays?: any[]): Holiday | undefined {
    const zonedDate = toZonedTime(date, TIMEZONE);
    const day = String(zonedDate.getDate()).padStart(2, '0');
    const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
    const year = zonedDate.getFullYear();
    const dateStr = `${year}-${month}-${day}`;

    if (customHolidays && customHolidays.length > 0) {
        const found = customHolidays.find(h => {
            const hDate = toZonedTime(new Date(h.date), TIMEZONE);
            const hDay = String(hDate.getDate()).padStart(2, '0');
            const hMonth = String(hDate.getMonth() + 1).padStart(2, '0');
            const hYear = hDate.getFullYear();
            return `${hYear}-${hMonth}-${hDay}` === dateStr;
        });
        if (found) return { date: dateStr, name: found.name, isCutiBersama: found.isCutiBersama };
    }

    return INDONESIAN_HOLIDAYS_2026.find(h => h.date === dateStr);
}

'use server';
import { toZonedTime } from 'date-fns-tz';

import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@/types/attendance';
import { prisma } from '@/lib/db';
import { createNotification } from './notifications';
import { getShiftForDate, getShiftTimings, ShiftCode, getStaticSchedule } from '@/lib/schedule-utils';
import { getStartOfDayJakarta, TIMEZONE } from '@/lib/date-utils';

export async function clockIn(userId: string, location: { lat: number, lng: number, address: string }, image: string) {
    try {
        const now = new Date();
        // Use Jakarta timezone to determine the start of "today"
        const today = getStartOfDayJakarta(now);

        // Define tomorrow as 24 hours after today's start
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Cek apakah sudah ada attendance hari ini yang belum clock out
        const todayAttendance = await prisma.attendance.findFirst({
            where: {
                userId,
                clockIn: {
                    gte: today,
                    lt: tomorrow
                },
                clockOut: null
            },
            orderBy: { clockIn: 'desc' }
        });

        if (todayAttendance) {
            return {
                success: false,
                message: 'Anda sudah clock in hari ini. Silakan clock out terlebih dahulu.'
            };
        }

        // No more waiting period for shift transitions

        // Calculate Shift and Lateness
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { schedules: { where: { date: today } } }
        });

        let shiftCode = 'OFF';
        let scheduledStart = null;
        let scheduledEnd = null;
        let isLate = false;
        let lateMinutes = 0;

        if (user) {
            // Check manual schedule first
            if (user.schedules.length > 0) {
                shiftCode = user.schedules[0].shiftCode;
            } else if ((user.role as string) === 'LINGKUNGAN' || (user.role as string) === 'KEBERSIHAN') {
                shiftCode = getStaticSchedule(user.role as string, now);
            } else {
                shiftCode = getShiftForDate(user.rotationOffset, now);
            }

            const timings = getShiftTimings(shiftCode as ShiftCode, now);
            if (timings) {
                scheduledStart = timings.start;
                scheduledEnd = timings.end;

                // 2-hour window check for Clock In
                const windowStart = new Date(scheduledStart.getTime() - 2 * 60 * 60 * 1000);
                const windowEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

                if (now < windowStart) {
                    return {
                        success: false,
                        message: `Belum waktunya absen. Hubungi Admin atau tunggu hingga ${windowStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB.`
                    };
                }
                if (now > windowEnd) {
                    return {
                        success: false,
                        message: `Batas waktu absen masuk sudah lewat (${windowEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB).`
                    };
                }

                // Lateness check (0 tolerance)
                if (now > scheduledStart) {
                    const diff = now.getTime() - scheduledStart.getTime();
                    lateMinutes = Math.floor(diff / 60000);
                    if (lateMinutes > 0) isLate = true;
                }
            }
        }

        // ✅ Simpan base64 langsung ke database (Vercel compatible)
        const attendance = await prisma.attendance.create({
            data: {
                userId,
                clockIn: now,
                latitude: location.lat,
                longitude: location.lng,
                address: location.address,
                image: image, // Simpan base64 langsung
                status: isLate ? 'LATE' : 'PRESENT',
                shiftType: shiftCode,
                scheduledClockIn: scheduledStart,
                scheduledClockOut: scheduledEnd,
                isLate,
                lateMinutes,
            },
        });

        // 🎉 Create Notification
        await createNotification({
            userId,
            title: 'Absen Masuk Berhasil',
            message: `Anda telah melakukan absen masuk pada ${now.toLocaleTimeString('id-ID', { timeZone: TIMEZONE })}`,
            type: 'ATTENDANCE',
        });

        revalidatePath('/');
        revalidatePath('/attendance');
        revalidatePath('/history');
        return { success: true, message: 'Berhasil absen masuk!', data: attendance };
    } catch (error) {
        console.error('Clock in error:', error);
        return { success: false, message: 'Gagal melakukan absen.' };
    }
}

export async function clockOut(attendanceId: string) {
    try {
        const now = new Date();
        const existingAttendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });

        let isEarlyLeave = false;
        let earlyLeaveMinutes = 0;

        if (existingAttendance && existingAttendance.scheduledClockOut) {
            const scheduledEnd = new Date(existingAttendance.scheduledClockOut);

            // 2-hour window check for Clock Out
            const windowStart = new Date(scheduledEnd.getTime() - 2 * 60 * 60 * 1000);
            const windowEnd = new Date(scheduledEnd.getTime() + 2 * 60 * 60 * 1000);

            if (now < windowStart) {
                return {
                    success: false,
                    message: `Belum waktunya absen pulang. Hubungi Admin atau tunggu hingga ${windowStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB.`
                };
            }
            if (now > windowEnd) {
                return {
                    success: false,
                    message: `Batas waktu absen pulang sudah lewat (${windowEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB).`
                };
            }

            // 5-minute early leave tolerance
            const tolerancePoint = new Date(scheduledEnd.getTime() - 5 * 60 * 1000);
            if (now < tolerancePoint) {
                const diff = scheduledEnd.getTime() - now.getTime();
                earlyLeaveMinutes = Math.floor(diff / 60000);
                if (earlyLeaveMinutes > 0) isEarlyLeave = true;
            }
        }

        const attendance = await prisma.attendance.update({
            where: { id: attendanceId },
            data: {
                clockOut: now,
                isEarlyLeave,
                earlyLeaveMinutes
            },
        });

        const userId = (await prisma.attendance.findUnique({ where: { id: attendanceId } }))?.userId;
        if (userId) {
            await createNotification({
                userId,
                title: 'Absen Keluar Berhasil',
                message: `Anda telah melakukan absen keluar pada ${new Date().toLocaleTimeString('id-ID', { timeZone: TIMEZONE })}`,
                type: 'ATTENDANCE',
            });
        }

        revalidatePath('/');
        revalidatePath('/attendance');
        revalidatePath('/history');
        return { success: true, message: 'Berhasil absen keluar!', data: attendance };
    } catch (error) {
        console.error('Clock out error:', error);
        return { success: false, message: 'Gagal melakukan absen keluar.' };
    }
}

export async function submitPermit(data: { userId: string, type: string, reason: string }) {
    try {
        // Basic permit implementation as special attendance record
        const attendance = await prisma.attendance.create({
            data: {
                userId: data.userId,
                clockIn: new Date(), // Using current date for permit record
                status: data.type as any,
                notes: data.reason,
            },
        });

        revalidatePath('/permits');
        return { success: true, message: 'Izin berhasil diajukan.', data: attendance };
    } catch (error) {
        console.error('Submit permit error:', error);
        return { success: false, message: 'Gagal mengajukan izin.' };
    }
}

export async function getTodayAttendance(userId: string) {
    try {
        const today = getStartOfDayJakarta(new Date());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId,
                clockIn: {
                    gte: today,
                    lt: tomorrow
                }
            },
            orderBy: { clockIn: 'desc' }
        });

        return attendance;
    } catch (error) {
        console.error('Get today attendance error:', error);
        return null;
    }
}

export async function getTodayUserShift(userId: string) {
    try {
        const now = new Date();
        const hour = toZonedTime(now, TIMEZONE).getHours();

        // 1. Prioritas: Jika user SUDAH Clock In tapi BELUM Clock Out, 
        // maka tampilkan shift yang sedang dia jalani tersebut.
        const attendance = await getTodayAttendance(userId);
        if (attendance && attendance.shiftType && !attendance.clockOut) {
            return attendance.shiftType;
        }

        // 2. Jika hari masih pagi (00:00 - 07:59), cek apakah kemarin ada shift Malam (M)
        // Jika ada, berarti shift tersebut masih "berjalan" sampai jam 08:00 WIB.
        if (hour < 8) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = getStartOfDayJakarta(yesterday);

            const userWithYesterday = await prisma.user.findUnique({
                where: { id: userId },
                include: { schedules: { where: { date: yesterdayDate } } }
            });

            if (userWithYesterday) {
                let prevShift = 'OFF';
                if (userWithYesterday.schedules.length > 0) {
                    prevShift = userWithYesterday.schedules[0].shiftCode;
                } else if ((userWithYesterday.role as string) === 'SECURITY') {
                    // Cek rotasi untuk kemarin
                    prevShift = getShiftForDate(userWithYesterday.rotationOffset, yesterday);
                }

                // Jika shift kemarin adalah Malam (M) atau Pagi-Malam (PM), 
                // tampilkan shift tersebut (karena keduanya berakhir jam 08:00 besoknya)
                if (prevShift === 'M' || prevShift === 'PM') return prevShift;
            }
        }

        // 3. Jika bukan transisi shift malam, atau user belum absen, tampilkan shift hari ini
        const todayDate = getStartOfDayJakarta(now);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { schedules: { where: { date: todayDate } } }
        });

        if (!user) return 'OFF';

        let shiftCode = 'OFF';
        if (user.schedules.length > 0) {
            shiftCode = user.schedules[0].shiftCode;
        } else if ((user.role as string) === 'LINGKUNGAN' || (user.role as string) === 'KEBERSIHAN') {
            shiftCode = getStaticSchedule(user.role as string, now);
        } else {
            shiftCode = getShiftForDate(user.rotationOffset, now);
        }

        return shiftCode;
    } catch (error) {
        console.error('Get today user shift error:', error);
        return 'OFF';
    }
}

export async function getAttendances(userId?: string, startDate?: Date, endDate?: Date) {
    try {
        const where: any = {};
        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.clockIn = {};
            if (startDate) {
                where.clockIn.gte = startDate;
            }
            if (endDate) {
                // Ensure we get the whole end day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                where.clockIn.lte = endOfDay;
            }
        }

        return await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        employeeId: true,
                        role: true,
                        image: true,
                    }
                }
            },
            orderBy: {
                clockIn: 'desc'
            },
            take: (startDate || endDate) ? 1000 : 100 // Higher limit when filtering by date
        });
    } catch (error) {
        console.error('Get attendances error:', error);
        return [];
    }
}

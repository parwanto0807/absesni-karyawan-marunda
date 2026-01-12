'use server';

import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@/types/attendance';
import { prisma } from '@/lib/db';
import { createNotification } from './notifications';
import { getShiftForDate, getShiftTimings, ShiftCode } from '@/lib/schedule-utils';

export async function clockIn(userId: string, location: { lat: number, lng: number, address: string }, image: string) {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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

        // Cek apakah ada clock out dalam 3 menit terakhir (toleransi shift)
        const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
        const recentClockOut = await prisma.attendance.findFirst({
            where: {
                userId,
                clockOut: { gte: threeMinutesAgo }
            },
            orderBy: { clockOut: 'desc' }
        });

        if (recentClockOut) {
            const waitTime = Math.ceil((3 * 60 * 1000 - (now.getTime() - new Date(recentClockOut.clockOut!).getTime())) / 1000 / 60);
            return {
                success: false,
                message: `Tunggu ${waitTime} menit setelah clock out untuk clock in shift berikutnya.`
            };
        }

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
            } else {
                shiftCode = getShiftForDate(user.rotationOffset, now);
            }

            const timings = getShiftTimings(shiftCode as ShiftCode, now);
            if (timings) {
                scheduledStart = timings.start;
                scheduledEnd = timings.end;

                // Tolerance 15 or 0? Strict for now.
                // If now > scheduledStart
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
            message: `Anda telah melakukan absen masuk pada ${now.toLocaleTimeString('id-ID')}`,
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
            if (now < scheduledEnd) {
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
                message: `Anda telah melakukan absen keluar pada ${new Date().toLocaleTimeString('id-ID')}`,
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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

export async function getAttendances(userId?: string) {
    try {
        return await prisma.attendance.findMany({
            where: userId ? { userId } : {},
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
            take: 100 // Limit to last 100 records for performance
        });
    } catch (error) {
        console.error('Get attendances error:', error);
        return [];
    }
}

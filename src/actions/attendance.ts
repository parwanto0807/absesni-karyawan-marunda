'use server';

import { revalidatePath } from 'next/cache';
import { AttendanceStatus } from '@/types/attendance';
import { prisma } from '@/lib/db';

import fs from 'fs';
import path from 'path';

async function saveFile(base64Image: string): Promise<string | null> {
    if (!base64Image) return null;

    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const uploadDir = path.join(process.cwd(), 'public/uploads/attendance');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-attendance.jpg`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, buffer);
        return `/uploads/attendance/${fileName}`;
    } catch (error) {
        console.error('Save attendance file error:', error);
        return null;
    }
}

export async function clockIn(userId: string, location: { lat: number, lng: number, address: string }, image: string) {
    try {
        const imageUrl = await saveFile(image);

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                clockIn: new Date(),
                latitude: location.lat,
                longitude: location.lng,
                address: location.address,
                image: imageUrl,
                status: 'PRESENT',
            },
        });

        revalidatePath('/');
        return { success: true, message: 'Berhasil absen masuk!', data: attendance };
    } catch (error) {
        console.error('Clock in error:', error);
        return { success: false, message: 'Gagal melakukan absen.' };
    }
}

export async function clockOut(attendanceId: string) {
    try {
        const attendance = await prisma.attendance.update({
            where: { id: attendanceId },
            data: {
                clockOut: new Date(),
            },
        });

        revalidatePath('/');
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
            }
        });
    } catch (error) {
        console.error('Get attendances error:', error);
        return [];
    }
}

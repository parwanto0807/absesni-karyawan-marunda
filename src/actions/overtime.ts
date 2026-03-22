'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getOvertimes(month?: number, year?: number, userId?: string) {
    const session = await getSession();
    if (!session) return [];

    const where: Record<string, unknown> = {};
    if (userId && userId !== 'all') {
        where.userId = userId;
    }

    if (month !== undefined && year !== undefined) {
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
        where.date = {
            gte: startDate,
            lte: endDate,
        };
    }

    try {
        const overtimes = await prisma.overtime.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                        username: true,
                    }
                }
            },
            orderBy: {
                date: 'desc',
            }
        });
        return overtimes;
    } catch (error) {
        console.error('Error fetching overtimes:', error);
        return [];
    }
}

export async function getOvertimesForSchedule(userIds: string[], month: number, year: number) {
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

    try {
        const overtimes = await prisma.overtime.findMany({
            where: {
                userId: { in: userIds },
                date: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });
        return overtimes;
    } catch (error) {
        console.error('Error fetching overtimes for schedule:', error);
        return [];
    }
}

export async function upsertOvertime(data: {
    id?: string;
    userId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    reason?: string;
    shiftRef?: string;
    notes?: string;
}) {
    const session = await getSession();
    if (!session || !['ADMIN', 'PIC', 'RT'].includes(session.role)) {
        return { error: 'Unauthorized' };
    }

    // Calculate total hours
    // Handle cross-day: if endTime < startTime, it means it ends the next day
    let diff = data.endTime.getTime() - data.startTime.getTime();
    if (diff < 0) {
        // Assume next day
        diff += 24 * 60 * 60 * 1000;
    }
    const totalHours = diff / (1000 * 60 * 60);

    try {
        if (data.id) {
            await prisma.overtime.update({
                where: { id: data.id },
                data: {
                    userId: data.userId,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    totalHours,
                    reason: data.reason,
                    shiftRef: data.shiftRef,
                    notes: data.notes,
                    approvedBy: session.userId,
                }
            });
        } else {
            await prisma.overtime.create({
                data: {
                    userId: data.userId,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    totalHours,
                    reason: data.reason,
                    shiftRef: data.shiftRef,
                    notes: data.notes,
                    approvedBy: session.userId,
                }
            });
        }

        revalidatePath('/schedules');
        revalidatePath('/overtimes');
        return { success: true };
    } catch (error) {
        console.error('Error upserting overtime:', error);
        return { error: 'Gagal menyimpan data lembur.' };
    }
}

export async function deleteOvertime(id: string) {
    const session = await getSession();
    if (!session || !['ADMIN', 'PIC', 'RT'].includes(session.role)) {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.overtime.delete({
            where: { id }
        });
        revalidatePath('/schedules');
        revalidatePath('/overtimes');
        return { success: true };
    } catch (error) {
        console.error('Error deleting overtime:', error);
        return { error: 'Gagal menghapus data lembur.' };
    }
}

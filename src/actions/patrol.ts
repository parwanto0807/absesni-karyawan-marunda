'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getCheckpoints() {
    try {
        const checkpoints = await prisma.patrolCheckpoint.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, data: checkpoints };
    } catch (error) {
        console.error('Get Checkpoints Error:', error);
        return { success: false, message: 'Gagal mengambil data titik patroli.' };
    }
}

export async function getAllCheckpoints() {
    try {
        const checkpoints = await prisma.patrolCheckpoint.findMany({
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, data: checkpoints };
    } catch (error) {
        console.error('Get All Checkpoints Error:', error);
        return { success: false, message: 'Gagal mengambil data titik patroli.' };
    }
}

export async function upsertCheckpoint(data: {
    id?: string;
    name: string;
    location?: string;
    latitude: number;
    longitude: number;
    isActive?: boolean;
}) {
    try {
        if (data.id) {
            const checkpoint = await prisma.patrolCheckpoint.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    location: data.location,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    isActive: data.isActive
                }
            });
            revalidatePath('/admin/administration');
            return { success: true, data: checkpoint };
        } else {
            const checkpoint = await prisma.patrolCheckpoint.create({
                data: {
                    name: data.name,
                    location: data.location,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    isActive: true
                }
            });
            revalidatePath('/admin/administration');
            return { success: true, data: checkpoint };
        }
    } catch (error) {
        console.error('Upsert Checkpoint Error:', error);
        return { success: false, message: 'Gagal menyimpan titik patroli.' };
    }
}

export async function deleteCheckpoint(id: string) {
    try {
        await prisma.patrolCheckpoint.delete({
            where: { id }
        });
        revalidatePath('/admin/administration');
        return { success: true };
    } catch (error) {
        console.error('Delete Checkpoint Error:', error);
        return { success: false, message: 'Gagal menghapus titik patroli.' };
    }
}

export async function savePatrolLog(data: {
    userId: string;
    checkpointId: string;
    sessionId?: string;
    status: string;
    notes?: string;
    image?: string;
    latitude: number;
    longitude: number;
}) {
    try {
        const log = await prisma.patrolLog.create({
            data: {
                userId: data.userId,
                checkpointId: data.checkpointId,
                sessionId: data.sessionId,
                status: data.status,
                notes: data.notes,
                image: data.image,
                latitude: data.latitude,
                longitude: data.longitude
            }
        });

        revalidatePath('/admin/administration');
        revalidatePath('/admin/patrol-history');
        return { success: true, data: log };
    } catch (error) {
        console.error('Save patrol log error:', error);
        return { success: false, message: 'Gagal menyimpan laporan' };
    }
}

export async function startPatrolSession(userId: string) {
    try {
        // Check if there is an active session
        const activeSession = await prisma.patrolSession.findFirst({
            where: {
                userId,
                status: 'IN_PROGRESS'
            }
        });

        if (activeSession) {
            return { success: true, data: activeSession, message: 'Sesi sudah berjalan' };
        }

        const session = await prisma.patrolSession.create({
            data: {
                userId,
                status: 'IN_PROGRESS'
            }
        });

        return { success: true, data: session };
    } catch (error) {
        console.error('Start patrol session error:', error);
        return { success: false, message: 'Gagal memulai sesi' };
    }
}

export async function endPatrolSession(sessionId: string) {
    try {
        await prisma.patrolSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endTime: new Date()
            }
        });

        return { success: true };
    } catch (error) {
        console.error('End patrol session error:', error);
        return { success: false, message: 'Gagal mengakhiri sesi' };
    }
}

export async function getActiveSession(userId: string) {
    try {
        const session = await prisma.patrolSession.findFirst({
            where: {
                userId,
                status: 'IN_PROGRESS'
            },
            include: {
                logs: {
                    select: {
                        checkpointId: true
                    }
                }
            }
        });

        return { success: true, data: session };
    } catch (_error) {
        return { success: false, message: 'Gagal mengambil sesi aktif' };
    }
}

export async function syncPatrolLogs(logs: {
    userId: string;
    checkpointId: string;
    status: string;
    notes?: string;
    image?: string;
    latitude: number;
    longitude: number;
    createdAt?: string;
}[]) {
    try {
        const results = [];
        for (const logData of logs) {
            const log = await prisma.patrolLog.create({
                data: {
                    userId: logData.userId,
                    checkpointId: logData.checkpointId,
                    status: logData.status,
                    notes: logData.notes,
                    image: logData.image,
                    latitude: logData.latitude,
                    longitude: logData.longitude,
                    createdAt: logData.createdAt ? new Date(logData.createdAt) : undefined
                }
            });
            results.push(log);
        }
        revalidatePath('/admin/administration');
        revalidatePath('/admin/patrol-history');
        return { success: true, count: results.length };
    } catch (error) {
        console.error('Sync Patrol Logs Error:', error);
        return { success: false, message: 'Gagal sinkronisasi laporan patroli.' };
    }
}

export async function getRecentPatrolLogs(limit: number = 10) {
    try {
        const logs = await prisma.patrolLog.findMany({
            include: {
                user: { select: { name: true, role: true } },
                checkpoint: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return { success: true, data: logs };
    } catch (error) {
        console.error('Get Recent Patrol Logs Error:', error);
        return { success: false, message: 'Gagal mengambil riwayat patroli.' };
    }
}

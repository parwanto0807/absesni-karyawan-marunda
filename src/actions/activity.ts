'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * Log user activity and perform auto-cleanup of logs older than 3 days
 */
export async function logActivity(userId: string, action: string, target?: string, details?: string, explicitDevice?: string, explicitUsername?: string) {
    try {
        // Skip logging for 'adminit'
        if (explicitUsername === 'adminit') return;

        // If username not provided, we check if this is the adminit user to be safe
        // but typically we should pass the username to avoid this query
        if (!explicitUsername) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });
            if (user?.username === 'adminit') return;
        }

        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        const ip = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || '';

        let device = explicitDevice || 'UNKNOWN';

        if (!explicitDevice) {
            const ua = userAgent.toLowerCase();
            if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
                device = 'MOBILE';
            } else if (ua.includes('windows')) {
                device = 'WINDOWS';
            } else if (ua.includes('macintosh') || ua.includes('linux')) {
                device = 'DESKTOP';
            }
        }

        // 1. Record the activity
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                target,
                details,
                ipAddress: ip,
                userAgent: userAgent,
                device: device
            }
        });

        // 2. Update user's lastActive timestamp
        await prisma.user.update({
            where: { id: userId },
            data: { lastActive: new Date() }
        });

        // 3. Auto-cleanup: Delete logs older than 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        await prisma.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: threeDaysAgo
                }
            }
        });

    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * Get activity logs for admin view
 */
export async function getActivityLogs(limit: number = 100, userId?: string) {
    try {
        const where: Prisma.ActivityLogWhereInput = {
            user: {
                username: { not: 'adminit' }
            }
        };

        if (userId && userId !== 'all') {
            where.userId = userId;
        }

        const logs = await prisma.activityLog.findMany({
            where,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true,
                        role: true,
                        image: true
                    }
                }
            }
        });
        return logs;
    } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        return [];
    }
}

/**
 * Get all users for filter selection
 */
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                username: { not: 'adminit' }
            },
            select: {
                id: true,
                name: true,
                username: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }
}

/**
 * Delete specific activity logs by IDs
 */
export async function deleteActivityLogs(logIds: string[]) {
    try {
        await prisma.activityLog.deleteMany({
            where: {
                id: {
                    in: logIds
                }
            }
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete activity logs:', error);
        return { success: false, message: 'Gagal menghapus data.' };
    }
}

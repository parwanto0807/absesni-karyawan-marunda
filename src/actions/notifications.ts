'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'ATTENDANCE' | 'PERMIT' | 'SYSTEM';
    link?: string;
}) {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Create Notification Error:', error);
        return { success: false };
    }
}

export async function getUserNotifications(userId: string) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit 20 notifications
        });
        return notifications;
    } catch (error) {
        console.error('Get Notifications Error:', error);
        return [];
    }
}

export async function markAsRead(notificationId: string) {
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Mark as read Error:', error);
        return { success: false };
    }
}

export async function markAllAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Mark all as read Error:', error);
        return { success: false };
    }
}

export async function getUnreadCount(userId: string) {
    try {
        const count = await prisma.notification.count({
            where: { userId, isRead: false },
        });
        return count;
    } catch (error) {
        return 0;
    }
}

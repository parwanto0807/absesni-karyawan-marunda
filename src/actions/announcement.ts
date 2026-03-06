'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getAnnouncements() {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: announcements };
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return { success: false, message: 'Gagal mengambil data pengumuman' };
    }
}

export async function createAnnouncement(data: {
    documentNumber: string;
    date: Date;
    to: string;
    subject: string;
    content: string;
    signatoryName: string;
    signatoryRole: string;
}) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'ADMIN')) {
            return { success: false, message: 'Unauthorized' };
        }

        const announcement = await prisma.announcement.create({
            data
        });

        revalidatePath('/admin/administration');
        return { success: true, data: announcement, message: 'Pengumuman berhasil disimpan' };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return { success: false, message: 'Gagal menyimpan pengumuman' };
    }
}

export async function updateAnnouncement(id: string, data: {
    documentNumber?: string;
    date?: Date;
    to?: string;
    subject?: string;
    content?: string;
    signatoryName?: string;
    signatoryRole?: string;
}) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'ADMIN')) {
            return { success: false, message: 'Unauthorized' };
        }

        const announcement = await prisma.announcement.update({
            where: { id },
            data
        });

        revalidatePath('/admin/administration');
        return { success: true, data: announcement, message: 'Pengumuman berhasil diperbarui' };
    } catch (error) {
        console.error('Error updating announcement:', error);
        return { success: false, message: 'Gagal memperbarui pengumuman' };
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'ADMIN')) {
            return { success: false, message: 'Unauthorized' };
        }

        await prisma.announcement.delete({
            where: { id }
        });

        revalidatePath('/admin/administration');
        return { success: true, message: 'Pengumuman berhasil dihapus' };
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return { success: false, message: 'Gagal menghapus pengumuman' };
    }
}

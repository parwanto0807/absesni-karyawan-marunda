'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

export async function createIncidentReport(data: {
    userId: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    evidenceImg?: string;
}) {
    try {
        const report = await prisma.incidentReport.create({
            data: {
                userId: data.userId,
                category: data.category,
                description: data.description,
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address,
                evidenceImg: data.evidenceImg,
                status: 'PENDING'
            },
            include: { user: true }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'PIC'] } }
        });

        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Laporan Kejadian Baru!',
                message: `${report.user.name} melaporkan: ${data.category}`,
                type: 'INCIDENT',
                link: '/admin/incidents'
            });
        }

        revalidatePath('/');
        revalidatePath('/admin/incidents');
        return { success: true, data: report };
    } catch (error) {
        console.error('Create Incident Error:', error);
        return { success: false, message: 'Gagal membuat laporan kejadian.' };
    }
}

export async function getIncidentReports() {
    try {
        const reports = await prisma.incidentReport.findMany({
            include: {
                user: true,
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: reports };
    } catch (error) {
        console.error('Get Incidents Error:', error);
        return { success: false, message: 'Gagal mengambil data laporan.' };
    }
}

export async function getMyRecentIncidents(userId: string) {
    try {
        const reports = await prisma.incidentReport.findMany({
            where: { userId: userId },
            include: {
                user: true,
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        return { success: true, data: reports };
    } catch (error) {
        console.error('Get My Incidents Error:', error);
        return { success: false, message: 'Gagal mengambil data laporan Anda.' };
    }
}

export async function addIncidentComment(reportId: string, userId: string, content: string, newStatus?: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return { success: false, message: 'User tidak ditemukan.' };

        const comment = await prisma.incidentComment.create({
            data: {
                incidentId: reportId,
                userId: userId,
                content: content
            },
            include: {
                user: true,
                incident: {
                    include: { user: true }
                }
            }
        });

        // Update status if provided
        if (newStatus) {
            await prisma.incidentReport.update({
                where: { id: reportId },
                data: {
                    status: newStatus,
                    adminId: ['ADMIN', 'PIC'].includes(user.role) ? userId : undefined
                }
            });
        }

        // Logic for notifications
        if (['ADMIN', 'PIC'].includes(user.role)) {
            // Admin commenting -> Notify Reporter
            await createNotification({
                userId: comment.incident.userId,
                title: 'Tanggapan Admin',
                message: `Admin menanggapi laporan Anda: "${content.substring(0, 50)}..."`,
                type: 'INCIDENT',
                link: '/'
            });
        } else {
            // User commenting -> Notify Admins/PICs
            const admins = await prisma.user.findMany({
                where: { role: { in: ['ADMIN', 'PIC'] } }
            });

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    title: 'Balasan Petugas',
                    message: `${user.name} membalas laporan: "${content.substring(0, 50)}..."`,
                    type: 'INCIDENT',
                    link: '/admin/incidents'
                });
            }
        }

        revalidatePath('/');
        revalidatePath('/admin/incidents');
        return { success: true, data: comment };
    } catch (error) {
        console.error('Add Comment Error:', error);
        return { success: false, message: 'Gagal mengirim komentar.' };
    }
}

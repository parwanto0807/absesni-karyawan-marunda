'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';
import { triggerPusher } from '@/lib/pusher-server';
import { getSettings } from './settings';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';
import { WhatsAppProvider } from '@/lib/whatsapp';

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
            where: { role: { in: ['ADMIN', 'PIC', 'RT'] } }
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

        // Trigger Realtime - Send a "clean" version without heavy Base64 image
        const pusherReport = { ...report, evidenceImg: report.evidenceImg ? 'HAS_IMAGE' : null };
        await triggerPusher('incidents', 'new-incident', pusherReport);

        // 📢 WhatsApp Notification for Incident
        const settings = await getSettings();
        if (settings.WA_ENABLE_LATE_NOTIF === 'true' && settings.WA_API_KEY && settings.WA_GROUP_ID) {
            const message = `🚨 *LAPORAN INSIDEN BARU* 🚨\n\n` +
                `*Pelapor:* ${report.user.name}\n` +
                `*Divisi:* ${report.user.role}\n` +
                `*Kategori:* ${data.category}\n` +
                `*Waktu:* ${format(toZonedTime(new Date(), TIMEZONE), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB\n` +
                `*Lokasi:* ${data.address || 'Lihat di aplikasi'}\n\n` +
                `*Keterangan:* \n${data.description}\n\n` +
                `_Mohon segera ditindaklanjuti oleh tim terkait._`;

            // Fire and forget
            sendWhatsAppMessage(message, {
                provider: (settings.WA_PROVIDER as WhatsAppProvider) || 'fonnte',
                apiKey: settings.WA_API_KEY,
                target: settings.WA_GROUP_ID,
                numberKey: settings.WA_NUMBER_KEY
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

export async function getIncidentReports(excludeResolved: boolean = false) {
    try {
        const whereClause: { status?: { not: string } } = {};
        if (excludeResolved) {
            whereClause.status = { not: 'RESOLVED' };
        }

        const reports = await prisma.incidentReport.findMany({
            where: whereClause,
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

export async function getMyRecentIncidents(userId: string, excludeResolved: boolean = false) {
    try {
        const whereClause: { userId: string, status?: { not: string } } = { userId: userId };
        if (excludeResolved) {
            whereClause.status = { not: 'RESOLVED' };
        }

        const reports = await prisma.incidentReport.findMany({
            where: whereClause,
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
                    adminId: ['ADMIN', 'PIC', 'RT'].includes(user.role) ? userId : undefined
                }
            });
        }

        // Logic for notifications
        if (['ADMIN', 'PIC', 'RT'].includes(user.role)) {
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
                where: { role: { in: ['ADMIN', 'PIC', 'RT'] } }
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

        // Trigger Realtime - Strip incident details for minimal size
        const pusherComment = {
            ...comment,
            incident: { id: comment.incidentId, status: newStatus || comment.incident.status },
            newStatus: newStatus
        };

        await triggerPusher(`incident-${reportId}`, 'new-comment', pusherComment);

        // Trigger Global Update for the list (Status change)
        // Strip sensitive/heavy data to ensure it's under 10KB
        await triggerPusher('incident-globals', 'update', {
            incidentId: reportId,
            newStatus: newStatus,
            lastMessage: content.substring(0, 30),
            senderId: userId,
            senderName: user.name,
            fullComment: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                userId: comment.userId,
                incidentId: comment.incidentId,
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    image: user.image
                }
            }
        });

        revalidatePath('/');
        revalidatePath('/admin/incidents');

        return { success: true, data: comment };
    } catch (error) {
        console.error('Add Comment Error:', error);
        return { success: false, message: 'Gagal mengirim komentar.' };
    }
}

export async function updateIncidentAdminNotes(reportId: string, data: {
    actionDetail?: string;
    analysis?: string;
    improvement?: string;
}) {
    try {
        const report = await prisma.incidentReport.update({
            where: { id: reportId },
            data: {
                actionDetail: data.actionDetail,
                analysis: data.analysis,
                improvement: data.improvement
            }
        });

        revalidatePath('/admin/incidents');
        return { success: true, data: report };
    } catch (error) {
        console.error('Update Admin Notes Error:', error);
        return { success: false, message: 'Gagal memperbarui catatan admin.' };
    }
}

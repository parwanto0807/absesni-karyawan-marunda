'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';
import { TIMEZONE } from '@/lib/date-utils';
import { getSettings } from './settings';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export async function createPermit(formData: FormData) {
    try {
        const userId = formData.get('userId') as string;
        console.log('Creating permit for userId:', userId);
        const type = formData.get('type') as string;
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('endDate') as string);
        const reason = formData.get('reason') as string;
        const file = formData.get('image') as File;

        // ✅ Vercel Compatible: Convert File to Base64
        let imageUrl: string | null = null;
        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        }

        // Check for overlapping permits
        const existingPermit = await prisma.permit.findFirst({
            where: {
                userId,
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate }
                    }
                ]
            }
        });

        if (existingPermit) {
            return {
                success: false,
                message: `Anda sudah memiliki pengajuan izin pada tanggal tersebut (${new Date(existingPermit.startDate).toLocaleDateString('id-ID', { timeZone: TIMEZONE })} s/d ${new Date(existingPermit.endDate).toLocaleDateString('id-ID', { timeZone: TIMEZONE })}).`
            };
        }

        await prisma.permit.create({
            data: {
                userId,
                type,
                startDate,
                endDate,
                reason,
                image: imageUrl,
                adminStatus: 'PENDING',
                rtStatus: 'PENDING',
                finalStatus: 'PENDING',
            }
        });

        // 🎉 Notify User
        await createNotification({
            userId,
            title: 'Pengajuan Izin Berhasil',
            message: `Pengajuan izin ${type} Anda telah diterima dan sedang menunggu persetujuan.`,
            type: 'PERMIT',
        });

        // 🎉 Notify Admins
        const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'PIC', 'RT'] } } });
        for (const admin of admins) {
            await createNotification({
                userId: admin.id,
                title: 'Pengajuan Izin Baru',
                message: `User telah mengajukan izin ${type}.`,
                type: 'PERMIT',
                link: '/admin/permits'
            });
        }

        revalidatePath('/permits');

        // 📢 WhatsApp Notification for Permit
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const settings = await getSettings();
        if (user && settings.WA_ENABLE_LATE_NOTIF === 'true' && settings.WA_API_KEY && settings.WA_GROUP_ID) {
            const message = `📝 *PENGAJUAN IZIN BARU* 📝\n\n` +
                `*Nama:* ${user.name}\n` +
                `*Divisi:* ${user.role}\n` +
                `*Jenis:* ${type}\n` +
                `*Mulai:* ${format(toZonedTime(startDate, TIMEZONE), 'dd MMMM yyyy', { locale: id })}\n` +
                `*Sampai:* ${format(toZonedTime(endDate, TIMEZONE), 'dd MMMM yyyy', { locale: id })}\n` +
                `*Alasan:* ${reason}\n\n` +
                `_Mohon untuk segera ditinjau oleh Admin & RT._`;

            // Fire and forget
            sendWhatsAppMessage(message, {
                provider: (settings.WA_PROVIDER as any) || 'fonnte',
                apiKey: settings.WA_API_KEY,
                target: settings.WA_GROUP_ID,
                numberKey: settings.WA_NUMBER_KEY
            });
        }

        return { success: true, message: 'Pengajuan izin berhasil dibuat.' };
    } catch (error) {
        console.error('Create Permit Error:', error);
        return { success: false, message: 'Gagal membuat pengajuan izin.' };
    }
}

export async function approvePermit(permitId: string, role: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    try {
        if (role !== 'ADMIN' && role !== 'PIC' && role !== 'RT') {
            return { success: false, message: 'Hanya PIC, RT, atau ADMIN yang dapat memberikan persetujuan.' };
        }

        const now = new Date();
        const updateData: any = {};
        if (role === 'ADMIN' || role === 'PIC') {
            updateData.adminStatus = status;
            updateData.adminId = approverId;
            updateData.adminAt = now;
        } else if (role === 'RT') {
            updateData.rtStatus = status;
            updateData.rtId = approverId;
            updateData.rtAt = now;
        }

        const updatedPermit = await prisma.permit.update({
            where: { id: permitId },
            data: updateData
        });

        // Determine finalStatus
        let finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
        if (updatedPermit.adminStatus === 'APPROVED' && updatedPermit.rtStatus === 'APPROVED') {
            finalStatus = 'APPROVED';
        } else if (updatedPermit.adminStatus === 'REJECTED' || updatedPermit.rtStatus === 'REJECTED') {
            finalStatus = 'REJECTED';
        }

        if (finalStatus !== 'PENDING') {
            await prisma.permit.update({
                where: { id: permitId },
                data: { finalStatus }
            });
        }

        // 🎉 Notify User of Progress/Final Status
        const permit = await prisma.permit.findUnique({ where: { id: permitId } });
        if (permit) {
            // 1. Progress Notifications (Indivdual Approval)
            if (status === 'APPROVED' && finalStatus === 'PENDING') {
                const isByAdmin = role === 'ADMIN' || role === 'PIC';
                const approverLabel = isByAdmin ? 'Admin BPL' : 'Ketua RT';
                const nextStep = isByAdmin ? 'Ketua RT' : 'Admin BPL/Koordinator Security';

                await createNotification({
                    userId: permit.userId,
                    title: `Izin Disetujui ${approverLabel}`,
                    message: `Pengajuan izin ${permit.type} Anda telah disetujui oleh ${approverLabel}. Menunggu Persetujuan ${nextStep}.`,
                    type: 'PERMIT',
                });
            }

            // 2. Final Status Notifications
            if (finalStatus !== 'PENDING') {
                await createNotification({
                    userId: permit.userId,
                    title: finalStatus === 'APPROVED' ? 'Izin DISETUJUI (Final)' : 'Izin DITOLAK',
                    message: finalStatus === 'APPROVED'
                        ? `Selamat! Pengajuan izin ${permit.type} Anda telah disetujui sepenuhnya oleh Admin & RT.`
                        : `Pengajuan izin ${permit.type} Anda ditolak.`,
                    type: 'PERMIT',
                });
            }
        }

        revalidatePath('/permits');
        return { success: true, message: `Pengajuan izin telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'} oleh ${role}.` };
    } catch (error) {
        console.error('Approve Permit Error:', error);
        return { success: false, message: 'Gagal memperbarui status izin.' };
    }
}

export async function resetPermit(permitId: string, role: string) {
    try {
        if (role !== 'ADMIN' && role !== 'PIC' && role !== 'RT') {
            return { success: false, message: 'Hanya PIC, RT, atau ADMIN yang dapat mereset status.' };
        }

        const updateData: any = {
            finalStatus: 'PENDING' // Always back to pending if anyone resets
        };

        if (role === 'ADMIN' || role === 'PIC') {
            updateData.adminStatus = 'PENDING';
            updateData.adminId = null;
            updateData.adminAt = null;
        } else if (role === 'RT') {
            updateData.rtStatus = 'PENDING';
            updateData.rtId = null;
            updateData.rtAt = null;
        }

        await prisma.permit.update({
            where: { id: permitId },
            data: updateData
        });

        // 🎉 Notify User of Reset
        const permit = await prisma.permit.findUnique({ where: { id: permitId } });
        if (permit) {
            const resetBy = (role === 'ADMIN' || role === 'PIC') ? 'Admin BPL' : 'Ketua RT';
            await createNotification({
                userId: permit.userId,
                title: 'Pengajuan Izin Di-pending',
                message: `Status pengajuan izin ${permit.type} Anda telah di-pending oleh ${resetBy} ke status PENDING untuk pengecekan ulang.`,
                type: 'PERMIT',
            });
        }

        revalidatePath('/permits');
        return { success: true, message: 'Status pengajuan izin telah di-pending ke PENDING.' };
    } catch (error) {
        console.error('Reset Permit Error:', error);
        return { success: false, message: 'Gagal mem-pending status izin.' };
    }
}

export async function getPermits(userId?: string) {
    try {
        return await prisma.permit.findMany({
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
                createdAt: 'desc'
            }
        });
    } catch (error) {
        console.error('Get Permits Error:', error);
        return [];
    }
}

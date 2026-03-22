'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';
import { TIMEZONE } from '@/lib/date-utils';
import { getSettings } from './settings';
import { sendWhatsAppMessage, WhatsAppProvider } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function createPermit(formData: FormData) {
    try {
        const userId = formData.get('userId') as string;
        const type = formData.get('type') as string;
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('endDate') as string);
        const reason = formData.get('reason') as string;
        const file = formData.get('image') as File;
        let imageUrl: string | null = null;

        if (file && file.size > 0) {
            // ✅ Save to local file system instead of Base64
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${userId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const path = `public/uploads/permits/${fileName}`;

            // Ensure directory exists (extra check)
            const dir = join(process.cwd(), 'public/uploads/permits');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            await writeFile(join(process.cwd(), path), buffer);
            imageUrl = `/uploads/permits/${fileName}`;
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
                provider: (settings.WA_PROVIDER as WhatsAppProvider) || 'fonnte',
                apiKey: settings.WA_API_KEY,
                target: settings.WA_GROUP_ID,
                numberKey: settings.WA_NUMBER_KEY
            });
        }

        return { success: true, message: 'Pengajuan izin berhasil dibuat.' };
    } catch {
        return { success: false, message: 'Gagal membuat pengajuan izin.' };
    }
}

export async function approvePermit(permitId: string, role: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    try {
        const approver = await prisma.user.findUnique({
            where: { id: approverId },
            select: { canApprovePermits: true, username: true }
        });

        if (!approver?.canApprovePermits && approver?.username !== 'adminit') {
            return { success: false, message: 'Anda tidak memiliki kewenangan untuk menyetujui izin.' };
        }

        const permit = await prisma.permit.findUnique({ where: { id: permitId } });
        if (!permit) return { success: false, message: 'Izin tidak ditemukan.' };

        if (permit.approvedByIds.includes(approverId) || permit.rejectedByIds.includes(approverId)) {
            return { success: false, message: 'Anda sudah pernah memproses izin ini.' };
        }

        const totalApprovers = await prisma.user.count({ where: { canApprovePermits: true } });

        const newApprovedByIds = [...permit.approvedByIds];
        const newRejectedByIds = [...permit.rejectedByIds];

        if (status === 'APPROVED') {
            newApprovedByIds.push(approverId);
        } else {
            newRejectedByIds.push(approverId);
        }

        let newFinalStatus = permit.finalStatus;
        if (newRejectedByIds.length > 0) {
            newFinalStatus = 'REJECTED';
        } else if (newApprovedByIds.length >= totalApprovers && totalApprovers > 0) {
            newFinalStatus = 'APPROVED';
        }

        const updatedPermit = await prisma.permit.update({
            where: { id: permitId },
            data: {
                approvedByIds: newApprovedByIds,
                rejectedByIds: newRejectedByIds,
                finalStatus: newFinalStatus
            }
        });

        // We don't fetch permit again, we use `permit` variable
        if (updatedPermit.finalStatus !== 'PENDING') {
            
            // Auto Update Schedule when Approved
            if (updatedPermit.finalStatus === 'APPROVED') {
                const datesToUpdate: Date[] = [];
                const currentDate = new Date(permit.startDate);
                // Set hours to noon UTC to avoid timezone issues when matching dates
                currentDate.setUTCHours(12, 0, 0, 0);
                
                const end = new Date(permit.endDate);
                end.setUTCHours(12, 0, 0, 0);

                while (currentDate <= end) {
                    datesToUpdate.push(new Date(currentDate));
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                }

                // Upsert all schedules to the permit type (IZIN, CUTI, SAKIT)
                for (const date of datesToUpdate) {
                    await prisma.schedule.upsert({
                        where: {
                            userId_date: {
                                userId: permit.userId,
                                date: date
                            }
                        },
                        update: {
                            shiftCode: permit.type
                        },
                        create: {
                            userId: permit.userId,
                            date: date,
                            shiftCode: permit.type
                        }
                    });
                }
            }

            await createNotification({
                userId: permit.userId,
                title: updatedPermit.finalStatus === 'APPROVED' ? 'Izin DISETUJUI' : 'Izin DITOLAK',
                message: updatedPermit.finalStatus === 'APPROVED'
                    ? `Selamat! Pengajuan izin ${permit.type} Anda telah disetujui.`
                    : `Mohon Maaf, Pengajuan izin ${permit.type} Anda ditolak.`,
                type: 'PERMIT',
            });
        }

        revalidatePath('/permits');
        revalidatePath('/schedules');
        return { success: true, message: `Pengajuan izin telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}.` };
    } catch {
        return { success: false, message: 'Gagal memperbarui status izin.' };
    }
}

export async function resetPermit(permitId: string, role: string, approverId: string) {
    try {
        const approver = await prisma.user.findUnique({
            where: { id: approverId },
            select: { canApprovePermits: true, username: true }
        });

        if (!approver?.canApprovePermits && approver?.username !== 'adminit') {
            return { success: false, message: 'Anda tidak memiliki kewenangan untuk mereset status.' };
        }

        const updateData = {
            finalStatus: 'PENDING' as const,
            approvedByIds: [],
            rejectedByIds: [],
        };

        await prisma.permit.update({
            where: { id: permitId },
            data: updateData
        });

        // 🎉 Notify User of Reset
        const permit = await prisma.permit.findUnique({ where: { id: permitId } });
        if (permit) {
            await createNotification({
                userId: permit.userId,
                title: 'Pengajuan Izin Di-pending',
                message: `Status pengajuan izin ${permit.type} Anda telah di-pending ulang untuk evaluasi.`,
                type: 'PERMIT',
            });
        }

        revalidatePath('/permits');
        return { success: true, message: 'Status pengajuan izin telah di-pending ke PENDING.' };
    } catch {
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
    } catch {
        return [];
    }
}

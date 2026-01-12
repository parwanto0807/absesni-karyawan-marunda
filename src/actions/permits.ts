'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';
import { TIMEZONE } from '@/lib/date-utils';

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
                securityStatus: 'PENDING',
                lingkunganStatus: 'PENDING',
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
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
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
        return { success: true, message: 'Pengajuan izin berhasil dibuat.' };
    } catch (error) {
        console.error('Create Permit Error:', error);
        return { success: false, message: 'Gagal membuat pengajuan izin.' };
    }
}

export async function approvePermit(permitId: string, role: string, status: 'APPROVED' | 'REJECTED', approverId: string) {
    try {
        if (role !== 'ADMIN' && role !== 'PIC') {
            return { success: false, message: 'Hanya PIC atau ADMIN yang dapat memberikan persetujuan.' };
        }

        const now = new Date();
        await prisma.permit.update({
            where: { id: permitId },
            data: {
                finalStatus: status,
                adminId: approverId,
                adminAt: now,
                // Automatically set secondary statuses for data consistency if needed, 
                // but finalStatus is the source of truth now.
                securityStatus: status,
                lingkunganStatus: status,
            }
        });

        // 🎉 Notify User of Approval/Rejection
        const permit = await prisma.permit.findUnique({ where: { id: permitId } });
        if (permit) {
            await createNotification({
                userId: permit.userId,
                title: status === 'APPROVED' ? 'Izin Disetujui' : 'Izin Ditolak',
                message: `Pengajuan izin ${permit.type} Anda telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}.`,
                type: 'PERMIT',
            });
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
        if (role !== 'ADMIN' && role !== 'PIC') {
            return { success: false, message: 'Hanya PIC atau ADMIN yang dapat mereset status.' };
        }

        await prisma.permit.update({
            where: { id: permitId },
            data: {
                finalStatus: 'PENDING',
                securityStatus: 'PENDING',
                lingkunganStatus: 'PENDING',
                adminId: null,
                adminAt: null,
            }
        });

        revalidatePath('/permits');
        return { success: true, message: 'Status pengajuan izin telah direset ke PENDING.' };
    } catch (error) {
        console.error('Reset Permit Error:', error);
        return { success: false, message: 'Gagal mereset status izin.' };
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

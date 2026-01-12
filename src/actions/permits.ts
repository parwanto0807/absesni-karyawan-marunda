'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

async function saveFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public/uploads/permits');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, buffer);
        return `/uploads/permits/${fileName}`;
    } catch (error) {
        console.error('Save permit file error:', error);
        return null;
    }
}

export async function createPermit(formData: FormData) {
    try {
        const userId = formData.get('userId') as string;
        console.log('Creating permit for userId:', userId);
        const type = formData.get('type') as string;
        const startDate = new Date(formData.get('startDate') as string);
        const endDate = new Date(formData.get('endDate') as string);
        const reason = formData.get('reason') as string;
        const file = formData.get('image') as File;

        const imageUrl = await saveFile(file);

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
                message: `Anda sudah memiliki pengajuan izin pada tanggal tersebut (${new Date(existingPermit.startDate).toLocaleDateString('id-ID')} s/d ${new Date(existingPermit.endDate).toLocaleDateString('id-ID')}).`
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

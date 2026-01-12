'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/types/attendance';
import fs from 'fs';
import path from 'path';

async function saveFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}`;
}

export async function createUser(formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const employeeId = formData.get('employeeId') as string;
    const imageFile = formData.get('image') as File;
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');

    try {
        const imageUrl = await saveFile(imageFile);

        await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: role as any,
                employeeId,
                image: imageUrl,
                rotationOffset,
            },
        });
        revalidatePath('/employees');
        return { success: true, message: 'Karyawan berhasil ditambahkan.' };
    } catch (error: any) {
        console.error('Create User Error:', error);
        if (error.code === 'P2002') {
            return { success: false, message: 'Username atau ID Karyawan sudah digunakan.' };
        }
        return { success: false, message: 'Gagal menambahkan karyawan. Detail: ' + (error.message || 'Unknown error') };
    }
}

export async function updateUser(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const role = formData.get('role') as UserRole;
    const employeeId = formData.get('employeeId') as string;
    const password = formData.get('password') as string;
    const imageFile = formData.get('image') as File;
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');

    try {
        const data: any = {
            name,
            username,
            role: role as any,
            employeeId,
            rotationOffset,
        };

        // Handle image upload if a new file is provided
        if (imageFile && imageFile.size > 0) {
            const imageUrl = await saveFile(imageFile);
            if (imageUrl) data.image = imageUrl;
        }

        // Only update password if provided
        if (password && password.trim() !== '') {
            data.password = password;
        }

        await prisma.user.update({
            where: { id },
            data,
        });
        revalidatePath('/employees');
        revalidatePath('/');
        return { success: true, message: 'Data karyawan berhasil diperbarui.' };
    } catch (error: any) {
        console.error('Update User Error:', error);
        return { success: false, message: 'Gagal memperbarui data karyawan. Detail: ' + (error.message || 'Unknown error') };
    }
}

export async function deleteUser(id: string) {
    try {
        // Find user to delete image file
        const user = await prisma.user.findUnique({ where: { id } });
        if (user?.image) {
            const filePath = path.join(process.cwd(), 'public', user.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.user.delete({
            where: { id },
        });
        revalidatePath('/employees');
        return { success: true, message: 'Karyawan berhasil dihapus.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus karyawan.' };
    }
}
export async function updateRotationOffset(id: string, offset: number) {
    try {
        await prisma.user.update({
            where: { id },
            data: { rotationOffset: offset },
        });
        revalidatePath('/schedules');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Gagal memperbarui offset.' };
    }
}

export async function createManualSchedule(userId: string, date: Date, shiftCode: string) {
    try {
        // Reset date to midnight for consistency
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        await prisma.schedule.upsert({
            where: {
                userId_date: {
                    userId,
                    date: targetDate,
                }
            },
            update: {
                shiftCode,
            },
            create: {
                userId,
                date: targetDate,
                shiftCode,
            },
        });
        revalidatePath('/schedules');
        return { success: true };
    } catch (error) {
        console.error('Manual Schedule Error:', error);
        return { success: false, message: 'Gagal merubah jadwal manual.' };
    }
}

export async function deleteManualSchedule(userId: string, date: Date) {
    try {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        await prisma.schedule.delete({
            where: {
                userId_date: {
                    userId,
                    date: targetDate,
                }
            },
        });
        revalidatePath('/schedules');
        return { success: true };
    } catch (error) {
        console.error('Delete Manual Schedule Error:', error);
        return { success: false, message: 'Gagal meriset jadwal manual.' };
    }
}

'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/types/attendance';
import { Role } from '@prisma/client';
import { getSession } from '@/lib/auth';

export async function createUser(formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const employeeId = formData.get('employeeId') as string;
    const imageBase64 = formData.get('image') as string; // Base64 string
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');



    try {
        // Validate image - must be string and start with data:image or be null
        let validImage: string | null = null;
        if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
            validImage = imageBase64;

        } else {

        }

        // ✅ Simpan base64 langsung ke database (Vercel compatible)
        await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: role as Role,
                employeeId,
                image: validImage,
                rotationOffset,
            },
        });
        revalidatePath('/employees');
        return { success: true, message: 'Karyawan berhasil ditambahkan.' };
    } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        console.error('Create User Error:', err);
        if (err.code === 'P2002') {
            return { success: false, message: 'Username atau ID Karyawan sudah digunakan.' };
        }
        return { success: false, message: 'Gagal menambahkan karyawan. Detail: ' + (err.message || 'Unknown error') };
    }
}

export async function updateUser(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const role = formData.get('role') as UserRole;
    const employeeId = formData.get('employeeId') as string;
    const password = formData.get('password') as string;
    const imageBase64 = formData.get('image') as string; // Base64 string
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');





    try {
        const data: {
            name: string;
            username: string;
            role: Role;
            employeeId: string;
            rotationOffset: number;
            image?: string;
            password?: string;
            isPasswordDefault?: boolean;
        } = {
            name,
            username,
            role: role as Role,
            employeeId,
            rotationOffset,
        };

        // Handle image upload if base64 is provided and valid
        if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
            data.image = imageBase64; // Simpan base64 langsung

        } else {

        }

        // Only update password if provided
        if (password && password.trim() !== '') {
            data.password = password;
            // Also reset to default password status so user is forced to change it
            data.isPasswordDefault = true;
        }

        await prisma.user.update({
            where: { id },
            data,
        });
        revalidatePath('/employees');
        revalidatePath('/');

        return { success: true, message: 'Data karyawan berhasil diperbarui.' };
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Update User Error:', err);
        return { success: false, message: 'Gagal memperbarui data karyawan. Detail: ' + (err.message || 'Unknown error') };
    }
}

export async function deleteUser(id: string) {
    try {
        // ✅ No need to delete file, base64 is in database
        await prisma.user.delete({
            where: { id },
        });
        revalidatePath('/employees');
        return { success: true, message: 'Karyawan berhasil dihapus.' };
    } catch (_error) {
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
    } catch (_error) {
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
export async function getTargetUsers() {
    try {
        const session = await getSession();
        if (!session || session.username !== 'adminit') {
            return [];
        }

        const users = await prisma.user.findMany({
            select: {
                username: true,
                name: true,
            },
            orderBy: {
                name: 'asc'
            }
        });
        return users;
    } catch (error) {
        console.error('Fetch Target Users Error:', error);
        return [];
    }
}

export async function resetUserPassword(targetUsername: string, newPassword: string) {
    try {
        const session = await getSession();
        if (!session || session.username !== 'adminit') {
            return { success: false, message: 'Otoritas tidak cukup. Hanya adminit yang dapat melakukan ini.' };
        }

        const user = await prisma.user.findUnique({
            where: { username: targetUsername }
        });

        if (!user) {
            return { success: false, message: 'Karyawan tidak ditemukan.' };
        }

        await prisma.user.update({
            where: { username: targetUsername },
            data: {
                password: newPassword,
                isPasswordDefault: true // Force them to change it again for safety
            }
        });

        return { success: true, message: `Password untuk @${targetUsername} berhasil direset.` };
    } catch (error) {
        console.error('Reset Password Error:', error);
        return { success: false, message: 'Gagal meriset password.' };
    }
}

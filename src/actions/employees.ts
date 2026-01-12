'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/types/attendance';

export async function createUser(formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const employeeId = formData.get('employeeId') as string;
    const imageBase64 = formData.get('image') as string; // Base64 string
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');

    console.log('📸 Image Upload Debug:', {
        hasImage: !!imageBase64,
        imageLength: imageBase64?.length || 0,
        imagePrefix: imageBase64?.substring(0, 30) || 'null'
    });

    try {
        // Validate image - must be string and start with data:image or be null
        let validImage: string | null = null;
        if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
            validImage = imageBase64;
            console.log('✅ Image validated successfully, length:', validImage.length);
        } else {
            console.log('⚠️ No valid image provided');
        }

        // ✅ Simpan base64 langsung ke database (Vercel compatible)
        await prisma.user.create({
            data: {
                name,
                username,
                password,
                role: role as any,
                employeeId,
                image: validImage,
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
    const imageBase64 = formData.get('image') as string; // Base64 string
    const rotationOffset = parseInt(formData.get('rotationOffset') as string || '0');

    const debugInfo = {
        hasImage: !!imageBase64,
        imageLength: imageBase64?.length || 0,
        imagePrefix: imageBase64?.substring(0, 30) || 'null'
    };

    console.log('📸 Update Image Debug:', debugInfo);

    try {
        const data: any = {
            name,
            username,
            role: role as any,
            employeeId,
            rotationOffset,
        };

        // Handle image upload if base64 is provided and valid
        if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
            data.image = imageBase64; // Simpan base64 langsung
            console.log('✅ Image will be updated, length:', imageBase64.length);
        } else {
            console.log('⚠️ No valid image to update');
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

        // Return debug info in message
        const debugMsg = `Data karyawan berhasil diperbarui. [DEBUG: Image=${debugInfo.hasImage ? 'YES' : 'NO'}, Length=${debugInfo.imageLength}]`;
        return { success: true, message: debugMsg };
    } catch (error: any) {
        console.error('Update User Error:', error);
        return { success: false, message: 'Gagal memperbarui data karyawan. Detail: ' + (error.message || 'Unknown error') };
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

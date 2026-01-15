'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { encrypt } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { prisma } from '@/lib/db';
import { logActivity } from './activity';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const selectedRole = formData.get('selectedRole') as string;
    let user;

    try {
        // Validate credentials using the real database
        user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || user.password !== password) {
            return { error: 'Username atau password salah.' };
        }

        // Validate role matches
        if (selectedRole && user.role !== selectedRole) {
            return { error: `Role tidak sesuai! Akun ini adalah ${user.role}, bukan ${selectedRole}.` };
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Record activity
        await logActivity(user.id, 'LOGIN', '/login', 'User berhasil login');

        // Create the session
        const expires = new Date(Date.now() + 60 * 60 * 2000); // 2 hours
        const session = await encrypt({
            userId: user.id,
            role: user.role as UserRole,
            username: user.username,
            iat: Math.floor(Date.now() / 1000), // Original login time
        });

        // Save the session in a cookie
        (await cookies()).set('session', session, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `System Error: ${errorMessage}` };
    }

    // Redirect outside try-catch to allow cleanup
    redirect('/dashboard');
}

export async function logout() {
    // Destroy the session
    (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        return { error: 'User tidak ditemukan.' };
    }

    if (user.password !== oldPassword) {
        return { error: 'Password lama salah.' };
    }

    await prisma.user.update({
        where: { id: userId },
        data: { password: newPassword }
    });

    return { success: true };
}

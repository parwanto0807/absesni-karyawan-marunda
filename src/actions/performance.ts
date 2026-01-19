'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotification, createBroadcastNotification } from './notifications';
import { getSettings } from './settings';
import { sendWhatsAppMessage, WhatsAppProvider } from '@/lib/whatsapp';

export async function checkVoucherClaimed(userId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const claim = await prisma.voucherClaim.findUnique({
        where: {
            userId_month_year: {
                userId,
                month,
                year
            }
        }
    });

    return !!claim;
}

export async function claimVoucherAction() {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    const now = new Date();
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = monthNames[now.getMonth()];

    try {
        await prisma.voucherClaim.create({
            data: {
                userId: session.userId,
                month,
                year
            }
        });

        // 1. Personal Notification
        await createNotification({
            userId: session.userId,
            title: '🎁 Voucher Berhasil Diklaim!',
            message: `Selamat! Anda berhasil mengklaim voucher performa 100% untuk periode ${monthName} ${year}.`,
            type: 'SYSTEM',
            link: '/dashboard'
        });

        // 2. Broadcast Notification (To All Roles)
        await createBroadcastNotification({
            title: '🏆 Performance Terbaik!',
            message: `${session.username} baru saja mengklaim Voucher Performance 100% bulan ini! Luar biasa!`,
            type: 'SYSTEM',
            link: `/dashboard`
        });

        // 3. WhatsApp Notification (Broadcast to Group)
        const settings = await getSettings();
        if (settings.WA_API_KEY && settings.WA_GROUP_ID) {
            const message = `🏆 *PERFORMANCE TERBAIK!* 🏆\n\n` +
                `Selamat kepada *${session.username}* (${session.role}) yang baru saja mengklaim *Voucher Performance 100%* periode ${monthName} ${year}!\n\n` +
                `_Terus pertahankan kinerja luar biasa Anda!_ 🚀`;

            // Fire and forget
            sendWhatsAppMessage(message, {
                provider: (settings.WA_PROVIDER as WhatsAppProvider) || 'fonnte',
                apiKey: settings.WA_API_KEY,
                target: settings.WA_GROUP_ID,
                numberKey: settings.WA_NUMBER_KEY
            });
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error claiming voucher:', error);
        return { success: false, error: 'Sudah diklaim atau terjadi kesalahan.' };
    }
}

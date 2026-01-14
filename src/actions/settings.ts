'use server';

import { prisma } from '@/lib/db';
import { triggerPusher } from '@/lib/pusher-server';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function getSettings() {
    try {
        const settings = await prisma.setting.findMany();
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        return settingsMap;
    } catch (error) {
        console.error('Get Settings Error:', error);
        return {};
    }
}

export async function updateSettings(settings: Record<string, string>) {
    try {
        const ops = Object.entries(settings).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            })
        );
        await Promise.all(ops);
        revalidatePath('/admin/settings');
        revalidatePath('/attendance');
        return { success: true, message: 'Pengaturan berhasil diperbarui.' };
    } catch (error) {
        console.error('Update Settings Error:', error);
        return { success: false, message: 'Gagal memperbarui pengaturan.' };
    }
}

export async function testWhatsAppMessage(message: string, target: string, apiKey: string) {
    try {
        const result = await sendWhatsAppMessage(message, target, apiKey);
        return result;
    } catch (error) {
        console.error('Test WA Error:', error);
        return { success: false, message: 'Terjadi kesalahan saat mencoba mengirim pesan.' };
    }
}

export async function getPusherConfig() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: ['PUSHER_KEY', 'PUSHER_CLUSTER', 'PUSHER_ENABLE']
                }
            }
        });

        const config: Record<string, string> = {};
        settings.forEach(s => {
            config[s.key] = s.value;
        });

        return {
            enabled: config.PUSHER_ENABLE === 'true',
            key: config.PUSHER_KEY || '',
            cluster: config.PUSHER_CLUSTER || ''
        };
    } catch (error) {
        console.error('Get Pusher Config Error:', error);
        return { enabled: false, key: '', cluster: '' };
    }
}

export async function testPusherAction() {
    try {
        const result = await triggerPusher('admin-test', 'test-event', {
            message: 'Koneksi Pusher Berhasil!',
            time: new Date().toISOString()
        });
        if (result) {
            return { success: true, message: 'Sinyal tes berhasil dikirim ke Pusher.' };
        }
        return { success: false, message: 'Gagal mengirim sinyal. Cek log server atau pastikan Pusher sudah Aktif.' };
    } catch (error) {
        console.error('Test Pusher Error:', error);
        return { success: false, message: 'Error saat mencoba koneksi Pusher.' };
    }
}

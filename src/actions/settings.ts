'use server';

import { prisma } from '@/lib/db';
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

'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// --- Generic Settings (Hero Title, Subtitle, Images, etc) ---

export async function getLandingSettings() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    startsWith: 'landing_'
                }
            }
        });

        // Convert list to object for easier use
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
    } catch (error) {
        console.error('Error fetching landing settings:', error);
        return {} as Record<string, string>;
    }
}

export async function updateLandingSetting(key: string, value: string) {
    await prisma.setting.upsert({
        where: { key: `landing_${key}` },
        update: { value },
        create: { key: `landing_${key}`, value }
    });
    revalidatePath('/');
    return { success: true };
}

// --- Activities ---

export async function getLandingActivities() {
    try {
        return await prisma.landingActivity.findMany({
            orderBy: { order: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching landing activities:', error);
        return [];
    }
}

export async function addLandingActivity(title: string, time: string, description?: string, image?: string) {
    const count = await prisma.landingActivity.count();
    await prisma.landingActivity.create({
        data: { title, time, description, image, order: count }
    });
    revalidatePath('/');
    return { success: true };
}

export async function deleteLandingActivity(id: string) {
    await prisma.landingActivity.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
}

// --- Services ---

export async function getLandingServices() {
    try {
        return await prisma.landingService.findMany({
            orderBy: { order: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching landing services:', error);
        return [];
    }
}

export async function addLandingService(icon: string, title: string, description: string) {
    const count = await prisma.landingService.count();
    await prisma.landingService.create({
        data: { icon, title, description, order: count }
    });
    revalidatePath('/');
    return { success: true };
}

export async function deleteLandingService(id: string) {
    await prisma.landingService.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
}

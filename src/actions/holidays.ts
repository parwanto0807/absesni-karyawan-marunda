'use server';

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getHolidays(year?: number) {
    const startDate = year ? new Date(year, 0, 1) : undefined;
    const endDate = year ? new Date(year, 11, 31) : undefined;

    return await prisma.holiday.findMany({
        where: year ? {
            date: {
                gte: startDate,
                lte: endDate
            }
        } : {},
        orderBy: { date: 'asc' }
    });
}

export async function addHoliday(data: { date: Date, name: string, isCutiBersama: boolean }) {
    try {
        const holiday = await prisma.holiday.create({
            data: {
                date: data.date,
                name: data.name,
                isCutiBersama: data.isCutiBersama
            }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/schedules');
        return { success: true, data: holiday };
    } catch (error) {
        console.error("Error adding holiday:", error);
        return { success: false, message: "Gagal menambah hari libur. Tanggal mungkin sudah ada." };
    }
}

export async function deleteHoliday(id: string) {
    try {
        await prisma.holiday.delete({ where: { id } });
        revalidatePath('/admin/settings');
        revalidatePath('/schedules');
        return { success: true };
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return { success: false };
    }
}

export async function syncHolidays(year: number) {
    try {
        // Mocking API call to public holiday API
        // In a real scenario, you would fetch from an API like https://api-harilibur.vercel.app/api?year=2026
        // For now, we use our hardcoded list to seed the DB if empty

        // This is a placeholder for the actual sync logic
        // For this task, I'll just return a message
        return { success: true, message: "Sinkronisasi berhasil (Simulasi)" };
    } catch (error) {
        return { success: false, message: "Gagal sinkronisasi" };
    }
}

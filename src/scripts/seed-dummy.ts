import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Ambil user pertama (yang kemungkinan sedang login)
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("Tidak ada user ditemukan.");
            return;
        }

        const today = new Date();
        // Set jam 08:35 (Telat 35 menit jika shift 08:00)
        today.setHours(8, 35, 0, 0);

        const clockOut = new Date(today);
        // Set jam 16:30 (Pulang Cepat jika shift berakhir 17:00 atau 20:00)
        clockOut.setHours(16, 30, 0, 0);

        await prisma.attendance.create({
            data: {
                userId: user.id,
                date: new Date(),
                clockIn: today,
                clockOut: clockOut,
                status: 'PRESENT',
                isLate: true,
                lateMinutes: 35,
                isEarlyLeave: true,
                earlyLeaveMinutes: 90, // Misal shift sampai 18:00
                address: 'Simulasi Lokasi (Dummy Data)',
                latitude: -6.123,
                longitude: 106.123,
                notes: 'Data Dummy untuk Test Tampilan',
                // Gunakan gambar placeholder atau kosong
                image: 'https://placehold.co/400x400/png?text=Test+Absen'
            }
        });

        console.log(`✅ Berhasil membuat data dummy untuk user: ${user.name}`);
        console.log("Silakan refresh halaman History untuk melihat hasilnya.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

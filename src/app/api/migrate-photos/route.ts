import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST() {
    try {
        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'image', 'attendance');
        await mkdir(uploadDir, { recursive: true });

        // Get all attendances with base64 images
        const attendances = await prisma.attendance.findMany({
            where: {
                OR: [
                    { image: { startsWith: 'data:image' } },
                    { imageOut: { startsWith: 'data:image' } }
                ]
            },
            select: {
                id: true,
                userId: true,
                image: true,
                imageOut: true,
                clockIn: true,
                clockOut: true
            }
        });

        if (attendances.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Tidak ada foto yang perlu di-migrate',
                migrated: 0,
                errors: 0
            });
        }

        let migratedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const attendance of attendances) {
            try {
                const updates: { image?: string; imageOut?: string } = {};

                // Migrate clock in photo
                if (attendance.image && attendance.image.startsWith('data:image')) {
                    const clockInPath = await convertBase64ToWebP(
                        attendance.image,
                        attendance.userId,
                        attendance.clockIn,
                        'in'
                    );
                    if (clockInPath) {
                        updates.image = clockInPath;
                    }
                }

                // Migrate clock out photo
                if (attendance.imageOut && attendance.imageOut.startsWith('data:image')) {
                    const clockOutPath = await convertBase64ToWebP(
                        attendance.imageOut,
                        attendance.userId,
                        attendance.clockOut || attendance.clockIn,
                        'out'
                    );
                    if (clockOutPath) {
                        updates.imageOut = clockOutPath;
                    }
                }

                // Update database if we have any migrations
                if (Object.keys(updates).length > 0) {
                    await prisma.attendance.update({
                        where: { id: attendance.id },
                        data: updates
                    });
                    migratedCount++;
                }
            } catch (error) {
                console.error(`Error migrating attendance ${attendance.id}:`, error);
                errorCount++;
                errors.push(attendance.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil migrate ${migratedCount} foto${errorCount > 0 ? `, ${errorCount} error` : ''}`,
            migrated: migratedCount,
            errors: errorCount,
            errorIds: errors
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menjalankan migrasi' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Count attendances with base64 photos
        const imageCount = await prisma.attendance.count({
            where: { image: { startsWith: 'data:image' } }
        });

        const imageOutCount = await prisma.attendance.count({
            where: { imageOut: { startsWith: 'data:image' } }
        });

        const totalCount = await prisma.attendance.count();

        const migratedImageCount = await prisma.attendance.count({
            where: { image: { startsWith: '/image/attendance' } }
        });

        const migratedImageOutCount = await prisma.attendance.count({
            where: { imageOut: { startsWith: '/image/attendance' } }
        });

        return NextResponse.json({
            success: true,
            total: totalCount,
            base64ClockIn: imageCount,
            base64ClockOut: imageOutCount,
            migratedClockIn: migratedImageCount,
            migratedClockOut: migratedImageOutCount,
            needsMigration: imageCount + imageOutCount
        });
    } catch (error) {
        console.error('Check error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengecek status' },
            { status: 500 }
        );
    }
}

async function convertBase64ToWebP(
    base64Data: string,
    userId: string,
    timestamp: Date,
    type: 'in' | 'out'
): Promise<string | null> {
    try {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        const timestampMs = new Date(timestamp).getTime();
        const filename = `${userId}_${timestampMs}_${type}.webp`;
        const uploadDir = path.join(process.cwd(), 'public', 'image', 'attendance');
        const filepath = path.join(uploadDir, filename);

        let quality = 80;
        let compressedBuffer: Buffer;

        do {
            compressedBuffer = await sharp(buffer)
                .webp({ quality })
                .toBuffer();

            if (compressedBuffer.length > 200 * 1024 && quality > 20) {
                quality -= 10;
            } else {
                break;
            }
        } while (quality > 20);

        await writeFile(filepath, compressedBuffer);
        return `/image/attendance/${filename}`;
    } catch (error) {
        console.error('Error converting base64 to WebP:', error);
        return null;
    }
}

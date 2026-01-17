import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

async function migratePhotos() {
    console.log('🔄 Starting photo migration from base64 to WebP files...\n');

    try {
        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'image', 'attendance');
        await mkdir(uploadDir, { recursive: true });
        console.log('✅ Upload directory ready\n');

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

        console.log(`📊 Found ${attendances.length} attendance records with base64 photos\n`);

        let migratedCount = 0;
        let errorCount = 0;

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
                        console.log(`  ✓ Migrated clock in photo for attendance ${attendance.id}`);
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
                        console.log(`  ✓ Migrated clock out photo for attendance ${attendance.id}`);
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
                console.error(`  ✗ Error migrating attendance ${attendance.id}:`, error);
                errorCount++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`  ✅ Successfully migrated: ${migratedCount} records`);
        console.log(`  ❌ Errors: ${errorCount} records`);
        console.log('\n✨ Migration completed!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function convertBase64ToWebP(
    base64Data: string,
    userId: string,
    timestamp: Date,
    type: 'in' | 'out'
): Promise<string | null> {
    try {
        // Remove base64 prefix
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        // Generate filename using original timestamp
        const timestampMs = new Date(timestamp).getTime();
        const filename = `${userId}_${timestampMs}_${type}.webp`;
        const uploadDir = path.join(process.cwd(), 'public', 'image', 'attendance');
        const filepath = path.join(uploadDir, filename);

        // Compress and convert to WebP
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

        // Save the file
        await writeFile(filepath, compressedBuffer);

        // Return the public path
        return `/image/attendance/${filename}`;
    } catch (error) {
        console.error('Error converting base64 to WebP:', error);
        return null;
    }
}

// Run migration
migratePhotos();

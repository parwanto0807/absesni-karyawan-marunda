import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBase64Photos() {
    console.log('🔍 Checking for base64 photos in database...\n');

    try {
        // Count attendances with base64 in image field
        const imageCount = await prisma.attendance.count({
            where: {
                image: { startsWith: 'data:image' }
            }
        });

        // Count attendances with base64 in imageOut field
        const imageOutCount = await prisma.attendance.count({
            where: {
                imageOut: { startsWith: 'data:image' }
            }
        });

        // Get total attendance count
        const totalCount = await prisma.attendance.count();

        // Count attendances with file paths
        const migratedImageCount = await prisma.attendance.count({
            where: {
                image: { startsWith: '/image/attendance' }
            }
        });

        const migratedImageOutCount = await prisma.attendance.count({
            where: {
                imageOut: { startsWith: '/image/attendance' }
            }
        });

        console.log('📊 Database Photo Status:\n');
        console.log(`  Total Attendance Records: ${totalCount}`);
        console.log(`  ─────────────────────────────────────────`);
        console.log(`  Clock In Photos (base64):  ${imageCount}`);
        console.log(`  Clock In Photos (migrated): ${migratedImageCount}`);
        console.log(`  ─────────────────────────────────────────`);
        console.log(`  Clock Out Photos (base64):  ${imageOutCount}`);
        console.log(`  Clock Out Photos (migrated): ${migratedImageOutCount}`);
        console.log(`  ─────────────────────────────────────────\n`);

        if (imageCount > 0 || imageOutCount > 0) {
            console.log('⚠️  Migration needed!');
            console.log(`   Run: npx tsx scripts/migrate-photos.ts\n`);
        } else {
            console.log('✅ All photos have been migrated to file storage!\n');
        }

    } catch (error) {
        console.error('❌ Error checking photos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBase64Photos();

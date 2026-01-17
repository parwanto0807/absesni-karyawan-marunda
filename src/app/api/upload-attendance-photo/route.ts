import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const { image, userId } = await request.json();

        if (!image || !userId) {
            return NextResponse.json(
                { error: 'Image and userId are required' },
                { status: 400 }
            );
        }

        // Remove base64 prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'image', 'attendance');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${userId}_${timestamp}.webp`;
        const filepath = path.join(uploadDir, filename);

        // Compress and convert to WebP with target size 100-200KB
        let quality = 80;
        let compressedBuffer: Buffer;

        // Try different quality levels to achieve target size
        do {
            compressedBuffer = await sharp(buffer)
                .webp({ quality })
                .toBuffer();

            // If size is too large, reduce quality
            if (compressedBuffer.length > 200 * 1024 && quality > 20) {
                quality -= 10;
            } else {
                break;
            }
        } while (quality > 20);

        // Save the file
        await writeFile(filepath, compressedBuffer);

        // Return the public path (relative to public folder)
        const publicPath = `/image/attendance/${filename}`;

        return NextResponse.json({
            success: true,
            path: publicPath,
            size: compressedBuffer.length
        });
    } catch (error) {
        console.error('Error uploading attendance photo:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
}

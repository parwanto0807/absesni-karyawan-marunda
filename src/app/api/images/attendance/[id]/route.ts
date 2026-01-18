import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'in'; // 'in' or 'out'

    try {
        const attendance = await prisma.attendance.findUnique({
            where: { id },
            select: { image: true, imageOut: true }
        });

        if (!attendance) {
            return new NextResponse(null, { status: 404 });
        }

        const imageField = type === 'out' ? attendance.imageOut : attendance.image;

        if (!imageField) {
            return new NextResponse(null, { status: 404 });
        }

        // Check if image is base64
        if (imageField.startsWith('data:image')) {
            const matches = imageField.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return new NextResponse(null, { status: 400 });
            }

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        }

        // Check if image is a filesystem path
        if (imageField.startsWith('/image/attendance/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', imageField);
                const buffer = await fs.readFile(filePath);

                // Determine content type based on extension
                let contentType = 'image/webp';
                if (imageField.endsWith('.jpg') || imageField.endsWith('.jpeg')) contentType = 'image/jpeg';
                else if (imageField.endsWith('.png')) contentType = 'image/png';

                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
                    console.warn(`Attendance image not found locally: ${imageField}. Serving placeholder.`);
                    try {
                        const placeholderPath = path.join(process.cwd(), 'public', 'no-image.png');
                        const placeholderBuffer = await fs.readFile(placeholderPath);
                        return new NextResponse(placeholderBuffer, {
                            headers: {
                                'Content-Type': 'image/png',
                                'Cache-Control': 'public, max-age=3600',
                            },
                        });
                    } catch {
                        return new NextResponse(null, { status: 404 });
                    }
                }
                console.error(`Error reading image file ${imageField}:`, err);
                return new NextResponse(null, { status: 404 });
            }
        }

        return new NextResponse(null, { status: 400 });

    } catch (error) {
        console.error('Error serving attendance image:', error);
        return new NextResponse(null, { status: 500 });
    }
}

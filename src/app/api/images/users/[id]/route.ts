import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { image: true }
        });

        if (!user || !user.image) {
            return new NextResponse(null, { status: 404 });
        }

        // Check if image is base64
        if (user.image.startsWith('data:image')) {
            const matches = user.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return new NextResponse(null, { status: 400 });
            }

            const type = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': type,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        }

        // If it's a URL (though unlikely based on analysis), redirect to it? 
        // Or just serve it if it's a proxy?
        // For now, assuming base64 as per findings.
        return new NextResponse(null, { status: 400 });

    } catch (error) {
        console.error('Error serving user image:', error);
        return new NextResponse(null, { status: 500 });
    }
}

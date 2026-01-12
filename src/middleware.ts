import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/auth';

// 1. Specify protected and public routes
const protectedRoutes = ['/', '/attendance', '/history', '/employees', '/schedules', '/permits'];
const publicRoutes = ['/login'];

export default async function middleware(req: NextRequest) {
    // 2. Check if the current route is protected or public
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = publicRoutes.includes(path);

    // 3. Decrypt the session from the cookie
    const cookie = req.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 4. Redirect to /login if the user is not authenticated
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 5. Redirect to / if the user is authenticated
    if (isPublicRoute && session) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    // 6. Refresh the session so it doesn't expire (Edge Compatible)
    if (session) {
        const response = NextResponse.next();

        // Extend session by 2 hours
        const newExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const newSessionToken = await encrypt(session);

        response.cookies.set({
            name: 'session',
            value: newSessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: newExpires,
        });

        return response;
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

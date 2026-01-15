import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/auth';

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/attendance', '/history', '/employees', '/schedules', '/permits', '/admin/settings', '/admin/incidents'];
const publicRoutes = ['/login'];
// Note: '/' is public but we might want to redirect authenticated users to /dashboard for better UX

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.includes(path);
    const isLandingPage = path === '/';

    // 2. Decrypt the session from the cookie
    const cookie = req.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie) : null;

    // 3. Redirect to /login if the user is not authenticated and trying to access a protected route
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 4. Redirect to /dashboard if the user is authenticated and trying to access public routes (like login or landing)
    if (session && (isPublicRoute || isLandingPage)) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }

    // 5. Refresh the session if it exists
    if (session) {
        const now = Math.floor(Date.now() / 1000);
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;

        if (now - session.iat > sevenDaysInSeconds) {
            const response = NextResponse.redirect(new URL('/login', req.nextUrl));
            response.cookies.set('session', '', { expires: new Date(0) });
            return response;
        }

        const response = NextResponse.next();
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

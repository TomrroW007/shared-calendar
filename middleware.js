import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'nexus_shared_calendar_default_secret_2026'
);

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    const isLoginPage = pathname === '/login';
    const isPublicApi = pathname === '/api/auth/register' || pathname === '/api/auth/login';

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        // Not authenticated: Allow login and registration, protect other paths
        if (!isLoginPage && !isPublicApi) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    try {
        // Validate JWT token on Edge Runtime
        const { payload } = await jwtVerify(token, JWT_SECRET);

        // If authenticated and visiting login, redirect to home page
        if (isLoginPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Attach user ID header for easy API consumption
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (err) {
        console.warn('Authentication token check failed:', err.message);

        // Clear expired/tampered session cookie and redirect
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));

        response.cookies.delete('auth_token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Run middleware on all paths except for static files, manifest, or logos:
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|logo.png|icon.png).*)',
    ],
};

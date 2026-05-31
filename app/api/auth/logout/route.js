import { NextResponse } from 'next/server';

export async function POST(request) {
    const response = NextResponse.json({ success: true, message: '已退出登录' });
    
    const requestProto = request.headers.get('x-forwarded-proto') || 'http';
    const isSecure = requestProto === 'https';

    // Clear the auth_token cookie by setting it to empty with past expiration
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
    });
    
    return response;
}

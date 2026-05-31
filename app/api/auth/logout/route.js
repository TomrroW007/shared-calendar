import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true, message: '已退出登录' });
    
    // Clear the auth_token cookie by setting it to empty with past expiration
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
    });
    
    return response;
}

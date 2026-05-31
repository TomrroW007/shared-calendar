import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_shared_calendar_default_secret_2026';

export async function POST(request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: '用户名和密码均不能为空' }, { status: 400 });
        }

        const normalizedUsername = username.toLowerCase().trim();

        // Find user by username
        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
            return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
        }

        // Generate session JWT
        const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

        // Safe User Object
        const userObj = {
            id: user._id.toString(),
            username: user.username,
            nickname: user.nickname,
            avatar_color: user.avatar_color,
        };

        const response = NextResponse.json({
            success: true,
            user: userObj
        });

        const requestProto = request.headers.get('x-forwarded-proto') || 'http';
        const isSecure = requestProto === 'https';

        // Set secure HttpOnly cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
    }
}

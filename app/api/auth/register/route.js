import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_shared_calendar_default_secret_2026';

const AVATAR_COLORS = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399',
    '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc',
    '#e879f9', '#f472b6', '#fb7185'
];

export async function POST(request) {
    try {
        await dbConnect();
        const { username, nickname, password } = await request.json();

        if (!username || username.trim().length === 0) {
            return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
        }
        if (!nickname || nickname.trim().length === 0) {
            return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
        }
        if (!password || password.length < 6) {
            return NextResponse.json({ error: '密码长度至少为 6 位' }, { status: 400 });
        }

        const normalizedUsername = username.toLowerCase().trim();

        // Check if username already exists
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) {
            return NextResponse.json({ error: '用户名已被占用，请换一个' }, { status: 400 });
        }

        // Hashing password securely (bcrypt with salt rounds = 10)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

        // Create User (password_hash stored, original password garbage-collected)
        const user = await User.create({
            username: normalizedUsername,
            nickname: nickname.trim(),
            password_hash,
            avatar_color: avatarColor,
        });

        // Generate session JWT
        const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

        // Build Response (explicitly excluding password_hash)
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
        console.error('Registration error:', error);
        return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
    }
}

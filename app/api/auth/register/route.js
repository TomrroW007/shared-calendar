import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import { v4 as uuidv4 } from 'uuid'; // Still using UUID for token? Or generated?
// Mongoose has _id. But app uses `user.id` (string).
// We can map _id to id or continue using uuid for ID?
// To minimize frontend changes, let's keep `id` virtual or map it.
// Actually, standard is to use _id.
// Front-end expect `id`.

const AVATAR_COLORS = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399',
    '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc',
    '#e879f9', '#f472b6', '#fb7185'
];

export async function POST(request) {
    try {
        await dbConnect();
        const { nickname } = await request.json();

        if (!nickname || nickname.trim().length === 0) {
            return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
        }

        // Check duplicates? Or just create new? 
        // JSON version created new user every time.
        // We will do same.

        const token = uuidv4();
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

        // Create User
        const user = await User.create({
            nickname: nickname.trim(),
            avatar_color: avatarColor,
            token: token,
        });

        // The frontend expects `user.id`. Mongoose gives `user._id` (ObjectId).
        // Let's return mapped object.
        const userObj = {
            id: user._id.toString(),
            nickname: user.nickname,
            avatar_color: user.avatar_color,
            token: user.token
        };

        return NextResponse.json({
            user: userObj,
            token: user.token
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }
}

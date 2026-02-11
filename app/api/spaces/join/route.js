import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Space, SpaceMember, User } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const { invite_code } = await request.json();
        if (!invite_code || invite_code.trim().length === 0) {
            return NextResponse.json({ error: '请输入邀请码' }, { status: 400 });
        }

        await dbConnect();

        // Find space by invite code (case insensitive ideally, but strict here for now to match)
        const space = await Space.findOne({ invite_code: invite_code.trim().toUpperCase() });
        if (!space) {
            return NextResponse.json({ error: '邀请码无效' }, { status: 404 });
        }

        // Check existing membership
        const existing = await SpaceMember.findOne({ space_id: space._id, user_id: user._id });
        if (existing) {
            return NextResponse.json({ space: { id: space._id.toString(), name: space.name }, already_member: true });
        }

        // Create membership
        await SpaceMember.create({
            space_id: space._id,
            user_id: user._id,
            role: 'member',
            joined_at: new Date()
        });

        // Notify? (Optional, skipping to match previous behavior of just joining)

        return NextResponse.json({ space: { id: space._id.toString(), name: space.name } });
    } catch (error) {
        console.error('Join space error:', error);
        return NextResponse.json({ error: '加入空间失败' }, { status: 500 });
    }
}

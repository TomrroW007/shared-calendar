import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

export async function GET(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    try {
        await dbConnect();
        // Securely fetch user while excluding password_hash
        const user = await User.findById(userId).select('-password_hash').lean();
        if (!user) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        const responseUser = {
            id: user._id.toString(),
            username: user.username,
            nickname: user.nickname,
            avatar_color: user.avatar_color,
            ics_urls: user.ics_urls || [],
            daily_statuses: user.daily_statuses || {}
        };

        return NextResponse.json({ user: responseUser });
    } catch (error) {
        console.error('Fetch me error:', error);
        return NextResponse.json({ error: '加载用户信息失败' }, { status: 500 });
    }
}

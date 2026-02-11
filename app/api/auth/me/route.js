import { getAuthUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const user = getAuthUser(request);
    if (!user) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.json({ user });
}

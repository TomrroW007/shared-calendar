import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token }).lean();
}

export async function GET(request) {
    const user = await authenticate(request);
    if (!user) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // Format response to match legacy behavior (exclude token if needed, though lean() returns POJO)
    // Legacy getAuthUser removed token.
    const { token, ...userWithoutToken } = user;
    // Map _id to id if frontend expects 'id'
    const responseUser = {
        ...userWithoutToken,
        id: user._id.toString()
    };
    delete responseUser._id;

    return NextResponse.json({ user: responseUser });
}

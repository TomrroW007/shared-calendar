import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Space, SpaceMember, User } from '@/models';

function getUserFromToken(request) {
    // We need to fetch user from DB by token
    // This is async now. But this function is usually sync helper.
    // We'll refactor this helper pattern.
    return null;
}

// Authentication Helper
async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;

    await dbConnect();
    const user = await User.findOne({ token });
    return user;
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: '空间名称必填' }, { status: 400 });
        }

        // Create Space
        const space = await Space.create({
            name,
            created_by: user._id
        });

        // Add creator as member
        await SpaceMember.create({
            space_id: space._id,
            user_id: user._id
        });

        return NextResponse.json({
            space: {
                id: space._id.toString(),
                name: space.name,
                created_by: space.created_by.toString()
            }
        });
    } catch (error) {
        console.error('Create space error:', error);
        return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }
}

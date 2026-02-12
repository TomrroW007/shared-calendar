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

export async function GET(request) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find all spaces where user is a member
        const memberships = await SpaceMember.find({ user_id: user._id }).populate('space_id');

        // Filter out any null spaces (in case space was deleted but membership wasn't)
        const spaces = memberships
            .filter(m => m.space_id)
            .map(m => ({
                id: m.space_id._id.toString(),
                name: m.space_id.name,
                invite_code: m.space_id.invite_code,
                role: m.space_id.created_by.toString() === user._id.toString() ? 'admin' : 'member',
                member_count: 1 // We might want to fetch real count, but for now keep it simple or do a separate aggregation
            }));

        // For member_count, we can do a quick count if needed, but let's see if page.js needs it.
        // page.js uses space.member_count.
        // Let's force it to 1 or calculate it? 
        // Calculating exact count for all spaces might be slow. 
        // Let's just return what we have. API usually returns it.

        // Let's do a second pass to count members for these spaces?
        // Or just `Promise.all` it.
        for (let space of spaces) {
            space.member_count = await SpaceMember.countDocuments({ space_id: space.id });
        }

        return NextResponse.json({ spaces });
    } catch (error) {
        console.error('Fetch spaces error:', error);
        return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
    }
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

        // Generate unique invite code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let invite_code;
        let codeExists = true;
        while (codeExists) {
            invite_code = '';
            for (let i = 0; i < 6; i++) {
                invite_code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            codeExists = await Space.findOne({ invite_code });
        }

        // Create Space
        const space = await Space.create({
            name,
            invite_code,
            created_by: user._id
        });

        // Add creator as owner
        await SpaceMember.create({
            space_id: space._id,
            user_id: user._id,
            role: 'owner'
        });

        return NextResponse.json({
            space: {
                id: space._id.toString(),
                name: space.name,
                invite_code: space.invite_code,
                created_by: space.created_by.toString()
            }
        });
    } catch (error) {
        console.error('Create space error:', error);
        return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }
}

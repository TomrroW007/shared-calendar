import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Space, SpaceMember, User } from '@/models';

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

// Generate a random 6-char invite code
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET /api/spaces — List spaces the current user belongs to
export async function GET(request) {
    try {
        const user = await authenticate(request);
        if (!user) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        await dbConnect();

        // Find all memberships for this user
        const memberships = await SpaceMember.find({ user_id: user._id }).lean();
        const spaceIds = memberships.map(m => m.space_id);

        // Fetch spaces
        const spaces = await Space.find({ _id: { $in: spaceIds } }).lean();

        // Get member counts for each space
        const memberCounts = await SpaceMember.aggregate([
            { $match: { space_id: { $in: spaceIds } } },
            { $group: { _id: '$space_id', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        memberCounts.forEach(mc => { countMap[mc._id.toString()] = mc.count; });

        // Build role map from memberships
        const roleMap = {};
        memberships.forEach(m => { roleMap[m.space_id.toString()] = m.role || 'member'; });

        const result = spaces.map(s => ({
            id: s._id.toString(),
            name: s.name,
            invite_code: s.invite_code,
            member_count: countMap[s._id.toString()] || 0,
            role: roleMap[s._id.toString()] || 'member',
        }));

        return NextResponse.json({ spaces: result });
    } catch (error) {
        console.error('List spaces error:', error);
        return NextResponse.json({ error: '获取空间列表失败' }, { status: 500 });
    }
}

// POST /api/spaces — Create new space
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

        await dbConnect();

        // Generate unique invite code
        let invite_code;
        let attempts = 0;
        while (attempts < 10) {
            invite_code = generateInviteCode();
            const existing = await Space.findOne({ invite_code });
            if (!existing) break;
            attempts++;
        }

        // Create Space
        const space = await Space.create({
            name,
            invite_code,
            created_by: user._id
        });

        // Add creator as admin member
        await SpaceMember.create({
            space_id: space._id,
            user_id: user._id,
            role: 'admin'
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

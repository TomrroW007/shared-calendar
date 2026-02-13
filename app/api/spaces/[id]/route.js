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

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const space = await Space.findById(id);
        if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

        // Check membership
        const membership = await SpaceMember.findOne({ space_id: id, user_id: user._id });
        if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Get members
        const membersRefs = await SpaceMember.find({ space_id: id }).populate('user_id');
        const members = membersRefs.map(m => ({
            id: m.user_id._id.toString(),
            nickname: m.user_id.nickname,
            avatar_color: m.user_id.avatar_color,
            role: m.role,
            daily_statuses: m.user_id.daily_statuses || {}
        }));

        return NextResponse.json({
            space: {
                id: space._id.toString(),
                name: space.name,
                invite_code: space.invite_code,
                memo: space.memo || '',
                created_by: space.created_by.toString()
            },
            members
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching space' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    // Join space
    try {
        const { id } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const space = await Space.findById(id);
        if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

        // Check if already member
        const exists = await SpaceMember.findOne({ space_id: id, user_id: user._id });
        if (exists) {
            return NextResponse.json({ message: 'Already a member' });
        }

        await SpaceMember.create({
            space_id: id,
            user_id: user._id,
            role: 'editor'
        });

        // Notify others? (Optional, kept simple for now)

        return NextResponse.json({ message: 'Joined successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Join failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    // Leave space
    try {
        const { id: spaceId } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Remove membership
        const result = await SpaceMember.deleteOne({ space_id: spaceId, user_id: user._id });
        
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Not a member' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Left space successfully' });
    } catch (error) {
        console.error('Leave space error:', error);
        return NextResponse.json({ error: 'Leave failed' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if user is owner or admin
        const member = await SpaceMember.findOne({ space_id: id, user_id: user._id });
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { name, memo } = await request.json();
        
        const updateData = {};
        if (name) updateData.name = name;
        if (memo !== undefined) updateData.memo = memo;

        const space = await Space.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json({ success: true, space });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

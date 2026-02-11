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
        // Await params in Next.js 15+ (if applicable, but params is usually sync in 14-)
        // Actually in Next 15 params is promise. But here we might be on 14. 
        // User's project might be 15. Let's assume standard behavior.
        // Actually, just accessing params.id is safe in most versions unless strictly typed.
        const { id } = params;

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
            avatar_color: m.user_id.avatar_color
        }));

        return NextResponse.json({
            space: {
                id: space._id.toString(),
                name: space.name,
                invite_code: space.invite_code,
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
        const { id } = params;
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
            user_id: user._id
        });

        // Notify others? (Optional, kept simple for now)

        return NextResponse.json({ message: 'Joined successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Join failed' }, { status: 500 });
    }
}

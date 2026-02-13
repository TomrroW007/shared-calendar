import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SpaceNote, SpaceMember, User } from '@/models';

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
        const { id: spaceId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify membership
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const notes = await SpaceNote.find({ space_id: spaceId })
            .populate('created_by', 'nickname')
            .sort({ updated_at: -1 })
            .lean();

        return NextResponse.json({ notes });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { title, content, noteId } = await request.json();

        if (noteId) {
            // Update existing
            const note = await SpaceNote.findOneAndUpdate(
                { _id: noteId, space_id: spaceId },
                { title, content, updated_at: new Date() },
                { new: true }
            );
            return NextResponse.json({ success: true, note });
        } else {
            // Create new
            const note = await SpaceNote.create({
                space_id: spaceId,
                created_by: user._id,
                title,
                content
            });
            return NextResponse.json({ success: true, note });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Post failed' }, { status: 500 });
    }
}

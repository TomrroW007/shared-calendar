import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { Event, User, Notification, SpaceMember } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';

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
        const { eventId } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const event = await Event.findById(eventId).populate('user_id', 'nickname avatar_color').lean();
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const userIds = event.participants?.map(p => p.userId) || [];
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const enrichedDetails = event.participants?.map(p => ({
            id: p.userId,
            status: p.status,
            comment: p.comment,
            nickname: userMap[p.userId]?.nickname || 'Unknown',
            avatar_color: userMap[p.userId]?.avatar_color || '#ccc'
        })) || [];

        const result = {
            id: event._id.toString(),
            user_id: event.user_id._id.toString(),
            nickname: event.user_id.nickname,
            avatar_color: event.user_id.avatar_color,
            start_date: event.start_date,
            end_date: event.end_date,
            status: event.status,
            note: event.note,
            visibility: event.visibility,
            participants: event.participants?.map(p => p.userId) || [],
            participant_details: enrichedDetails
        };

        return NextResponse.json({ event: result });
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { eventId } = await params;
        await dbConnect();
        const user = await authenticate(request);
        const event = await Event.findById(eventId);

        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (event.user_id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        event.start_date = body.start_date || event.start_date;
        event.end_date = body.end_date || event.end_date;
        event.status = body.status || event.status;
        event.note = body.note !== undefined ? body.note : event.note;
        event.visibility = body.visibility || event.visibility;

        if (body.participants) {
            const existingMap = {};
            event.participants.forEach(p => existingMap[p.userId] = p);

            const newParticipants = body.participants.map(uid => {
                if (existingMap[uid]) return existingMap[uid];
                return { userId: uid, status: 'pending', comment: '' };
            });
            event.participants = newParticipants;
        }

        await event.save();

        await pushToSpaceMembers(event.space_id, 'event_updated', {
            eventId: eventId,
        }, user._id.toString());

        return NextResponse.json({ success: true, event });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { eventId } = await params;
        await dbConnect();
        const user = await authenticate(request);

        const event = await Event.findById(eventId);
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (event.user_id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Event.deleteOne({ _id: eventId });
        await Notification.deleteMany({ related_id: eventId });

        await pushToSpaceMembers(event.space_id, 'event_deleted', {
            eventId: eventId,
        }, user._id.toString());

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

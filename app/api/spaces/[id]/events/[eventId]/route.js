import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User, Notification, SpaceMember } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function GET(request, { params }) {
    // Get single event details
    try {
        const { eventId } = params;

        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const event = await Event.findById(eventId).populate('user_id', 'nickname avatar_color').lean();
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Get Participants details
        const userIds = event.participants?.map(p => p.userId) || [];
        const users = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const enrichedDetails = event.participants?.map(p => ({
            id: p.userId, // userId in DB is string (ObjectId string)
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
    // Update Event
    try {
        const { eventId } = params;
        await dbConnect();
        const user = await authenticate(request);
        const event = await Event.findById(eventId);

        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (event.user_id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        // Update fields
        event.start_date = body.start_date || event.start_date;
        event.end_date = body.end_date || event.end_date;
        event.status = body.status || event.status;
        event.note = body.note !== undefined ? body.note : event.note;
        event.visibility = body.visibility || event.visibility;

        // Sync participants? Re-invite logic is complex. For now assume minimal update.
        // If body.participants provided, update list.
        if (body.participants) {
            // Logic to merge or replace? 
            // Replacing logic:
            // But preserving status?
            // "Advanced sync": Keep existing statuses, add new ones as pending, remove missing.
            const existingMap = {};
            event.participants.forEach(p => existingMap[p.userId] = p);

            const newParticipants = body.participants.map(uid => {
                if (existingMap[uid]) return existingMap[uid]; // Keep status
                return { userId: uid, status: 'pending', comment: '' };
            });
            event.participants = newParticipants;
        }

        await event.save();
        return NextResponse.json({ success: true, event });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { eventId } = params;
        await dbConnect();
        const user = await authenticate(request);

        const event = await Event.findById(eventId);
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (event.user_id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Event.deleteOne({ _id: eventId });
        await Notification.deleteMany({ related_id: eventId }); // Cleanup notifications

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

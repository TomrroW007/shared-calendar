import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User, Notification } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

import { pushToUser } from '@/lib/sse';

export async function POST(request, { params }) {
    try {
        const { eventId } = params; // params.eventId matches folder
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { status, comment } = await request.json();

        const event = await Event.findById(eventId);
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Find participant in subdoc array
        const pIndex = event.participants.findIndex(p => p.userId === user._id.toString());

        if (pIndex === -1) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        // Update
        event.participants[pIndex].status = status;
        event.participants[pIndex].comment = comment || '';
        event.participants[pIndex].updatedAt = new Date();

        await event.save();

        // Notify Creator
        if (event.user_id.toString() !== user._id.toString()) {
            const notification = await Notification.create({
                user_id: event.user_id,
                space_id: event.space_id,
                type: 'rsvp',
                title: '📝 活动反馈',
                body: `${user.nickname} 反馈了你的活动: ${status}`,
                from_user_id: user._id,
                related_id: event._id.toString()
            });
            // Push notification via SSE
            pushToUser(event.user_id.toString(), 'notification', {
                id: notification._id,
                title: notification.title,
                body: notification.body,
                type: notification.type,
                created_at: notification.created_at,
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'RSVP failed' }, { status: 500 });
    }
}

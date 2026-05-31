import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { Event, User, Notification } from '@/models';
import { pushToUser } from '@/lib/sse';

async function authenticate(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    await dbConnect();
    return User.findById(userId);
}

export async function POST(request, { params }) {
    try {
        const { eventId } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { status, comment } = await request.json();

        const event = await Event.findById(eventId);
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        const pIndex = event.participants.findIndex(p => p.userId === user._id.toString());

        if (pIndex === -1) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        event.participants[pIndex].status = status;
        event.participants[pIndex].comment = comment || '';
        event.participants[pIndex].updatedAt = new Date();

        await event.save();

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

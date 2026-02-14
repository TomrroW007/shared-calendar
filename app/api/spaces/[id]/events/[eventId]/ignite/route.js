import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User, SpaceMember, Notification } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';
import { sendPushToSpaceMembers } from '@/lib/push';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId, eventId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify membership
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const event = await Event.findById(eventId);
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        if (event.type !== 'spark') {
            return NextResponse.json({ error: 'Only Sparks can be ignited' }, { status: 400 });
        }

        // 1. Ignite: Convert spark to event
        event.type = 'event';
        event.status = 'busy'; // Default to busy when ignited
        if (!event.participants.some(p => p.userId === user._id.toString())) {
            event.participants.push({
                userId: user._id.toString(),
                status: 'accepted',
                updatedAt: new Date()
            });
        }
        
        await event.save();

        // 2. Notify space members
        await pushToSpaceMembers(spaceId, 'event_updated', {
            eventId: event._id.toString(),
            event: event,
            title: `🔥 Spark Ignited: ${event.title || 'Event'}`,
            ignited_by: user.nickname
        });

        await sendPushToSpaceMembers(spaceId, {
            title: '🔥 Spark Ignited!',
            body: `${user.nickname} ignited the spark: ${event.title || 'Event'}`,
            url: `/space/${spaceId}/event/${event._id}`
        }, user._id.toString());

        return NextResponse.json({ success: true, event });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Ignition failed' }, { status: 500 });
    }
}

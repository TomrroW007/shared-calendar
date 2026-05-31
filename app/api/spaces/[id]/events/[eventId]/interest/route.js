import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User, SpaceMember } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';

async function authenticate(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    await dbConnect();
    return User.findById(userId);
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

        if (event.status !== 'ghost') {
            return NextResponse.json({ error: 'Only ghost events allow interest toggle' }, { status: 400 });
        }

        const userId = user._id;
        const isInterested = event.interested_users.includes(userId);

        if (isInterested) {
            event.interested_users.pull(userId);
        } else {
            event.interested_users.addToSet(userId);
        }

        await event.save();

        // Push update
        await pushToSpaceMembers(spaceId, 'event_updated', {
            event: {
                id: event._id.toString(),
                interested_users: event.interested_users.map(id => id.toString()),
                // We might need to send full event update if frontend replaces object
            }
        }, user._id.toString());

        return NextResponse.json({ 
            success: true, 
            interested: !isInterested,
            count: event.interested_users.length 
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}

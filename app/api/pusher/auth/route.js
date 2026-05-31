import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { SpaceMember } from '@/models';
import pusher from '@/lib/pusher';

export async function POST(request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Pusher client sends socket_id and channel_name as urlencoded or JSON
        let socketId, channelName;
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            socketId = formData.get('socket_id');
            channelName = formData.get('channel_name');
        } else {
            const body = await request.json();
            socketId = body.socket_id;
            channelName = body.channel_name;
        }

        if (!socketId || !channelName) {
            return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
        }

        await dbConnect();

        // 1. Authorize User Channel (private-user-${userId})
        if (channelName.startsWith('private-user-')) {
            const channelUserId = channelName.replace('private-user-', '');
            if (channelUserId !== userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            const authResponse = pusher.authorizeChannel(socketId, channelName);
            return NextResponse.json(authResponse);
        }

        // 2. Authorize Space Channel (private-space-${spaceId})
        if (channelName.startsWith('private-space-')) {
            const spaceId = channelName.replace('private-space-', '');
            const isMember = await SpaceMember.findOne({ space_id: spaceId, user_id: userId });
            if (!isMember) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            const authResponse = pusher.authorizeChannel(socketId, channelName);
            return NextResponse.json(authResponse);
        }

        return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    } catch (err) {
        console.error('Pusher auth error:', err);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}

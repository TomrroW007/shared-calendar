import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, SpaceMember, User, Notification, Space } from '@/models';
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
        const { id: spaceId } = await params;
        const url = new URL(request.url);
        const monthStr = url.searchParams.get('month'); // YYYY-MM

        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify membership
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        let query = { space_id: spaceId };
        if (monthStr) {
            query.$or = [
                { start_date: { $regex: `^${monthStr}` } },
                { end_date: { $regex: `^${monthStr}` } },
                // Spanning events: start < month and end > month
                { start_date: { $lt: `${monthStr}-01` }, end_date: { $gt: `${monthStr}-31` } }
            ];
        }

        const events = await Event.find(query).populate('user_id', 'nickname avatar_color').lean();

        // Collect all unique participant userIds for batch lookup
        const userIds = new Set();
        events.forEach(e => {
            e.participants?.forEach(p => userIds.add(p.userId));
        });
        const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const enrichedEvents = events.map(e => {
            const isMine = e.user_id._id.toString() === user._id.toString();
            const isPrivate = e.visibility === 'private' && !isMine;
            const isStatusOnly = e.visibility === 'status_only' && !isMine;

            return {
                id: e._id.toString(),
                user_id: e.user_id._id.toString(),
                nickname: e.user_id.nickname,
                avatar_color: e.user_id.avatar_color,
                start_date: e.start_date,
                end_date: e.end_date,
                status: e.status,
                visibility: e.visibility,
                note: (isPrivate || isStatusOnly) ? (isStatusOnly ? 'Busy' : 'Private') : e.note,
                participants: e.participants?.map(p => p.userId) || [],
                participant_details: e.participants?.map(p => ({
                    id: p.userId,
                    status: p.status,
                    comment: p.comment,
                    nickname: userMap[p.userId]?.nickname || 'Unknown',
                    avatar_color: userMap[p.userId]?.avatar_color || '#ccc'
                })) || []
            };
        });

        return NextResponse.json({ events: enrichedEvents });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const event = await Event.create({
            space_id: spaceId,
            user_id: user._id,
            start_date: body.start_date,
            end_date: body.end_date,
            status: body.status,
            note: body.note,
            visibility: body.visibility,
            participants: body.participants?.map(uid => ({
                userId: uid,
                status: uid === user._id.toString() ? 'accepted' : 'pending'
            })) || []
        });

        // Notifications for invited participants
        if (body.participants && body.participants.length > 0) {
            const notifications = body.participants
                .filter(uid => uid !== user._id.toString())
                .map(uid => ({
                    user_id: uid,
                    space_id: spaceId,
                    type: 'invitation',
                    title: '📅 新活动邀请',
                    body: `${user.nickname} 邀请你参加活动: ${body.note || '无主题'}`,
                    from_user_id: user._id,
                    related_id: event._id.toString()
                }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        // SSE: Push event_created to all space members (except creator)
        await pushToSpaceMembers(spaceId, 'event_created', {
            eventId: event._id.toString(),
            userId: user._id.toString(),
            nickname: user.nickname,
        }, user._id.toString());

        return NextResponse.json({ success: true, event: { id: event._id.toString() } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import { Event, SpaceMember, User, Notification, Space } from '@/models';
import { pushToSpaceMembers, pushToUser } from '@/lib/sse';
import { sendPushToSpaceMembers, sendPushNotification } from '@/lib/push';
import { fetchAndParseICS } from '@/lib/ics';

function serializeEvent(eventDoc, user) {
    return {
        id: eventDoc._id.toString(),
        user_id: user._id.toString(),
        nickname: user.nickname,
        avatar_color: user.avatar_color,
        start_date: eventDoc.start_date,
        end_date: eventDoc.end_date,
        status: eventDoc.status,
        note: eventDoc.note,
        location: eventDoc.location, // Added
        visibility: eventDoc.visibility,
        participants: eventDoc.participants?.map((p) => p.userId?.toString() || p.userId) || [],
        participant_details: [],
        source: 'internal'
    };
}

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
                { start_date: { $lt: `${monthStr}-01` }, end_date: { $gt: `${monthStr}-31` } }
            ];
        }

        const events = await Event.find(query).populate('user_id', 'nickname avatar_color').lean();

        // Enrich with participant details
        const userIds = new Set();
        events.forEach(e => {
            e.participants?.forEach(p => userIds.add(p.userId));
        });
        const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const space = await Space.findById(spaceId);
        const spacePrivacy = space?.settings?.default_privacy || 'busy_only'; // Default to strict if missing
        const canViewDetails = ['owner', 'admin'].includes(member.role);

        // Fetch External ICS Events
        const externalEventsPromises = (member.role === 'guest') ? [] :
            (user.ics_urls || []).map(async (entry) => {
                try {
                    const evs = await fetchAndParseICS(entry.url);
                    // Add color/name to events?
                    return evs.map(e => ({ ...e, color: entry.color, sourceName: entry.name }));
                } catch (e) {
                    console.error('ICS fetch error', e);
                    return [];
                }
            });

        const externalResults = await Promise.all(externalEventsPromises);
        const externalEvents = externalResults.flat();

        // Merge DB events and External events
        const allEvents = [...events, ...externalEvents];

        const enrichedEvents = allEvents.map(e => {
            const uId = e.user_id && e.user_id._id ? e.user_id._id.toString() : (e.user_id ? e.user_id.toString() : 'external');
            const isMine = uId === user._id.toString();

            let hideDetails = false;
            if (e.source === 'external') {
                hideDetails = true; // Always busy only for external? Or depends? Assume busy only for MVP.
            } else {
                if (e.visibility === 'private' && !isMine) {
                    hideDetails = true;
                } else if (spacePrivacy === 'busy_only' && !isMine && !canViewDetails) {
                    hideDetails = true;
                }
            }

            const effectiveVisibility = (e.visibility === 'status_only' || hideDetails) ? 'status_only' : (e.visibility || 'public');

            let note = e.note;
            if (effectiveVisibility === 'status_only') {
                note = (e.status === 'available' ? 'Available' : 'Busy');
            } else if (effectiveVisibility === 'private') {
                note = 'Private';
            }

            let result = {
                id: e._id ? e._id.toString() : `ext-${e.original_data ? e.original_data.uid : Math.random()}`,
                user_id: uId,
                nickname: e.nickname || e.user_id?.nickname,
                avatar_color: e.avatar_color || e.user_id?.avatar_color,
                start_date: e.start_date,
                end_date: e.end_date,
                status: e.status || 'busy',
                visibility: effectiveVisibility,
                note: note,
                participants: e.participants?.map(p => p.userId) || [],
                participant_details: e.participants?.map(p => ({
                    id: p.userId,
                    status: p.status,
                    comment: p.comment,
                    nickname: userMap[p.userId]?.nickname || 'Unknown',
                    avatar_color: userMap[p.userId]?.avatar_color || '#ccc'
                })) || [],
                source: e.source || 'internal',
                color: e.color // implementation specific
            };
            return result;
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

        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (['viewer', 'guest'].includes(member.role)) {
            return NextResponse.json({ error: 'Permission denied: Viewers cannot create events' }, { status: 403 });
        }

        const body = await request.json();

        // Conflict Detection: Check if user is already busy/vacation during this period
        if (body.status === 'busy' || body.status === 'vacation') {
            const conflict = await Event.findOne({
                space_id: spaceId,
                user_id: user._id,
                status: { $in: ['busy', 'vacation'] },
                $or: [
                    { start_date: { $lte: body.end_date }, end_date: { $gte: body.start_date } }
                ]
            });
            if (conflict) {
                return NextResponse.json({ 
                    error: '时间冲突', 
                    details: `你在 ${conflict.start_date} 至 ${conflict.end_date} 期间已有状态：${conflict.status}` 
                }, { status: 409 });
            }
        }

        const event = await Event.create({
            space_id: spaceId,
            user_id: user._id,
            start_date: body.start_date,
            end_date: body.end_date,
            start_at: body.start_at ? new Date(body.start_at) : null,
            end_at: body.end_at ? new Date(body.end_at) : null,
            is_all_day: body.is_all_day !== false,
            status: body.status,
            note: body.note,
            location: body.location,
            visibility: body.visibility,
            recurrence_rule: body.recurrence_rule,
            timezone: body.timezone || 'UTC',
            participants: body.participants?.map(uid => ({
                userId: uid,
                status: uid === user._id.toString() ? 'accepted' : 'pending'
            })) || []
        });

        const serializedEvent = serializeEvent(event, user);

        // Notifications
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
                const inserted = await Notification.insertMany(notifications);
                // Push notification via SSE to each participant
                inserted.forEach(n => {
                    pushToUser(n.user_id.toString(), 'notification', {
                        id: n._id,
                        title: n.title,
                        body: n.body,
                        type: n.type,
                        created_at: n.created_at,
                    });
                    // WebPush
                    sendPushNotification(n.user_id.toString(), {
                        title: n.title,
                        body: n.body,
                        url: `/space/${spaceId}/event/${event._id}`
                    });
                });
            }
        }

        // Push event_created to all space members (except creator)
        await pushToSpaceMembers(spaceId, 'event_created', {
            eventId: event._id.toString(),
            event: serializedEvent,
            title: event.note || 'New Event',
            created_by: user.nickname
        }, user._id.toString());

        // WebPush for General Event Creation
        await sendPushToSpaceMembers(spaceId, {
            title: '📅 New Event',
            body: `${user.nickname} created: ${event.note || 'Untitled'}`,
            url: `/space/${spaceId}/event/${event._id}`
        }, user._id.toString());

        return NextResponse.json({ success: true, event: serializedEvent });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

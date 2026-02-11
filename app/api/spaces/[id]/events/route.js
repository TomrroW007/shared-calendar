import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, SpaceMember, User, Notification, Space } from '@/models';
import { pushToSpaceMembers, pushToUser } from '@/lib/sse';

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
        const { id: spaceId } = params;
        const url = new URL(request.url);
        const monthStr = url.searchParams.get('month'); // YYYY-MM

        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify membership
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        let query = { space_id: spaceId };
        if (monthStr) {
            // Filter by month
            // start_date, end_date are Strings YYYY-MM-DD
            // e.g. month=2026-02
            // We want events where range overlaps with month
            const startOfMonth = `${monthStr}-01`;
            // simplistic filter: start_date starts with month OR end_date starts with ...
            // or just fetch all and filter in memory if volume low? 
            // Better: Regex or $gte/$lte on strings (works for ISO format)

            // Actually, simplest is regex on start_date for now, or just return all and let frontend filter?
            // Let's rely on standard string comparison.
            // Events starting in this month OR ending in this month OR spanning across.
            // Event start <= MonthEnd AND Event end >= MonthStart
            const nextMonthDate = new Date(monthStr + '-01');
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            const endOfMonth = nextMonthDate.toISOString().slice(0, 10); // Approximation logic, but string comparison is easiest

            // Optimized: find by space_id first, filter later? Or regex.
            // Let's use Regex to find anything containing the month string in start or end
            // query.$or = [
            //    { start_date: { $regex: `^${monthStr}` } },
            //    { end_date: { $regex: `^${monthStr}` } }
            // ];
            // This misses events that span efficiently.
            // Let's just fetch all space events for MVP logic? No, too heavy.
            // Let's use string comparison.
            query.$or = [
                { start_date: { $regex: `^${monthStr}` } },
                { end_date: { $regex: `^${monthStr}` } },
                // Spanning events: start < month and end > month
                { start_date: { $lt: `${monthStr}-01` }, end_date: { $gt: `${monthStr}-31` } }
            ];
        }

        const events = await Event.find(query).populate('user_id', 'nickname avatar_color').lean();

        // Enrich with participant details
        // We need to fetch participant users manually or via populate if structure changed.
        // Participants is array of { userId: String, ... }
        // We need to resolve userId (which is likely ObjectId string) to User details.

        // Let's fetch all relevant users cache?
        // Or for each event, populate?
        // Mongoose doesn't populate nested array of objects easily if userId is bare string/ObjectId.

        // Strategy: Collect all unique participant userIds
        const userIds = new Set();
        events.forEach(e => {
            e.participants?.forEach(p => userIds.add(p.userId));
        });
        const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u._id.toString()] = u);

        const enrichedEvents = events.map(e => {
            // Basic visibility filter logic (same as before)
            // If private and not mine, hide details
            const isMine = e.user_id._id.toString() === user._id.toString();
            const isPrivate = e.visibility === 'private' && !isMine;
            const isStatusOnly = e.visibility === 'status_only' && !isMine;

            let result = {
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
        const { id: spaceId } = params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        // Validation...

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
                status: 'pending' // Default
            })) || []
        });

        // Notifications
        if (body.participants && body.participants.length > 0) {
            const space = await Space.findById(spaceId);
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
                });
            }
        }

        // Push event_created to all space members (except creator)
        await pushToSpaceMembers(spaceId, 'event_created', {
            eventId: event._id.toString(),
        }, user._id.toString());

        return NextResponse.json({ success: true, event: { id: event._id.toString() } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, SpaceMember, User } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function GET(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // 1. Find all spaces user is in
        const memberships = await SpaceMember.find({ user_id: user._id });
        const spaceIds = memberships.map(m => m.space_id);

        // 2. Fetch events from these spaces for today and tomorrow
        const events = await Event.find({
            space_id: { $in: spaceIds },
            $or: [
                { start_date: { $lte: todayStr }, end_date: { $gte: todayStr } },
                { start_date: { $lte: tomorrowStr }, end_date: { $gte: tomorrowStr } }
            ]
        }).populate('space_id', 'name settings').populate('user_id', 'nickname avatar_color').lean();

        const result = events.map(e => {
            const isMine = e.user_id?._id.toString() === user._id.toString();
            const spacePrivacy = e.space_id?.settings?.default_privacy || 'busy_only';
            
            let hideDetails = false;
            if (e.visibility === 'private' && !isMine) {
                hideDetails = true;
            } else if (spacePrivacy === 'busy_only' && !isMine) {
                hideDetails = true;
            }

            const effectiveNote = (hideDetails || e.visibility === 'status_only') 
                ? (e.status === 'available' ? 'Available' : 'Busy') 
                : e.note;

            return {
                id: e._id.toString(),
                space_name: e.space_id?.name || 'Unknown Space',
                space_id: e.space_id?._id.toString(),
                nickname: e.user_id?.nickname,
                avatar_color: e.user_id?.avatar_color,
                note: effectiveNote,
                status: e.status,
                is_all_day: e.is_all_day,
                start_date: e.start_date,
                start_at: e.start_at,
                title: e.title
            };
        });

        return NextResponse.json({ events: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch today events' }, { status: 500 });
    }
}

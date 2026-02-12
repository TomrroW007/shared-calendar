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

        // 1. Find all spaces user is in
        const memberships = await SpaceMember.find({ user_id: user._id });
        const spaceIds = memberships.map(m => m.space_id);

        // 2. Fetch events from these spaces for today
        const events = await Event.find({
            space_id: { $in: spaceIds },
            start_date: { $lte: todayStr },
            end_date: { $gte: todayStr }
        }).populate('space_id', 'name').populate('user_id', 'nickname avatar_color').lean();

        const result = events.map(e => ({
            id: e._id.toString(),
            space_name: e.space_id?.name || 'Unknown Space',
            space_id: e.space_id?._id.toString(),
            nickname: e.user_id?.nickname,
            avatar_color: e.user_id?.avatar_color,
            note: e.note,
            status: e.status,
            is_all_day: e.is_all_day
        }));

        return NextResponse.json({ events: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch today events' }, { status: 500 });
    }
}

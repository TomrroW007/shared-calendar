import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, User } from '@/models';

export async function GET(request, { params }) {
    try {
        const { username } = await params;
        await dbConnect();

        // 1. Find user by nickname (username)
        // Note: Currently nickname is not unique, but for this feature we assume 
        // using _id or a unique handle is better. For now, use nickname.
        const targetUser = await User.findOne({ nickname: username }).lean();
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 2. Fetch all 'busy' or 'vacation' events for this user across all spaces
        // We only return date and status to preserve privacy
        const events = await Event.find({
            user_id: targetUser._id,
            status: { $in: ['busy', 'vacation'] }
        }).select('start_date end_date status').lean();

        return NextResponse.json({
            user: {
                nickname: targetUser.nickname,
                avatar_color: targetUser.avatar_color
            },
            availability: events.map(e => ({
                start: e.start_date,
                end: e.end_date,
                status: 'busy' // Mask all as busy for public view
            }))
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

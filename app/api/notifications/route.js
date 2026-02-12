import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Notification } from '@/models';

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

        // Count unread
        const unreadCount = await Notification.countDocuments({ user_id: user._id, read: false });

        // Fetch notifications with populated from_user
        const populated = await Notification.find({ user_id: user._id })
            .sort({ created_at: -1 })
            .limit(50)
            .populate('from_user_id', 'nickname avatar_color')
            .lean();

        const result = populated.map(n => ({
            id: n._id.toString(),
            type: n.type,
            title: n.title,
            body: n.body,
            read: n.read,
            created_at: n.created_at,
            related_id: n.related_id,
            from_nickname: n.from_user_id?.nickname,
            from_avatar_color: n.from_user_id?.avatar_color,
            action_needed: n.type === 'invitation' || n.type === 'proposal_vote' // logic?
        }));

        return NextResponse.json({
            notifications: result,
            unread_count: unreadCount
        });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function PUT(request) {
    // Mark as read
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        // body.ids = ['id1', 'id2'] or 'all'

        if (body.ids === 'all') {
            await Notification.updateMany(
                { user_id: user._id, read: false },
                { $set: { read: true } }
            );
        } else if (Array.isArray(body.ids)) {
            await Notification.updateMany(
                { _id: { $in: body.ids }, user_id: user._id },
                { $set: { read: true } }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

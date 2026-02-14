import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Memory, User } from '@/models';

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

        // Fetch memories where the user was a participant
        const memories = await Memory.find({
            users: user._id
        })
        .populate('event_id', 'title start_date start_at')
        .sort({ created_at: -1 })
        .lean();

        return NextResponse.json({ success: true, memories });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
    }
}

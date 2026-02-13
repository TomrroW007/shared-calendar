import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { date, emoji, text } = await request.json();
        if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

        // Update map field
        if (!user.daily_statuses) user.daily_statuses = new Map();
        
        if (!emoji && !text) {
            user.daily_statuses.delete(date);
        } else {
            user.daily_statuses.set(date, { emoji, text, updated_at: new Date() });
        }

        await user.save();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

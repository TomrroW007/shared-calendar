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

export async function GET(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        return NextResponse.json({ calendars: user.ics_urls || [] });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        if (!body.url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

        user.ics_urls.push({
            url: body.url,
            name: body.name || 'External Calendar',
            color: body.color || '#333',
            last_synced: new Date()
        });

        await user.save();
        return NextResponse.json({ success: true, calendars: user.ics_urls });

    } catch (error) {
        return NextResponse.json({ error: 'Add failed' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        user.ics_urls = user.ics_urls.filter(c => c._id.toString() !== id);
        await user.save();

        return NextResponse.json({ success: true, calendars: user.ics_urls });

    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

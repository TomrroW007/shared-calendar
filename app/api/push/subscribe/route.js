import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

async function authenticate(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    await dbConnect();
    return User.findById(userId);
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const subscription = await request.json();
        // Validation: endpoint required
        if (!subscription.endpoint) {
            return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
        }

        // Add to user if not exists
        const exists = user.push_subscriptions.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.push_subscriptions.push(subscription);
            await user.save();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscribe failed:', error);
        return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 });
    }
}

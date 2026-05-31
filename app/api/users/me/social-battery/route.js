import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, SpaceMember } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';

export async function POST(request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { social_battery } = await request.json();
        if (!['low', 'open', 'hype'].includes(social_battery)) {
            return NextResponse.json({ error: 'Invalid social battery value' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findByIdAndUpdate(
            userId,
            { social_battery },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find all spaces this user belongs to, and notify them of the vibe update
        const memberships = await SpaceMember.find({ user_id: userId });
        for (const membership of memberships) {
            const spaceId = membership.space_id.toString();
            await pushToSpaceMembers(spaceId, 'vibe_updated', {
                user_id: userId,
                social_battery
            });
        }

        return NextResponse.json({
            success: true,
            social_battery: user.social_battery
        });
    } catch (error) {
        console.error('Update social battery error:', error);
        return NextResponse.json({ error: 'Failed to update social battery' }, { status: 500 });
    }
}

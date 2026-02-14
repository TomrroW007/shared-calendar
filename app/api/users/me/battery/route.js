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

        const { level, status, vibe } = await request.json();
        
        if (level !== undefined) user.social_battery.level = level;
        if (status !== undefined) user.social_battery.status = status;
        if (vibe !== undefined) {
            user.current_vibe.status = vibe;
            user.current_vibe.updated_at = new Date();
        }
        user.social_battery.last_updated = new Date();

        await user.save();
        return NextResponse.json({ 
            success: true, 
            battery: user.social_battery,
            vibe: user.current_vibe
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

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

export async function GET(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get all members of the space
        const members = await SpaceMember.find({ space_id: spaceId }).select('user_id');
        const memberIds = members.map(m => m.user_id.toString());

        // 2. Define search range: next 7 days
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }

        // 3. Fetch all busy events for these members in this range
        const events = await Event.find({
            space_id: spaceId,
            user_id: { $in: memberIds },
            status: { $in: ['busy', 'vacation'] },
            $or: [
                { start_date: { $in: dates } },
                { end_date: { $in: dates } },
                { start_date: { $lte: dates[0] }, end_date: { $gte: dates[6] } }
            ]
        }).lean();

        // 4. Calculate free count per date
        const recommendations = dates.map(date => {
            const busyUserIds = new Set(
                events.filter(e => e.start_date <= date && e.end_date >= date)
                      .map(e => e.user_id.toString())
            );
            const freeCount = memberIds.length - busyUserIds.size;
            return {
                date,
                freeCount,
                totalCount: memberIds.length,
                ratio: freeCount / memberIds.length
            };
        });

        // 5. Sort by freeRatio descending and return Top 3
        const top3 = recommendations
            .sort((a, b) => b.ratio - a.ratio || a.date.localeCompare(b.date))
            .slice(0, 3);

        return NextResponse.json({ recommendations: top3 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
    }
}

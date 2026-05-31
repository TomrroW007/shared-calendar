import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Event, SpaceMember, User } from '@/models';

export async function GET(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const userId = request.headers.get('x-user-id');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // Verify requester is a member of the space
        const isMember = await SpaceMember.findOne({ space_id: spaceId, user_id: userId });
        if (!isMember) {
            return NextResponse.json({ error: 'Forbidden: You must be a member of this space' }, { status: 403 });
        }

        // 1. Get all members of the space (with user info populated to get social_battery)
        const members = await SpaceMember.find({ space_id: spaceId }).populate('user_id');
        const users = members.map(m => m.user_id).filter(Boolean);
        const memberIds = users.map(u => u._id.toString());

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

        // 4. Calculate free count and energyScore per date
        const recommendations = dates.map(date => {
            const busyUserIds = new Set(
                events.filter(e => e.start_date <= date && e.end_date >= date)
                      .map(e => e.user_id.toString())
            );
            
            let energyScore = 0;
            const hypeMembers = [];
            const openMembers = [];
            const lowMembers = [];

            for (const user of users) {
                const uid = user._id.toString();
                if (!busyUserIds.has(uid)) {
                    const battery = user.social_battery || 'open';
                    if (battery === 'hype') {
                        energyScore += 1.5;
                        hypeMembers.push(user.nickname);
                    } else if (battery === 'low') {
                        energyScore += 0.5;
                        lowMembers.push(user.nickname);
                    } else {
                        energyScore += 1.0;
                        openMembers.push(user.nickname);
                    }
                }
            }

            const freeCount = users.length - busyUserIds.size;
            return {
                date,
                freeCount,
                totalCount: users.length,
                energyScore,
                ratio: energyScore / (users.length || 1),
                hypeMembers,
                openMembers,
                lowMembers
            };
        });

        // 5. Sort by energy score ratio descending and return Top 3
        const top3 = recommendations
            .sort((a, b) => b.ratio - a.ratio || a.date.localeCompare(b.date))
            .slice(0, 3);

        return NextResponse.json({ recommendations: top3 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
    }
}

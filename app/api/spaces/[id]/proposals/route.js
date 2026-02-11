import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Notification } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

import { pushToUser } from '@/lib/sse';

export async function GET(request, { params }) {
    try {
        const { id: spaceId } = params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check member
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const proposals = await Proposal.find({ space_id: spaceId })
            .sort({ created_at: -1 })
            .populate('created_by', 'nickname avatar_color')
            .populate('candidates.votes.user_id', 'nickname avatar_color') // Populate voters
            .lean();

        // Transform for frontend
        const result = proposals.map(p => ({
            id: p._id.toString(),
            title: p.title,
            creator: {
                nickname: p.created_by.nickname,
                avatar_color: p.created_by.avatar_color
            },
            status: p.status, // active, confirmed, cancelled
            final_date: p.final_date,
            candidates: p.candidates.map(c => ({
                date: c.date,
                votes: c.votes.map(v => ({
                    userId: v.user_id._id.toString(),
                    nickname: v.user_id.nickname,
                    avatar_color: v.user_id.avatar_color,
                    vote: v.vote
                }))
            }))
        }));

        return NextResponse.json({ proposals: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId } = params;
        const body = await request.json();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Create
        const proposal = await Proposal.create({
            space_id: spaceId,
            created_by: user._id,
            title: body.title,
            candidates: body.candidates.map(date => ({ date, votes: [] })),
            status: 'active'
        });

        // Notify Space Members
        // Need to fetch members
        const members = await SpaceMember.find({ space_id: spaceId });
        const notifications = members
            .filter(m => m.user_id.toString() !== user._id.toString())
            .map(m => ({
                user_id: m.user_id,
                space_id: spaceId,
                type: 'proposal_created',
                title: '📋 新的约活动',
                body: `${user.nickname} 发起了: ${body.title}`,
                from_user_id: user._id,
                related_id: proposal._id.toString()
            }));

        if (notifications.length > 0) {
            const inserted = await Notification.insertMany(notifications);
            // Push via SSE
            inserted.forEach(n => {
                pushToUser(n.user_id.toString(), 'notification', {
                    id: n._id,
                    title: n.title,
                    body: n.body,
                    type: n.type,
                    created_at: n.created_at,
                });
            });
        }

        return NextResponse.json({ success: true, proposal: { id: proposal._id.toString() } });
    } catch (error) {
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

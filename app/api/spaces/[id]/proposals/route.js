import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Notification } from '@/models';
import { pushToUser } from '@/lib/sse';

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
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check member
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const proposals = await Proposal.find({ space_id: spaceId })
            .sort({ created_at: -1 })
            .populate('created_by', 'nickname avatar_color')
            .populate('candidates.votes.user_id', 'nickname avatar_color')
            .lean();

        // Transform to match frontend expected shape
        const result = proposals.map(p => {
            // Build candidate_dates array
            const candidate_dates = p.candidates.map(c => c.date);

            // Build vote_matrix: { date: { userId: vote } }
            const vote_matrix = {};
            p.candidates.forEach(c => {
                vote_matrix[c.date] = {};
                c.votes.forEach(v => {
                    const uid = v.user_id?._id?.toString() || v.user_id?.toString();
                    if (uid) {
                        vote_matrix[c.date][uid] = v.vote;
                    }
                });
            });

            return {
                id: p._id.toString(),
                title: p.title,
                creator_nickname: p.created_by?.nickname || 'Unknown',
                creator_avatar_color: p.created_by?.avatar_color || '#666',
                creator_id: p.created_by?._id?.toString(),
                status: p.status,
                confirmed_date: p.final_date,
                candidate_dates,
                vote_matrix,
                participants: p.participants?.map(pid => pid.toString()) || [],
            };
        });

        return NextResponse.json({ proposals: result });
    } catch (error) {
        console.error('Fetch proposals error:', error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const body = await request.json();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // Frontend sends candidate_dates (array of date strings)
        const dates = body.candidate_dates || body.candidates || [];
        if (!body.title || dates.length === 0) {
            return NextResponse.json({ error: '标题和候选日期不能为空' }, { status: 400 });
        }

        // Create
        const proposal = await Proposal.create({
            space_id: spaceId,
            created_by: user._id,
            title: body.title,
            candidates: dates.map(date => ({ date, votes: [] })),
            status: 'active'
        });

        // Notify Space Members
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
        console.error('Create proposal error:', error);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

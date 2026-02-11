import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, Space, SpaceMember, User } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';
import { sendPushToSpaceMembers } from '@/lib/push';

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

        // Check membership
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fetch proposals
        // Populate creator details
        const proposals = await Proposal.find({ space_id: spaceId })
            .populate('created_by', 'nickname avatar_color')
            .sort({ created_at: -1 })
            .lean();

        // Transform if needed (e.g. status summary)
        const result = proposals.map(p => ({
            id: p._id.toString(),
            title: p.title,
            description: p.description,
            status: p.status,
            slots: p.slots.map(s => ({
                start_date: s.start_date,
                end_date: s.end_date,
                vote_count: s.votes?.length || 0,
                // Hide votes for summary list? Or show full?
                // Let's show full for now as lists are small
                votes: s.votes
            })),
            created_by: {
                id: p.created_by._id.toString(),
                nickname: p.created_by.nickname,
                avatar_color: p.created_by.avatar_color
            },
            created_at: p.created_at,
            settings: p.settings
        }));

        return NextResponse.json({ proposals: result });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id: spaceId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check role
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (['viewer', 'guest'].includes(member.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await request.json();
        // Validation: body.slots array required
        if (!body.slots || !Array.isArray(body.slots) || body.slots.length === 0) {
            return NextResponse.json({ error: 'At least one slot required' }, { status: 400 });
        }

        const proposal = await Proposal.create({
            space_id: spaceId,
            created_by: user._id,
            title: body.title,
            description: body.description,
            status: 'voting', // Default
            slots: body.slots.map(s => ({
                start_date: s.start_date,
                end_date: s.end_date,
                votes: []
            })),
            settings: body.settings || {}
        });

        // Push SSE
        await pushToSpaceMembers(spaceId, 'proposal_created', {
            proposalId: proposal._id.toString(),
            title: proposal.title,
            created_by: user.nickname
        }, user._id.toString());

        // WebPush
        await sendPushToSpaceMembers(spaceId, {
            title: '🗳️ New Proposal',
            body: `${user.nickname} proposed: ${proposal.title}`,
            url: `/space/${spaceId}/proposal/${proposal._id}`
        }, user._id.toString());

        return NextResponse.json({ success: true, proposal: { id: proposal._id.toString() } });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
}

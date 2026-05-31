import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Notification } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';
import { sendPushToSpaceMembers } from '@/lib/push';

async function authenticate(request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    await dbConnect();
    return User.findById(userId);
}

export async function GET(request, { params }) {
    try {
        const { id: spaceId, pid: proposalId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const proposal = await Proposal.findById(proposalId).populate('created_by', 'nickname avatar_color');
        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ proposal });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id: spaceId, pid: proposalId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (proposal.created_by.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        if (body.status === 'cancelled') {
            proposal.status = 'cancelled';
            await proposal.save();

            // Notify space
            await pushToSpaceMembers(spaceId, 'proposal_cancelled', {
                proposalId,
                title: proposal.title
            }, user._id.toString());
            
             // WebPush
            await sendPushToSpaceMembers(spaceId, {
                title: '🚫 Proposal Cancelled',
                body: `${proposal.title} has been cancelled`,
                url: `/space/${spaceId}`
            }, user._id.toString());

            return NextResponse.json({ success: true, proposal });
        }

        return NextResponse.json({ error: 'Invalid update' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id: spaceId, pid: proposalId } = await params;
        const user = await authenticate(request);
        const proposal = await Proposal.findById(proposalId);

        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (proposal.created_by.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Proposal.deleteOne({ _id: proposalId });
        await Notification.deleteMany({ related_id: proposalId });

        // Push proposal_cancelled (implying removal or just generic update)
        await pushToSpaceMembers(spaceId, 'proposal_cancelled', {
            proposalId,
        }, user._id.toString());

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

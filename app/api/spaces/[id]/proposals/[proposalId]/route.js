import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Notification, Event } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function PUT(request, { params }) {
    try {
        const { id: spaceId, proposalId } = await params;
        const body = await request.json();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (body.action === 'confirm') {
            // Confirm a date — only creator can confirm
            if (proposal.created_by.toString() !== user._id.toString()) {
                return NextResponse.json({ error: 'Only creator can confirm' }, { status: 403 });
            }

            // Frontend sends confirmed_date
            const confirmedDate = body.confirmed_date || body.date;
            if (!confirmedDate) {
                return NextResponse.json({ error: 'Missing date' }, { status: 400 });
            }

            proposal.status = 'confirmed';
            proposal.final_date = confirmedDate;
            await proposal.save();

            // Create Event automatically
            const event = await Event.create({
                space_id: proposal.space_id,
                user_id: user._id,
                start_date: confirmedDate,
                end_date: confirmedDate,
                status: 'busy',
                note: `[定档] ${proposal.title}`,
                visibility: 'public',
                participants: []
            });

            // Notify all members
            const members = await SpaceMember.find({ space_id: proposal.space_id });
            const notifications = members
                .filter(m => m.user_id.toString() !== user._id.toString())
                .map(m => ({
                    user_id: m.user_id,
                    space_id: proposal.space_id,
                    type: 'proposal_confirmed',
                    title: '🎉 活动已定档',
                    body: `"${proposal.title}" 定在 ${confirmedDate}`,
                    from_user_id: user._id,
                    related_id: event._id.toString()
                }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            // SSE: Push proposal_confirmed to space members
            await pushToSpaceMembers(spaceId, 'proposal_confirmed', {
                proposalId,
                title: proposal.title,
                confirmed_date: confirmedDate,
                eventId: event._id.toString(),
            }, user._id.toString());

            return NextResponse.json({ success: true, eventId: event._id.toString() });
        }

        if (body.action === 'cancel') {
            // Cancel a proposal — only creator can cancel
            if (proposal.created_by.toString() !== user._id.toString()) {
                return NextResponse.json({ error: 'Only creator can cancel' }, { status: 403 });
            }

            proposal.status = 'cancelled';
            await proposal.save();

            // SSE: Push proposal_cancelled to space members
            await pushToSpaceMembers(spaceId, 'proposal_cancelled', {
                proposalId,
                title: proposal.title,
            }, user._id.toString());

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Proposal action error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id: spaceId, proposalId } = await params;
        await dbConnect();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (proposal.created_by.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Proposal.deleteOne({ _id: proposalId });
        await Notification.deleteMany({ related_id: proposalId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete proposal error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

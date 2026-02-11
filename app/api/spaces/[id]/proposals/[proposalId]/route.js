import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Notification, Event } from '@/models';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function PUT(request, { params }) {
    // Vote or Confirm
    try {
        const { proposalId } = params;
        const body = await request.json();
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (body.action === 'vote') {
            // body.votes = ['2023-01-01', '2023-01-02'] (dates user voted for)
            const userVotes = new Set(body.votes || []);

            // Update each candidate
            proposal.candidates.forEach(c => {
                const voteSet = new Set(c.votes || []);
                if (userVotes.has(c.date)) {
                    voteSet.add(user._id.toString());
                } else {
                    voteSet.delete(user._id.toString());
                }
                c.votes = Array.from(voteSet);
            });
            await proposal.save();

            // Notify Creator (if not self)
            if (proposal.created_by.toString() !== user._id.toString()) {
                // Check if already notified recently? For now, just notify.
                // Or maybe just generic "vote update"
            }
            return NextResponse.json({ success: true });
        }

        if (body.action === 'confirm') {
            // Confirm a date
            if (proposal.created_by.toString() !== user._id.toString()) {
                return NextResponse.json({ error: 'Only creator can confirm' }, { status: 403 });
            }

            proposal.status = 'confirmed';
            proposal.final_date = body.date;
            await proposal.save();

            // Create Event automatically
            const event = await Event.create({
                space_id: proposal.space_id,
                user_id: user._id,
                start_date: body.date,
                end_date: body.date,
                status: 'busy',
                note: `[定档] ${proposal.title}`,
                visibility: 'public',
                participants: [] // logic to add voters? For now empty or creator.
            });

            // Notify all members
            const members = await SpaceMember.find({ space_id: proposal.space_id });
            const notifications = members.map(m => ({
                user_id: m.user_id,
                space_id: proposal.space_id,
                type: 'proposal_confirmed',
                title: '🎉 活动已定档',
                body: `"${proposal.title}" 定在 ${body.date}`,
                from_user_id: user._id,
                related_id: event._id.toString()
            }));
            await Notification.insertMany(notifications);

            return NextResponse.json({ success: true, eventId: event._id.toString() });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { proposalId } = params;
        const user = await authenticate(request);
        const proposal = await Proposal.findById(proposalId);

        if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (proposal.created_by.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Proposal.deleteOne({ _id: proposalId });
        await Notification.deleteMany({ related_id: proposalId });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

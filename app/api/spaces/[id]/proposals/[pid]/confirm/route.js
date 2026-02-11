import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, Event, SpaceMember, User, Space } from '@/models';
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

export async function POST(request, { params }) {
    try {
        const { id: spaceId, pid: proposalId } = await params;
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check role (Admin/Editor only)
        const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
        if (!member || ['viewer', 'guest'].includes(member.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await request.json();
        const { slotId } = body;
        if (!slotId) return NextResponse.json({ error: 'Slot ID required' }, { status: 400 });

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        if (proposal.status !== 'voting') {
            return NextResponse.json({ error: 'Proposal is not in voting stage' }, { status: 400 });
        }

        const slot = proposal.slots.id(slotId);
        if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

        // Convert votes to participants
        // Status Mapping: available -> accepted, if_need_be -> tentative, unavailable -> declined
        // Missing vote -> pending (if member)

        // Fetch all space members to ensure we include everyone? or just voters?
        // Let's include all space members as participants with default 'pending' unless voted
        const allMembers = await SpaceMember.find({ space_id: spaceId }).populate('user_id');

        const participants = allMembers.map(m => {
            const userId = m.user_id._id.toString();
            // Find vote in this slot
            const voteObj = slot.votes.find(v => v.user_id && v.user_id.toString() === userId);

            let status = 'pending';
            let comment = '';

            if (userId === user._id.toString()) {
                status = 'accepted'; // Creator accepts by default? Or respect vote?
                // Let's respect vote if exists, else accepted (since they confirmed it)
                if (voteObj && voteObj.vote === 'unavailable') status = 'declined'; // Weird edge case
                else status = 'accepted';
            } else if (voteObj) {
                switch (voteObj.vote) {
                    case 'available': status = 'accepted'; break;
                    case 'unavailable': status = 'declined'; break;
                    case 'if_need_be': status = 'tentative'; break;
                }
            }

            return {
                userId: userId,
                status: status,
                comment: comment
            };
        });

        // Create Event
        const event = await Event.create({
            space_id: spaceId,
            user_id: user._id, // Confirmer becomes owner? Or original creator?
            // Let's keep original creator of proposal as owner? Or the confirmer?
            // Usually Confirmer is the one "Handling" it.
            // But Proposal has created_by. Let's use Proposal Creator if member still exists?
            // Safest: Current User (Confirmer) owns the event.
            title: proposal.title,
            description: proposal.description,
            start_date: slot.start_date.toISOString().slice(0, 10), // Event uses YYYY-MM-DD strings currently?
            end_date: slot.end_date.toISOString().slice(0, 10),     // Need to check Event Schema
            // Wait, Event schema uses String YYYY-MM-DD.
            // Proposal uses Date objects.
            // We need to support Time? 
            // Current Event Schema: start_date: String.
            // PRD v3 says "Event (Fixed time)".
            // If we support Time, we need to upgrade Event Schema to Date or ISO String with time.
            // Phase 1 MVP: Event Schema is currently Date-less (User input string).
            // But Proposal slots are Date objects.
            // I should convert Date to YYYY-MM-DD for now.
            // AND I should probably upgrade Event Schema to support Time later (Phase 2).
            // For now, let's just strip time? Or store full ISO string?
            // Schema has `start_date: { type: String }`. String can hold ISO.
            status: 'available', // Default status for event itself? "confirmed" isn't an option. 'available'/'busy'?
            // Event status enum: ['busy', 'vacation', 'available', 'tentative']
            // This is "Event Status" i.e. availability type.
            // A meeting is usually "busy".
            visibility: 'public', // Default
            participants: participants
        });

        // Update Proposal
        proposal.status = 'confirmed';
        proposal.final_event_id = event._id;
        await proposal.save();

        // Push SSE
        await pushToSpaceMembers(spaceId, 'proposal_confirmed', {
            proposalId: proposal._id.toString(),
            eventId: event._id.toString(),
            title: event.title
        });

        // WebPush
        await sendPushToSpaceMembers(spaceId, {
            title: '✅ Event Confirmed',
            body: `Decision made: ${event.title}`,
            url: `/space/${spaceId}/event/${event._id}`
        }, user._id.toString());

        return NextResponse.json({ success: true, event: { id: event._id.toString() } });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Confirm failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Proposal, Space, SpaceMember, User } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';
import mongoose from 'mongoose';

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
        const body = await request.json();

        await dbConnect();
        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

        // Authenticated User Logic
        if (user) {
            // Check membership
            const member = await SpaceMember.findOne({ space_id: spaceId, user_id: user._id });
            if (!member) {
                // If not member, treat as guest? Or forbid?
                // PRD implies Guests are external. If I have a token but am not in space, I am effectively a generic user.
                // But for simplicity, if logged in, you must be a member to vote as "Member".
                // If you are not a member, you can vote as Guest if allowed?
                // Let's enforce membership for logged-in users to keep data clean.
                return NextResponse.json({ error: 'Forbidden: You must join the space to vote as a user' }, { status: 403 });
            }

            // Update user votes
            updateVotesForUser(proposal, user._id, body.votes); // votes: { slotId: 'available' }
        } else {
            // Guest Logic
            if (!proposal.settings.allow_guests) {
                return NextResponse.json({ error: 'Guests not allowed' }, { status: 403 });
            }
            if (!body.guest_name) {
                return NextResponse.json({ error: 'Guest name required' }, { status: 400 });
            }
            // Update guest votes
            // Challenge: How to identify returning guest?
            // For MVP, we don't. Each submit is a "new" vote or overwrites by name?
            // Overwrite by name is simple but risky (impersonation).
            // Let's append for now or overwrite if name matches exactly?
            // "VoteSchema" has user_id optional.
            updateVotesForGuest(proposal, body.guest_name, body.votes);
        }

        await proposal.save();

        // Push SSE
        // Don't await strictly to return faster? No, wait to ensure notification sent.
        const voterName = user ? user.nickname : body.guest_name;
        await pushToSpaceMembers(spaceId, 'proposal_voted', {
            proposalId,
            voter: voterName,
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
    }
}

function updateVotesForUser(proposal, userId, votesMap) {
    if (!votesMap) return;

    // Iterate over slots
    proposal.slots.forEach(slot => {
        const slotId = slot._id.toString();
        if (votesMap[slotId]) {
            const voteVal = votesMap[slotId];

            // Remove existing vote by this user
            const existingIdx = slot.votes.findIndex(v => v.user_id && v.user_id.toString() === userId.toString());
            if (existingIdx >= 0) {
                slot.votes[existingIdx].vote = voteVal;
                slot.votes[existingIdx].updated_at = new Date();
            } else {
                slot.votes.push({
                    user_id: userId,
                    vote: voteVal,
                    updated_at: new Date()
                });
            }
        }
    });
}

function updateVotesForGuest(proposal, guestName, votesMap) {
    if (!votesMap) return;

    proposal.slots.forEach(slot => {
        const slotId = slot._id.toString();
        if (votesMap[slotId]) {
            const voteVal = votesMap[slotId];

            // Try to find existing guest vote by name (Simple MVP logic)
            const existingIdx = slot.votes.findIndex(v => !v.user_id && v.guest_name === guestName);
            if (existingIdx >= 0) {
                slot.votes[existingIdx].vote = voteVal;
                slot.votes[existingIdx].updated_at = new Date();
            } else {
                slot.votes.push({
                    guest_name: guestName,
                    vote: voteVal,
                    updated_at: new Date()
                });
            }
        }
    });
}

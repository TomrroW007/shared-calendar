import { pushToSpaceMembers } from '@/lib/sse';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User, Event, Notification } from '@/models';
import { NextResponse } from 'next/server';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

// POST /api/spaces/[id]/proposals/[proposalId]/vote
export async function POST(request, { params }) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

        const { id, proposalId } = await params;
        await dbConnect();

        // Check verification
        const membership = await SpaceMember.findOne({ space_id: id, user_id: user._id });
        if (!membership) return NextResponse.json({ error: '非成员' }, { status: 403 });

        const proposal = await Proposal.findById(proposalId);
        if (!proposal) return NextResponse.json({ error: '提案不存在' }, { status: 404 });
        if (proposal.status !== 'open' && proposal.status !== 'active') return NextResponse.json({ error: '提案已结束' }, { status: 400 });

        const { votes } = await request.json();
        // votes: [{ date: "2026-02-15", vote: "available" | "unavailable" | "maybe" }]

        if (!Array.isArray(votes)) return NextResponse.json({ error: '无效的投票数据' }, { status: 400 });

        // Update votes using Mongoose (in-memory update then save)
        for (const v of votes) {
            if (['available', 'unavailable', 'maybe'].includes(v.vote)) {
                const candidate = proposal.candidates.find(c => c.date === v.date);
                if (candidate) {
                    // Remove existing vote by this user
                    candidate.votes = candidate.votes.filter(vote => vote.user_id.toString() !== user._id.toString());
                    // Add new vote
                    candidate.votes.push({
                        user_id: user._id,
                        vote: v.vote
                    });
                }
            }
        }

        // Add to participants if not already
        const isParticipant = proposal.participants.some(pId => pId.toString() === user._id.toString());
        if (!isParticipant) {
            proposal.participants.push(user._id);
        }

        await proposal.save();

        // Push vote update to space
        await pushToSpaceMembers(id, 'proposal_voted', {
            proposalId,
            userId: user._id.toString(),
            nickname: user.nickname,
        }, user._id.toString());

        // ===== Auto-confirm check =====
        // If ALL space members voted 'available' on the SAME date, auto-confirm that date
        const allMembers = await SpaceMember.find({ space_id: id });
        const totalMembers = allMembers.length;

        let autoConfirmedDate = null;
        for (const candidate of proposal.candidates) {
            const availableVotes = candidate.votes.filter(v => v.vote === 'available');
            if (availableVotes.length >= totalMembers) {
                // Check that every member has voted available
                const votedUserIds = new Set(availableVotes.map(v => v.user_id.toString()));
                const allVoted = allMembers.every(m => votedUserIds.has(m.user_id.toString()));
                if (allVoted) {
                    autoConfirmedDate = candidate.date;
                    break; // Take the first fully-agreed date
                }
            }
        }

        if (autoConfirmedDate) {
            // Auto-confirm the proposal
            proposal.status = 'confirmed';
            proposal.final_date = autoConfirmedDate;
            await proposal.save();

            // Create Event automatically
            const event = await Event.create({
                space_id: id,
                user_id: proposal.created_by,
                start_date: autoConfirmedDate,
                end_date: autoConfirmedDate,
                status: 'busy',
                note: `[全票通过] ${proposal.title}`,
                visibility: 'public',
                participants: allMembers.map(m => ({
                    userId: m.user_id.toString(),
                    status: 'accepted'
                }))
            });

            // Notify all members about auto-confirmation
            const notifications = allMembers.map(m => ({
                user_id: m.user_id,
                space_id: id,
                type: 'proposal_confirmed',
                title: '🎉 全票通过！活动已自动定档',
                body: `"${proposal.title}" 全员可约 ${autoConfirmedDate}，已自动确认！`,
                from_user_id: proposal.created_by,
                related_id: event._id.toString()
            }));
            await Notification.insertMany(notifications);

            // SSE push: proposal_confirmed + event_created
            await pushToSpaceMembers(id, 'proposal_confirmed', {
                proposalId,
                title: proposal.title,
                confirmed_date: autoConfirmedDate,
                eventId: event._id.toString(),
                auto: true,
            });
            await pushToSpaceMembers(id, 'event_created', {
                eventId: event._id.toString(),
                auto: true,
            });

            return NextResponse.json({
                success: true,
                auto_confirmed: true,
                confirmed_date: autoConfirmedDate,
                eventId: event._id.toString()
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: '投票失败' }, { status: 500 });
    }
}

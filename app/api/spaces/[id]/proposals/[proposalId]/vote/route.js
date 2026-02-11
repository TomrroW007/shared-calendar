import { pushToSpaceMembers } from '@/lib/sse';
import dbConnect from '@/lib/mongodb';
import { Proposal, SpaceMember, User } from '@/models';
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: '投票失败' }, { status: 500 });
    }
}

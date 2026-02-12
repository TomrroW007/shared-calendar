import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Comment, User, SpaceMember } from '@/models';
import { pushToSpaceMembers } from '@/lib/sse';

async function authenticate(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    await dbConnect();
    return User.findOne({ token });
}

export async function GET(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const relatedId = searchParams.get('relatedId');
        if (!relatedId) return NextResponse.json({ error: 'relatedId required' }, { status: 400 });

        const comments = await Comment.find({ related_id: relatedId })
            .populate('user_id', 'nickname avatar_color')
            .sort({ created_at: 1 })
            .lean();

        return NextResponse.json({ comments });
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await authenticate(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { relatedId, content, spaceId } = await request.json();
        if (!relatedId || !content) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const comment = await Comment.create({
            related_id: relatedId,
            user_id: user._id,
            content
        });

        const enrichedComment = {
            ...comment.toObject(),
            user_id: {
                _id: user._id,
                nickname: user.nickname,
                avatar_color: user.avatar_color
            }
        };

        if (spaceId) {
            await pushToSpaceMembers(spaceId, 'comment_created', {
                relatedId,
                comment: enrichedComment
            }, user._id.toString());
        }

        return NextResponse.json({ success: true, comment: enrichedComment });
    } catch (error) {
        return NextResponse.json({ error: 'Post failed' }, { status: 500 });
    }
}

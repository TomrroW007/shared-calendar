import { addSubscriber, removeSubscriber } from '@/lib/sse';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

async function getUserFromToken(token) {
    if (!token) return null;
    await dbConnect();
    const user = await User.findOne({ token });
    return user ? { id: user._id.toString(), nickname: user.nickname } : null;
}

// GET /api/sse — Server-Sent Events stream
export async function GET(request) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const user = await getUserFromToken(token);
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const stream = new ReadableStream({
        start(controller) {
            addSubscriber(user.id, controller);

            // Send heartbeat every 30s to keep connection alive
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 30000);

            // Send initial connected event
            const connectMsg = `event: connected\ndata: ${JSON.stringify({ userId: user.id })}\n\n`;
            controller.enqueue(new TextEncoder().encode(connectMsg));

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                removeSubscriber(user.id, controller);
                try { controller.close(); } catch { }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}

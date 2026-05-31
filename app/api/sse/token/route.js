import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import { createEphemeralToken } from '@/lib/sse-token';

// POST /api/sse/token
export async function POST(request) {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401 });
    }
    const token = auth.split(' ')[1];
    await dbConnect();
    const user = await User.findOne({ token });
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { token: eph, expiresAt } = createEphemeralToken(user._id.toString());
    return new Response(JSON.stringify({ token: eph, expires_in: Math.floor((expiresAt - Date.now()) / 1000) }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

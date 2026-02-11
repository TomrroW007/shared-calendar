
import dbConnect from '@/lib/mongodb';
import { SpaceMember } from '@/models';

// Use global to persist across HMR in dev mode
const globalSubscribers = global.sseSubscribers || new Map();
if (process.env.NODE_ENV !== 'production') {
    global.sseSubscribers = globalSubscribers;
}

export function addSubscriber(userId, controller) {
    if (!globalSubscribers.has(userId)) {
        globalSubscribers.set(userId, new Set());
    }
    const userSet = globalSubscribers.get(userId);
    userSet.add(controller);
    // console.log(`User ${userId} subscribed. Total clients: ${userSet.size}`);
}

export function removeSubscriber(userId, controller) {
    const set = globalSubscribers.get(userId);
    if (set) {
        set.delete(controller);
        if (set.size === 0) globalSubscribers.delete(userId);
    }
}

export function pushToUser(userId, event, data) {
    const set = globalSubscribers.get(userId);
    if (set) {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const controller of set) {
            try {
                controller.enqueue(new TextEncoder().encode(msg));
            } catch (e) {
                console.error(`Error pushing to user ${userId}:`, e);
                set.delete(controller);
            }
        }
    }
}

export async function pushToSpaceMembers(spaceId, event, data, excludeUserId = null) {
    try {
        await dbConnect();
        const members = await SpaceMember.find({ space_id: spaceId }).select('user_id');

        for (const m of members) {
            const uid = m.user_id.toString();
            if (excludeUserId && uid === excludeUserId.toString()) continue;
            pushToUser(uid, event, data);
        }
    } catch (error) {
        console.error('Error in pushToSpaceMembers:', error);
    }
}

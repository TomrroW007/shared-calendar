import pusher from './pusher';

export function addSubscriber(userId, controller) {
    // No-op for Pusher
}

export function removeSubscriber(userId, controller) {
    // No-op for Pusher
}

export function pushToUser(userId, event, data) {
    try {
        const channelName = `private-user-${userId}`;
        pusher.trigger(channelName, event, data);
    } catch (e) {
        console.error(`Error pushing to user ${userId} via Pusher:`, e);
    }
}

export async function pushToSpaceMembers(spaceId, event, data, excludeUserId = null) {
    try {
        const channelName = `private-space-${spaceId}`;
        pusher.trigger(channelName, event, data);
    } catch (error) {
        console.error(`Error pushing to space ${spaceId} via Pusher:`, error);
    }
}

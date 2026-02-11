import webpush from 'web-push';
import { User } from '@/models';
import dbConnect from '@/lib/mongodb';

// Configure WebPush
// VAPID keys must be in env
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@shared-calendar.app', // Required mailto
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendPushNotification(userId, payload) {
    // payload: { title, body, url, ... }
    const stringPayload = JSON.stringify(payload);

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user || !user.push_subscriptions || user.push_subscriptions.length === 0) {
            return;
        }

        const subscriptions = user.push_subscriptions;
        const promises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, stringPayload);
            } catch (error) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription expired/gone, remove it
                    console.log('Subscription expired, removing:', sub.endpoint);
                    return { expired: true, endpoint: sub.endpoint };
                }
                console.error('Push failed for sub:', error);
            }
            return { expired: false };
        });

        const results = await Promise.all(promises);

        // Clean up expired
        const expiredEndpoints = results.filter(r => r.expired).map(r => r.endpoint);
        if (expiredEndpoints.length > 0) {
            await User.updateOne(
                { _id: userId },
                { $pull: { push_subscriptions: { endpoint: { $in: expiredEndpoints } } } }
            );
        }

        if (expiredEndpoints.length > 0) {
            await User.updateOne(
                { _id: userId },
                { $pull: { push_subscriptions: { endpoint: { $in: expiredEndpoints } } } }
            );
        }

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export async function sendPushToSpaceMembers(spaceId, payload, excludeUserId = null) {
    try {
        await dbConnect();
        // Import SpaceMember dynamically or locally to avoid circular deps? 
        // Models index handles it usually.
        const { SpaceMember } = await import('@/models');

        const members = await SpaceMember.find({ space_id: spaceId }).select('user_id');

        const promises = members.map(m => {
            const uid = m.user_id.toString();
            if (excludeUserId && uid === excludeUserId.toString()) return Promise.resolve();
            return sendPushNotification(uid, payload);
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error sending push to space:', error);
    }
}

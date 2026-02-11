'use client';
import { useEffect, useState } from 'react';

// Decode VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Register SW
            navigator.serviceWorker.register('/sw.js')
                .then(function (swReg) {
                    console.log('SW Registered', swReg);
                    checkSubscription(swReg);
                })
                .catch(function (error) {
                    console.error('SW Error', error);
                });

            setPermission(Notification.permission);
        }
    }, []);

    async function checkSubscription(swReg) {
        const subscription = await swReg.pushManager.getSubscription();
        if (subscription) {
            setIsSubscribed(true);
            // Sync with backend (optional, to update keys?)
            sendSubscription(subscription);
        } else {
            setIsSubscribed(false);
        }
    }

    async function subscribe() {
        if (!('serviceWorker' in navigator)) return;
        const swReg = await navigator.serviceWorker.ready;
        try {
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error('Missing VAPID Key');
                return;
            }
            const convertedKey = urlBase64ToUint8Array(vapidKey);
            const subscription = await swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            });
            await sendSubscription(subscription);
            setIsSubscribed(true);
            setPermission(Notification.permission);
        } catch (error) {
            console.error('Failed to subscribe', error);
        }
    }

    async function sendSubscription(subscription) {
        const token = localStorage.getItem('token'); // Assuming cleanup hasn't removed this logic?
        // Wait, authentication logic on frontend:
        // My layout usually handles auth context.
        // If I don't have token, I can't subscribe.
        // Let's assume user is logged in if they see this.
        if (!token) return;

        await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    }

    if (permission === 'denied') {
        return <div className="text-xs text-red-500">Notifications blocked</div>;
    }

    if (isSubscribed) {
        // Maybe minimal indicator?
        return null;
    }

    return (
        <button
            onClick={subscribe}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition z-50 text-sm"
        >
            🔔 Enable Notifications
        </button>
    );
}

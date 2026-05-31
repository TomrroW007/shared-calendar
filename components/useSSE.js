'use client';

import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useParams } from 'next/navigation';

export function useSSE(onEvent) {
    const pusherRef = useRef(null);
    const params = useParams();
    const spaceId = params?.id;

    const connect = useCallback(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return;
        
        let user;
        try {
            user = JSON.parse(savedUser);
        } catch (e) {
            console.error('Failed to parse user details', e);
            return;
        }

        const userId = user.id;
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

        if (!pusherKey) {
            console.warn('[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY environment variable. Real-time updates disabled.');
            return;
        }

        // Initialize Pusher Client SDK
        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            forceTLS: true,
            authEndpoint: '/api/pusher/auth', // Routes private channel verification
        });
        pusherRef.current = pusher;

        // 1. Subscribe to User Channel (for push notifications)
        const userChannel = pusher.subscribe(`private-user-${userId}`);
        
        userChannel.bind('notification', (data) => {
            onEvent('notification', data);
            showBrowserNotification(data.title, data.body);
        });

        // 2. Subscribe to Space Channel (if active context)
        let spaceChannel = null;
        if (spaceId) {
            spaceChannel = pusher.subscribe(`private-space-${spaceId}`);
            
            spaceChannel.bind('event_created', (data) => {
                onEvent('event_created', data);
            });
            spaceChannel.bind('event_updated', (data) => {
                onEvent('event_updated', data);
            });
            spaceChannel.bind('event_deleted', (data) => {
                onEvent('event_deleted', data);
            });
            spaceChannel.bind('proposal_created', (data) => {
                onEvent('proposal_created', data);
                showBrowserNotification('📋 新的约活动', data.proposal?.title);
            });
            spaceChannel.bind('proposal_confirmed', (data) => {
                onEvent('proposal_confirmed', data);
                showBrowserNotification('🎉 活动已确认', `「${data.title}」定在 ${data.confirmed_date}`);
            });
            spaceChannel.bind('proposal_voted', (data) => {
                onEvent('proposal_voted', data);
            });
            spaceChannel.bind('proposal_cancelled', (data) => {
                onEvent('proposal_cancelled', data);
            });
        }

        pusher.connection.bind('error', (err) => {
            console.error('[Pusher] Connection error:', err);
        });

    }, [onEvent, spaceId]);

    useEffect(() => {
        connect();
        return () => {
            if (pusherRef.current) {
                pusherRef.current.disconnect();
            }
        };
    }, [connect]);
}

function showBrowserNotification(title, body) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification(title, { body: body || '', icon: '📅' });
    }
}

export function requestNotificationPermission() {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

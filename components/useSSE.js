'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useSSE(onEvent) {
    const esRef = useRef(null);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Close existing connection
        if (esRef.current) {
            esRef.current.close();
        }

        const es = new EventSource(`/api/sse?token=${token}`);
        esRef.current = es;

        es.addEventListener('connected', () => {
            console.log('[SSE] Connected');
        });

        es.addEventListener('notification', (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent('notification', data);
                // Show browser notification
                showBrowserNotification(data.title, data.body);
            } catch { }
        });

        es.addEventListener('event_created', (e) => {
            try { onEvent('event_created', JSON.parse(e.data)); } catch { }
        });

        es.addEventListener('proposal_created', (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent('proposal_created', data);
                showBrowserNotification(`📋 新的约活动`, data.proposal?.title);
            } catch { }
        });

        es.addEventListener('proposal_confirmed', (e) => {
            try {
                const data = JSON.parse(e.data);
                onEvent('proposal_confirmed', data);
                showBrowserNotification('🎉 活动已确认', `「${data.title}」定在 ${data.confirmed_date}`);
            } catch { }
        });

        es.addEventListener('proposal_voted', (e) => {
            try { onEvent('proposal_voted', JSON.parse(e.data)); } catch { }
        });

        es.addEventListener('proposal_cancelled', (e) => {
            try { onEvent('proposal_cancelled', JSON.parse(e.data)); } catch { }
        });

        es.onerror = () => {
            es.close();
            // Reconnect after 5 seconds
            reconnectTimeout.current = setTimeout(connect, 5000);
        };
    }, [onEvent]);

    useEffect(() => {
        connect();
        return () => {
            if (esRef.current) esRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
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

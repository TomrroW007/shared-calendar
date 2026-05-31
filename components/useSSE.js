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

        // Request a short-lived SSE token from the server to avoid sending long-lived tokens in URLs
        fetch('/api/sse/token', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (!r.ok) throw new Error('Failed to get SSE token');
                return r.json();
            })
            .then(data => {
                const es = new EventSource(`/api/sse?token=${data.token}`);
                esRef.current = es;

                es.addEventListener('connected', () => {
                    console.log('[SSE] Connected');
                });

                es.addEventListener('notification', (e) => {
                    try {
                        const d = JSON.parse(e.data);
                        onEvent('notification', d);
                        // Show browser notification
                        showBrowserNotification(d.title, d.body);
                    } catch { }
                });

                es.addEventListener('event_created', (e) => {
                    try { onEvent('event_created', JSON.parse(e.data)); } catch { }
                });

                es.addEventListener('event_updated', (e) => {
                    try { onEvent('event_updated', JSON.parse(e.data)); } catch { }
                });

                es.addEventListener('event_deleted', (e) => {
                    try { onEvent('event_deleted', JSON.parse(e.data)); } catch { }
                });

                es.addEventListener('proposal_created', (e) => {
                    try {
                        const d = JSON.parse(e.data);
                        onEvent('proposal_created', d);
                        showBrowserNotification(`📋 新的约活动`, d.proposal?.title);
                    } catch { }
                });

                es.addEventListener('proposal_confirmed', (e) => {
                    try {
                        const d = JSON.parse(e.data);
                        onEvent('proposal_confirmed', d);
                        showBrowserNotification('🎉 活动已确认', `「${d.title}」定在 ${d.confirmed_date}`);
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
            })
            .catch(err => {
                console.warn('SSE token request failed', err);
            });
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

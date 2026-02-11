'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function NotificationBell({ onItemClick }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);

    const getToken = () => localStorage.getItem('token');

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch { }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // No more polling — SSE-driven via window.__refreshNotifications

        // Auto-refresh when window gains focus
        const onFocus = () => fetchNotifications();
        window.addEventListener('focus', onFocus);

        return () => {
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchNotifications]);

    // Expose refresh for parent to call + track pulse
    const [isPulsing, setIsPulsing] = useState(false);
    const pulseTimer = useRef(null);

    useEffect(() => {
        window.__refreshNotifications = () => {
            fetchNotifications();
            // Trigger pulse animation
            setIsPulsing(true);
            if (pulseTimer.current) clearTimeout(pulseTimer.current);
            pulseTimer.current = setTimeout(() => setIsPulsing(false), 1500);
        };
        return () => {
            delete window.__refreshNotifications;
            if (pulseTimer.current) clearTimeout(pulseTimer.current);
        };
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ ids: 'all' }),
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { }
    };

    const handleItemClick = (n) => {
        setShowPanel(false);
        if (onItemClick) onItemClick(n);
        // Optimistically mark as read? Or let parent handle?
        // Let's mark local state as read
        if (!n.read) {
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
            setUnreadCount(prev => Math.max(0, prev - 1));
            // Fire API call asynchronously
            fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ ids: [n.id] }),
            }).catch(() => { });
        }
    };

    const typeIcons = {
        mention: '📌',
        event_created: '📅',
        event_updated: '✏️',
        invitation: '📩', // New icon for invitation
        rsvp: '📝', // New icon for RSVP
        proposal_created: '📋',
        proposal_confirmed: '🎉',
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return '刚刚';
        if (diffMin < 60) return `${diffMin}分钟前`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}小时前`;
        return `${Math.floor(diffHr / 24)}天前`;
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                className={`back-btn${isPulsing ? ' notif-bell-pulse' : ''}`}
                style={{ fontSize: '1.1rem', position: 'relative' }}
                onClick={() => setShowPanel(!showPanel)}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#ef4444', color: 'white', fontSize: '0.6rem',
                        fontWeight: 700, borderRadius: '50%', width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-primary)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showPanel && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                        onClick={() => setShowPanel(false)}
                    />
                    <div style={{
                        position: 'absolute', top: '44px', right: 0,
                        width: '320px', maxHeight: '400px', overflowY: 'auto',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000, padding: '8px 0',
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 16px 12px', borderBottom: '1px solid var(--border-color)',
                        }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>通知</span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    style={{ fontSize: '0.75rem', color: 'var(--accent-solid)' }}
                                >
                                    全部已读
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                暂无通知
                            </div>
                        ) : (
                            notifications.slice(0, 20).map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    style={{
                                        display: 'flex', gap: '10px', padding: '10px 16px',
                                        background: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                                        borderLeft: n.read ? 'none' : '3px solid var(--accent-solid)',
                                        transition: 'background 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    className="notification-item"
                                >
                                    <span style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: n.from_avatar_color || '#666', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0,
                                    }}>
                                        {n.from_nickname?.charAt(0) || '?'}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                            {typeIcons[n.type] || '📌'} {n.title}
                                        </div>
                                        {n.body && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {n.body}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {formatTime(n.created_at)}
                                            {n.action_needed && <span style={{ color: 'var(--accent-solid)', marginLeft: '8px' }}>👇 待处理</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

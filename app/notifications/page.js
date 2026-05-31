'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    const router = useRouter();

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: 'all' }),
            });
            if (!res.ok) throw new Error();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            showToast('已全部标记为已读');
        } catch {
            showToast('操作失败');
        }
    };

    const handleItemClick = async (n) => {
        // Mark as read
        if (!n.read) {
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
            setUnreadCount(prev => Math.max(0, prev - 1));
            try {
                await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [n.id] }),
                });
            } catch (err) {
                console.error(err);
            }
        }

        // Redirect to relevant space
        if (n.space_id) {
            router.push(`/space/${n.space_id}`);
        } else {
            router.push('/');
        }
    };

    const typeIcons = {
        mention: '📌',
        event_created: '📅',
        event_updated: '✏️',
        invitation: '📩',
        rsvp: '📝',
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

    if (loading) {
        return (
            <div className="page">
                <div className="loading-center"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ justifyContent: 'space-between' }}>
                    <div>
                        <h1>通知中心</h1>
                        <p className="subtitle">共 {notifications.length} 条通知，{unreadCount} 条未读</p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={markAllRead} style={{ borderRadius: '20px' }}>
                            ✓ 全部已读
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">🔔</div>
                        <p>暂无通知安排<br />与朋友标记日程或创建活动后会在此通知你</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className="card event-item"
                                onClick={() => handleItemClick(n)}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '16px',
                                    background: n.read ? 'var(--bg-card)' : 'rgba(182, 146, 246, 0.08)',
                                    borderColor: n.read ? 'var(--border-color)' : 'var(--border-accent)',
                                    position: 'relative'
                                }}
                            >
                                <span
                                    className="avatar"
                                    style={{
                                        background: n.from_avatar_color || '#666',
                                        width: 36,
                                        height: 36,
                                        fontSize: '0.9rem',
                                        fontWeight: 700
                                    }}
                                >
                                    {n.from_nickname?.charAt(0) || '?'}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                            {typeIcons[n.type] || '📌'} {n.title}
                                        </span>
                                        {!n.read && (
                                            <span style={{
                                                background: '#ef4444',
                                                borderRadius: '50%',
                                                width: '6px',
                                                height: '6px'
                                            }} />
                                        )}
                                    </div>
                                    {n.body && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {n.body}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                        {formatTime(n.created_at)}
                                    </div>
                                </div>
                                <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                                    ›
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CalendarsPage() {
    const [calendars, setCalendars] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState('');
    const router = useRouter();

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const fetchCalendars = useCallback(async () => {
        try {
            const res = await fetch('/api/users/me/calendars');
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setCalendars(data.calendars || []);
            }
        } catch (err) {
            console.error('Failed to fetch calendars:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl.trim() || !newName.trim()) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/users/me/calendars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: newUrl.trim(), name: newName.trim() })
            });
            if (res.ok) {
                setNewUrl('');
                setNewName('');
                showToast('外部日历同步成功');
                fetchCalendars();
            } else {
                const data = await res.json();
                showToast(data.error || '添加失败，请检查URL格式');
            }
        } catch {
            showToast('添加失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定要移除此外部日历吗？\n移除后，该日历关联的所有忙碌时段将不再同步展示给朋友。')) return;
        try {
            const res = await fetch(`/api/users/me/calendars?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                showToast('已移除日历');
                fetchCalendars();
            } else {
                showToast('移除失败');
            }
        } catch {
            showToast('移除失败');
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <Link href="/account" className="back-btn">←</Link>
                    <div>
                        <h1>同步外部日历</h1>
                        <p className="subtitle">导入您的 Apple/Google/Microsoft ICS 链接</p>
                    </div>
                </div>

                {/* Add Calendar Form Card */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 className="section-title" style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95rem' }}>
                        🔗 导入新日历 (ICS URL)
                    </h3>
                    
                    <form onSubmit={handleAdd}>
                        <div className="input-group">
                            <label>日历名称</label>
                            <input
                                className="input"
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="例如：工作安排、iCloud 个人"
                                maxLength={30}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>ICS 订阅链接</label>
                            <input
                                className="input"
                                type="url"
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="https://calendar.google.com/..."
                                required
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                                请填写公共或私人的 ICS 格式日历订阅链接。导入后，系统仅提取您的忙碌时间并对好友匿名展示，不会公开您的日程详情。
                            </p>
                        </div>
                        
                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={actionLoading || !newUrl.trim() || !newName.trim()}
                        >
                            {actionLoading ? '同步中...' : '开始导入并同步'}
                        </button>
                    </form>
                </div>

                {/* Calendars List Card */}
                <div className="card">
                    <h3 className="section-title" style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95rem' }}>
                        📅 已同步的外部日历
                    </h3>

                    {loading ? (
                        <div className="loading-center" style={{ padding: '20px 0' }}>
                            <div className="spinner" />
                        </div>
                    ) : calendars.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 0' }}>
                            <div className="emoji" style={{ fontSize: '2rem', marginBottom: '8px' }}>🏖️</div>
                            <p style={{ fontSize: '0.8rem' }}>尚未连接任何外部日历<br />连接后会自动同步并在空闲分析中占位</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {calendars.map(cal => (
                                <div
                                    key={cal._id}
                                    className="event-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 14px',
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📅</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            {cal.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                                marginTop: '2px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            title={cal.url}
                                        >
                                            {cal.url}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cal._id)}
                                        className="btn btn-danger btn-sm"
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '0.75rem',
                                            borderRadius: '6px',
                                            flexShrink: 0
                                        }}
                                    >
                                        移除
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    const router = useRouter();

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.status === 401) {
                    router.push('/login');
                    return;
                }
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
            } finally {
                setLoading(false);
            }
        };

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        fetchMe();
    }, [router]);

    const handleLogout = async () => {
        if (!confirm('确定要退出登录吗？')) return;
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        }
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleCopyUsername = () => {
        if (user && user.username) {
            navigator.clipboard.writeText(user.username);
            showToast('用户名已复制到剪贴板');
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-center"><div className="spinner" /></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1>个人账户</h1>
                </div>

                <div className="card" style={{ textAlign: 'center', marginBottom: '20px', padding: '24px 20px' }}>
                    <div
                        className="avatar"
                        style={{
                            background: user.avatar_color,
                            margin: '0 auto 16px',
                            width: 64,
                            height: 64,
                            fontSize: '1.5rem',
                            fontWeight: 700
                        }}
                    >
                        {user.nickname?.charAt(0)}
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user.nickname}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Vibe: {user.social_battery === 'low' && '🔋 Low Battery'}
                        {user.social_battery === 'open' && '☕ Open'}
                        {user.social_battery === 'hype' && '🔥 Hype Mode'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <div className="token-display" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>用户名 (Username)</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>{user.username}</span>
                        </div>
                        <button
                            className="btn btn-secondary btn-full btn-sm"
                            onClick={handleCopyUsername}
                            style={{ marginTop: '12px', borderRadius: '8px' }}
                        >
                            📋 复制用户名
                        </button>
                    </div>

                    <Link href="/settings/calendars">
                        <div className="card space-card" style={{ padding: '16px 20px' }}>
                            <div className="space-card-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-solid)', fontSize: '1.2rem' }}>
                                📅
                            </div>
                            <div className="space-card-info">
                                <h3 style={{ fontSize: '0.95rem' }}>同步外部日历 (ICS)</h3>
                                <p style={{ fontSize: '0.75rem' }}>导入您的 Apple/Google/Microsoft 外部日历</p>
                            </div>
                            <span className="space-card-arrow">→</span>
                        </div>
                    </Link>
                </div>

                <button className="btn btn-danger btn-full" onClick={handleLogout}>
                    🚪 退出登录
                </button>
            </div>

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FAB from '@/components/FAB';

export default function HomePage() {
    const [spaces, setSpaces] = useState([]);
    const [todayEvents, setTodayEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState('');
    const router = useRouter();

    // Listen for global command palette events
    useEffect(() => {
        const handleOpenCreate = () => setShowCreate(true);
        window.addEventListener('open-create-space', handleOpenCreate);
        return () => window.removeEventListener('open-create-space', handleOpenCreate);
    }, []);

    const getToken = () => localStorage.getItem('token');

    const handleLogout = () => {
        if (!confirm('确定要退出登录吗？\n退出前请确保已保存好你的访问令牌。')) return;
        localStorage.clear();
        router.push('/login');
    };

    const handleCopyToken = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigator.clipboard.writeText(token);
            showToast('令牌已复制到剪贴板');
        }
    };

    const fetchSpaces = useCallback(async (token) => {
        try {
            const currentToken = token || getToken();
            const [spacesRes, todayRes] = await Promise.all([
                fetch('/api/spaces', { headers: { Authorization: `Bearer ${currentToken}` } }),
                fetch('/api/events/today', { headers: { Authorization: `Bearer ${currentToken}` } })
            ]);
            
            if (spacesRes.status === 401) {
                router.push('/login');
                return;
            }
            const spacesData = await spacesRes.json();
            const todayData = await todayRes.json();
            
            setSpaces(spacesData.spaces || []);
            setTodayEvents(todayData.events || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
        fetchSpaces(token);
    }, [router, fetchSpaces]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const handleCreateSpace = async (e) => {
        e.preventDefault();
        if (!newSpaceName.trim()) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/spaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ name: newSpaceName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowCreate(false);
            setNewSpaceName('');
            showToast(`空间创建成功！邀请码：${data.space.invite_code}`);
            fetchSpaces();
        } catch (err) {
            showToast(err.message || '创建失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinSpace = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/spaces/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ invite_code: inviteCode.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowJoin(false);
            setInviteCode('');
            if (data.already_member) {
                showToast('你已经是该空间的成员');
            } else {
                showToast(`成功加入「${data.space.name}」`);
            }
            fetchSpaces();
        } catch (err) {
            showToast(err.message || '加入失败');
        } finally {
            setActionLoading(false);
        }
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
                        <h1>我的空间</h1>
                        {user && <p className="subtitle">Hi, {user.nickname} 👋</p>}
                    </div>
                    {user && (
                        <div className="avatar" style={{ background: user.avatar_color, cursor: 'pointer' }} onClick={() => setShowAccount(true)}>
                            {user.nickname?.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Dashboard: Today Overview */}
                {todayEvents.length > 0 && (
                    <div className="dashboard-section" style={{ marginBottom: '24px' }}>
                        <h3 className="section-title">📅 今日概览</h3>
                        <div className="today-grid">
                            {todayEvents.map(e => (
                                <Link key={e.id} href={`/space/${e.space_id}`}>
                                    <div className="today-card">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span className="avatar avatar-sm" style={{ background: e.avatar_color }}>{e.nickname?.charAt(0)}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{e.space_name}</span>
                                        </div>
                                        <div className="today-card-note">{e.note || (e.status === 'busy' ? '忙碌' : '休假')}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <h3 className="section-title">🏘️ 空间列表</h3>
                {spaces.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">🏝️</div>
                        <p>还没有加入任何空间<br />创建一个或通过邀请码加入</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {spaces.map((space) => (
                            <Link key={space.id} href={`/space/${space.id}`}>
                                <div className="card space-card">
                                    <div className="space-card-icon">📅</div>
                                    <div className="space-card-info">
                                        <h3>{space.name}</h3>
                                        <p>{space.member_count} 位成员 · {space.role === 'admin' ? '管理员' : '成员'}</p>
                                    </div>
                                    <span className="space-card-arrow">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button for Mobile */}
            <FAB onClick={() => setShowCreate(true)} />
            
            <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                <button className="btn-secondary btn-sm" onClick={() => setShowJoin(true)} style={{ borderRadius: '20px' }}>
                    🔗 输入邀请码加入空间
                </button>
            </div>

            {/* Account Modal */}
            {showAccount && user && (
                <div className="modal-overlay" onClick={() => setShowAccount(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>我的账户</h2>
                            <button className="modal-close" onClick={() => setShowAccount(false)}>✕</button>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div className="avatar avatar-lg" style={{ background: user.avatar_color, margin: '0 auto 12px', width: 64, height: 64, fontSize: '1.5rem' }}>
                                {user.nickname?.charAt(0)}
                            </div>
                            <h3 style={{ fontSize: '1.2rem' }}>{user.nickname}</h3>
                        </div>

                        <div className="token-display">
                            <span className="token-label">访问令牌 (Access Token)</span>
                            <span className="token-value">{localStorage.getItem('token')}</span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                ⚠️ 这是你进入账户的唯一凭证，请妥善保存。你可以在其他设备上使用此令牌登录。
                            </p>
                        </div>

                        <button className="btn btn-secondary btn-full" onClick={handleCopyToken} style={{ marginBottom: '12px' }}>
                            📋 复制令牌
                        </button>
                        <button className="btn btn-danger btn-full" onClick={handleLogout}>
                            🚪 退出登录
                        </button>
                    </div>
                </div>
            )}

            {/* Create Space Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>创建新空间</h2>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateSpace}>
                            <div className="input-group">
                                <label>空间名称</label>
                                <input
                                    className="input"
                                    placeholder="例如：老友聚会群"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    autoFocus
                                    maxLength={30}
                                />
                            </div>
                            <button
                                className="btn btn-primary btn-full"
                                type="submit"
                                disabled={actionLoading || !newSpaceName.trim()}
                            >
                                {actionLoading ? '创建中...' : '创建空间'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Space Modal */}
            {showJoin && (
                <div className="modal-overlay" onClick={() => setShowJoin(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>加入空间</h2>
                            <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>
                        </div>
                        <form onSubmit={handleJoinSpace}>
                            <div className="input-group">
                                <label>邀请码</label>
                                <input
                                    className="input"
                                    placeholder="输入6位邀请码"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    autoFocus
                                    maxLength={6}
                                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 700 }}
                                />
                            </div>
                            <button
                                className="btn btn-primary btn-full"
                                type="submit"
                                disabled={actionLoading || inviteCode.trim().length < 6}
                            >
                                {actionLoading ? '加入中...' : '加入空间'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

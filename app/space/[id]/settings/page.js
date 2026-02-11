'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function SpaceSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const spaceId = params.id;

    const [space, setSpace] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [toast, setToast] = useState('');
    const [copied, setCopied] = useState(false);

    const getToken = () => localStorage.getItem('token');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const savedUser = localStorage.getItem('user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        fetch(`/api/spaces/${spaceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) { router.push('/login'); return null; }
                if (res.status === 403) { router.push('/'); return null; }
                return res.json();
            })
            .then((data) => {
                if (data) {
                    setSpace(data.space);
                    setMembers(data.members);
                }
            })
            .finally(() => setLoading(false));
    }, [spaceId, router]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(space.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('复制失败，请手动复制');
        }
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/join/${space.invite_code}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('邀请链接已复制');
        } catch {
            showToast('复制失败');
        }
    };

    const handleLeaveSpace = async () => {
        if (!confirm('确定要退出这个空间吗？')) return;
        try {
            await fetch(`/api/spaces/${spaceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            router.push('/');
        } catch {
            showToast('操作失败');
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
                <div className="page-header">
                    <Link href={`/space/${spaceId}`} className="back-btn">←</Link>
                    <div>
                        <h1>空间设置</h1>
                        <p className="subtitle">{space?.name}</p>
                    </div>
                </div>

                {/* Invite Code Section */}
                <div className="settings-section">
                    <h3>邀请码</h3>
                    <div className="invite-code-display">
                        <code>{space?.invite_code}</code>
                        <button className="copy-btn" onClick={handleCopyCode}>
                            {copied ? '✓ 已复制' : '复制'}
                        </button>
                    </div>
                    <button
                        className="btn btn-secondary btn-full"
                        style={{ marginTop: '8px' }}
                        onClick={handleCopyLink}
                    >
                        🔗 复制邀请链接
                    </button>
                </div>

                {/* Members Section */}
                <div className="settings-section">
                    <h3>成员（{members.length}）</h3>
                    <div className="card" style={{ padding: '8px' }}>
                        {members.map((m) => (
                            <div key={m.id} className="member-list-item">
                                <span className="avatar" style={{ background: m.avatar_color }}>
                                    {m.nickname?.charAt(0)}
                                </span>
                                <span className="name">
                                    {m.nickname}
                                    {m.id === currentUser?.id && ' (我)'}
                                </span>
                                {m.role === 'admin' && <span className="role">管理员</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leave Space */}
                <div className="settings-section">
                    <button className="btn btn-danger btn-full" onClick={handleLeaveSpace}>
                        退出空间
                    </button>
                </div>
            </div>

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

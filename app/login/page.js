'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/');
        } catch (err) {
            setError(err.message || '注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-logo">📅</div>
            <h1 className="login-title">共享日历</h1>
            <p className="login-subtitle">与朋友同步你的可用性</p>

            <form className="login-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        className="input"
                        type="text"
                        placeholder="输入你的昵称"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={20}
                        autoFocus
                    />
                </div>
                {error && (
                    <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>
                )}
                <button
                    className="btn btn-primary btn-full"
                    type="submit"
                    disabled={loading || !nickname.trim()}
                >
                    {loading ? '正在进入...' : '开始使用 →'}
                </button>
            </form>
        </div>
    );
}

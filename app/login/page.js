'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password) return;
        
        if (mode === 'register') {
            if (!nickname.trim()) return;
            handleRegister();
        } else {
            handleLogin();
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    nickname: nickname.trim(),
                    password: password
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Check if there was a pending invite from auto-join
            const pendingInvite = localStorage.getItem('pendingInvite');
            if (pendingInvite) {
                localStorage.removeItem('pendingInvite');
                router.push(`/join/${pendingInvite}`);
            } else {
                router.push('/');
            }
        } catch (err) {
            setError(err.message || '注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Check if there was a pending invite from auto-join
            const pendingInvite = localStorage.getItem('pendingInvite');
            if (pendingInvite) {
                localStorage.removeItem('pendingInvite');
                router.push(`/join/${pendingInvite}`);
            } else {
                router.push('/');
            }
        } catch (err) {
            setError(err.message || '登录失败，请检查用户名或密码');
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
                        placeholder="用户名 (用作登录凭证)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={30}
                        autoFocus={mounted}
                        required
                    />
                </div>

                {mode === 'register' && (
                    <div className="input-group">
                        <input
                            className="input"
                            type="text"
                            placeholder="昵称 (如：小明)"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={20}
                            required
                        />
                    </div>
                )}

                <div className="input-group">
                    <input
                        className="input"
                        type="password"
                        placeholder="密码 (至少6位)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength={30}
                        required
                    />
                </div>

                {error && (
                    <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>
                )}

                <button
                    className="btn btn-primary btn-full"
                    type="submit"
                    disabled={loading || !username.trim() || !password || (mode === 'register' && !nickname.trim())}
                >
                    {loading ? '正在进入...' : (mode === 'register' ? '注册并开始使用 →' : '登录账户 →')}
                </button>

                <div className="login-mode-toggle" onClick={() => {
                    setMode(mode === 'register' ? 'login' : 'register');
                    setError('');
                }}>
                    {mode === 'register' ? '我有已有账户？直接登录' : '没有账户？立即注册'}
                </div>
            </form>
        </div>
    );
}

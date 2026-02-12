'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [nickname, setNickname] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [mode, setLoginMode] = useState('register'); // 'register' or 'token'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (mode === 'register') {
            if (!nickname.trim()) return;
            handleRegister();
        } else {
            if (!tokenInput.trim()) return;
            handleTokenLogin();
        }
    };

    const handleRegister = async () => {
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

    const handleTokenLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${tokenInput.trim()}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error('无效的令牌，请检查后重试');
            localStorage.setItem('token', tokenInput.trim());
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/');
        } catch (err) {
            setError(err.message);
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
                {mode === 'register' ? (
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
                ) : (
                    <div className="input-group">
                        <input
                            className="input"
                            type="text"
                            placeholder="粘贴你的访问令牌 (Access Token)"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                {error && (
                    <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>
                )}

                <button
                    className="btn btn-primary btn-full"
                    type="submit"
                    disabled={loading || (mode === 'register' ? !nickname.trim() : !tokenInput.trim())}
                >
                    {loading ? '正在进入...' : (mode === 'register' ? '开始使用 →' : '登录账户 →')}
                </button>

                <div className="login-mode-toggle" onClick={() => {
                    setLoginMode(mode === 'register' ? 'token' : 'register');
                    setError('');
                }}>
                    {mode === 'register' ? '我有已有账户的令牌' : '创建新账户'}
                </div>
            </form>
        </div>
    );
}

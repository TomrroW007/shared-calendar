'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JoinPage() {
    const router = useRouter();
    const params = useParams();
    const code = params.code;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [spaceName, setSpaceName] = useState('');

    useEffect(() => {
        const handleJoin = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/spaces/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ invite_code: code }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setSpaceName(data.space.name);
                // Redirect to space after short delay
                setTimeout(() => router.push(`/space/${data.space.id}`), 1500);
            } catch (err) {
                setError(err.message || '加入失败');
            } finally {
                setLoading(false);
            }
        };

        // Auto-join directly (middleware guarantees authentication)
        handleJoin();
    }, [code, router]);

    return (
        <div className="login-page">
            <div className="login-logo">🔗</div>
            {loading && (
                <>
                    <h1 className="login-title">正在加入...</h1>
                    <div className="loading-center" style={{ padding: '20px 0' }}>
                        <div className="spinner" />
                    </div>
                </>
            )}
            {spaceName && (
                <>
                    <h1 className="login-title">加入成功！</h1>
                    <p className="login-subtitle">正在进入「{spaceName}」...</p>
                </>
            )}
            {error && (
                <>
                    <h1 className="login-title" style={{ fontSize: '1.3rem' }}>加入失败</h1>
                    <p className="login-subtitle" style={{ color: '#f87171' }}>{error}</p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>
                        返回首页
                    </button>
                </>
            )}
        </div>
    );
}

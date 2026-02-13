'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PublicBookingPage() {
    const { username } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestNote, setRequestNote] = useState('');
    const [requestDate, setRequestDate] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetch(`/api/users/${username}`)
            .then(res => res.json())
            .then(d => {
                setData(data);
                if (d.user) setData(d);
            })
            .finally(() => setLoading(false));
    }, [username]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would POST to a /api/users/[username]/requests endpoint
        setSubmitted(true);
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!data) return <div className="page"><div className="container">用户不存在</div></div>;

    return (
        <div className="page" style={{ background: 'var(--bg-primary)' }}>
            <div className="container" style={{ paddingTop: '40px' }}>
                <div className="card" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div className="avatar avatar-lg" style={{ background: data.user.avatar_color, margin: '0 auto 16px', width: 80, height: 80, fontSize: '2rem' }}>
                        {data.user.nickname.charAt(0)}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>预约 {data.user.nickname}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>通过共享日历查看我的忙闲状态并预约我</p>
                </div>

                {!submitted ? (
                    <form className="card" onSubmit={handleSubmit}>
                        <h3 className="section-title">📅 发起预约</h3>
                        <div className="input-group">
                            <label>选择日期</label>
                            <input className="input" type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>想约什么？</label>
                            <textarea className="input" placeholder="简单说明事由..." value={requestNote} onChange={e => setRequestNote(e.target.value)} required />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>对方的忙碌日期参考：</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                {data.availability.slice(0, 5).map(a => (
                                    <span key={a.start} className="status-badge status-busy" style={{ fontSize: '0.65rem' }}>
                                        {a.start} 忙碌
                                    </span>
                                ))}
                                {data.availability.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--status-available)' }}>近期全天都有空</span>}
                            </div>
                        </div>

                        <button className="btn btn-primary btn-full" type="submit">发送预约请求</button>
                    </form>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
                        <h2>请求已发送</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>对方将会收到通知并与你联系。</p>
                        <button className="btn btn-secondary btn-full" style={{ marginTop: '24px' }} onClick={() => setSubmitted(false)}>再次预约</button>
                    </div>
                )}
            </div>
        </div>
    );
}

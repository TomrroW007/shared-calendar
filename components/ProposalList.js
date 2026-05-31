'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

const VOTE_OPTIONS = [
    { value: 'available', label: '✅ 可以', color: '#22c55e' },
    { value: 'unavailable', label: '❌ 不行', color: '#ef4444' },
    { value: 'maybe', label: '🤔 待定', color: '#f59e0b' },
];

export default function ProposalPage() {
    const router = useRouter();
    const params = useParams();
    const spaceId = params.id;

    const [proposals, setProposals] = useState([]);
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDates, setNewDates] = useState([]);
    const [dateInput, setDateInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState('');


    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    const fetchData = useCallback(async () => {
        try {
            const [proposalsRes, spaceRes] = await Promise.all([
                fetch(`/api/spaces/${spaceId}/proposals`),
                fetch(`/api/spaces/${spaceId}`),
            ]);
            const proposalsData = await proposalsRes.json();
            const spaceData = await spaceRes.json();
            setProposals(proposalsData.proposals || []);
            setMembers(spaceData.members || []);
        } catch { }
        setLoading(false);
    }, [spaceId]);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        fetchData();
    }, [fetchData]);

    // Expose refresh for SSE-driven real-time updates
    useEffect(() => {
        window.__refreshProposals = fetchData;
        return () => { delete window.__refreshProposals; };
    }, [fetchData]);

    const handleAddDate = () => {
        if (dateInput && !newDates.includes(dateInput)) {
            setNewDates([...newDates, dateInput].sort());
            setDateInput('');
        }
    };

    const handleRemoveDate = (d) => {
        setNewDates(newDates.filter(date => date !== d));
    };

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || newDates.length === 0) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/proposals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), candidate_dates: newDates }),
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
            setShowCreate(false);
            setNewTitle('');
            setNewDesc('');
            setNewDates([]);
            showToast('活动提案已发起！');
            fetchData();
        } catch (err) { showToast(err.message || '创建失败'); }
        setActionLoading(false);
    };

    const handleVote = async (proposalId, date, vote) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;

        // Build votes for all dates, updating the one being changed
        const existingVotes = proposal.candidate_dates.map(d => {
            const currentVote = proposal.vote_matrix?.[d]?.[currentUser?.id];
            if (d === date) return { date: d, vote };
            return currentVote ? { date: d, vote: currentVote } : null;
        }).filter(Boolean);

        // Also include the new vote if not already in list
        if (!existingVotes.find(v => v.date === date)) {
            existingVotes.push({ date, vote });
        }

        try {
            await fetch(`/api/spaces/${spaceId}/proposals/${proposalId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ votes: existingVotes }),
            });
            fetchData();
        } catch { showToast('投票失败'); }
    };

    const handleConfirm = async (proposalId, date) => {
        if (!confirm(`确认将活动定在 ${date}？`)) return;
        try {
            const res = await fetch(`/api/spaces/${spaceId}/proposals/${proposalId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
            showToast('🎉 活动已确认！');
            fetchData();
        } catch (err) { showToast(err.message || '确认失败'); }
    };

    const handleCancel = async (proposalId) => {
        if (!confirm('取消这个提案？')) return;
        try {
            await fetch(`/api/spaces/${spaceId}/proposals/${proposalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            showToast('提案已取消');
            fetchData();
        } catch { showToast('操作失败'); }
    };

    const getVoteIcon = (vote) => {
        if (vote === 'available') return '✅';
        if (vote === 'unavailable') return '❌';
        if (vote === 'maybe') return '🤔';
        return '➖';
    };

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div style={{ paddingBottom: '80px' }}>
            {proposals.length === 0 && !showCreate ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="emoji">🎯</div>
                    <p>还没有活动提案<br />发起约活动，大家投票选日期</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {proposals.map(p => (
                        <div key={p.id} className="card" style={{ padding: '16px' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</span>
                                        {p.status === 'active' && (
                                            <span className="status-badge status-available" style={{ fontSize: '0.65rem' }}>投票中</span>
                                        )}
                                        {p.status === 'confirmed' && (
                                            <span className="status-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.65rem' }}>已确认</span>
                                        )}
                                        {p.status === 'cancelled' && (
                                            <span className="status-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.65rem' }}>已取消</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {p.creator_nickname} 发起 · {p.participants?.length || 0} 人参与
                                    </div>
                                    {p.description && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.description}</div>
                                    )}
                                </div>
                            </div>

                            {p.status === 'confirmed' && (
                                <div style={{
                                    padding: '12px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                    textAlign: 'center', fontSize: '0.9rem', fontWeight: 600,
                                }}>
                                    🎉 已定在 {p.confirmed_date}
                                </div>
                            )}

                            {/* Vote Matrix */}
                            {p.status === 'active' && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem' }}>日期</th>
                                                {members.map(m => (
                                                    <th key={m.id} style={{ padding: '6px 4px', textAlign: 'center' }}>
                                                        <span className="avatar avatar-sm"
                                                            style={{ background: m.avatar_color, width: 22, height: 22, fontSize: '0.55rem', margin: '0 auto' }}
                                                        >{m.nickname?.charAt(0)}</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {p.candidate_dates.map(date => {
                                                const allAvailable = members.every(m => p.vote_matrix?.[date]?.[m.id] === 'available');
                                                return (
                                                    <tr key={date} style={{
                                                        background: allAvailable ? 'rgba(34,197,94,0.08)' : 'transparent',
                                                    }}>
                                                        <td style={{
                                                            padding: '8px', fontWeight: 500, whiteSpace: 'nowrap',
                                                            borderBottom: '1px solid var(--border-color)',
                                                        }}>
                                                            {date.slice(5)}
                                                            {allAvailable && ' 🎯'}
                                                        </td>
                                                        {members.map(m => {
                                                            const myVote = p.vote_matrix?.[date]?.[m.id];
                                                            const isMe = m.id === currentUser?.id;
                                                            return (
                                                                <td key={m.id} style={{
                                                                    padding: '4px', textAlign: 'center',
                                                                    borderBottom: '1px solid var(--border-color)',
                                                                }}>
                                                                    {isMe ? (
                                                                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                                                                            {VOTE_OPTIONS.map(opt => (
                                                                                <button key={opt.value}
                                                                                    onClick={() => handleVote(p.id, date, opt.value)}
                                                                                    style={{
                                                                                        width: '24px', height: '24px', borderRadius: '4px',
                                                                                        fontSize: '0.65rem', display: 'flex', alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        background: myVote === opt.value ? `${opt.color}22` : 'transparent',
                                                                                        border: myVote === opt.value ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                                                                                    }}
                                                                                >{opt.label.charAt(0)}</button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.9rem' }}>{getVoteIcon(myVote)}</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Confirm button for creator */}
                                    {p.creator_id === currentUser?.id && (
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                                            {p.candidate_dates.map(date => {
                                                const availCount = members.filter(m => p.vote_matrix?.[date]?.[m.id] === 'available').length;
                                                return (
                                                    <button key={date} className="btn btn-sm btn-secondary"
                                                        onClick={() => handleConfirm(p.id, date)}
                                                        style={{ fontSize: '0.75rem', flex: 1 }}
                                                    >
                                                        确认 {date.slice(5)} ({availCount}/{members.length})
                                                    </button>
                                                );
                                            })}
                                            <button className="btn btn-sm btn-danger"
                                                onClick={() => handleCancel(p.id)}
                                                style={{ fontSize: '0.75rem' }}
                                            >取消</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Button */}
            <div className="bottom-actions">
                <div className="container">
                    <button className="btn btn-primary btn-full" onClick={() => setShowCreate(true)}>
                        🎯 发起约活动
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>发起约活动</h2>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateProposal}>
                            <div className="input-group">
                                <label>活动名称</label>
                                <input className="input" placeholder="例如：周末聚餐、看电影"
                                    value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={50} autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label>说明（可选）</label>
                                <textarea className="input" placeholder="补充信息..."
                                    value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} maxLength={200}
                                />
                            </div>
                            <div className="input-group">
                                <label>候选日期（选择多个）</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="input" type="date" value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)} style={{ flex: 1 }}
                                    />
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddDate}
                                        disabled={!dateInput}>添加</button>
                                </div>
                                {newDates.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                        {newDates.map(d => (
                                            <span key={d} className="member-chip active" style={{ fontSize: '0.8rem' }}>
                                                {d.slice(5)}
                                                <button type="button" onClick={() => handleRemoveDate(d)}
                                                    style={{ marginLeft: '4px', fontSize: '0.7rem' }}>✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary btn-full"
                                disabled={actionLoading || !newTitle.trim() || newDates.length === 0}
                            >
                                {actionLoading ? '发起中...' : `发起提案（${newDates.length} 个候选日期）`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
    { value: 'vacation', label: '🏖️ 休假', className: 'status-vacation' },
    { value: 'busy', label: '💼 忙碌', className: 'status-busy' },
    { value: 'available', label: '✅ 可约', className: 'status-available' },
    { value: 'tentative', label: '❓ 待定', className: 'status-tentative' },
];

export default function EventModal({ date, event, members, currentUser, onClose, onSave, onDelete, onRSVP }) {
    // Mode logic: New event -> Edit mode; Existing event -> View mode
    const [isEditing, setIsEditing] = useState(!event?.id);

    // Roles
    const isCreator = !event?.id || event.user_id === currentUser?.id;
    const myParticipantInfo = event?.participant_details?.find(p => p.id === currentUser?.id);
    const isParticipant = !!myParticipantInfo && !isCreator;

    // Form State
    const [startDate, setStartDate] = useState(date);
    const [endDate, setEndDate] = useState(date);
    const [status, setStatus] = useState('busy');
    const [note, setNote] = useState('');
    const [visibility, setVisibility] = useState('public');

    // Smart Date Parsing
    const handleNoteChange = (e) => {
        const val = e.target.value;
        setNote(val);

        // Scan for keywords if we are in "Create/Edit" mode (isEditing)
        // Only trigger if the note is short (likely typing a quick command)
        if (isEditing && val.length < 20) {
            const now = new Date();
            let target = null;

            if (val.includes('明天')) {
                target = new Date(now); target.setDate(now.getDate() + 1);
            } else if (val.includes('后天')) {
                target = new Date(now); target.setDate(now.getDate() + 2);
            } else if (val.includes('今天')) {
                target = new Date(now);
            } else if (val.match(/周[一二三四五六日]/)) {
                const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
                const match = val.match(/周([一二三四五六日])/);
                if (match) {
                    const day = map[match[1]];
                    const currentDay = now.getDay();
                    let diff = day - currentDay;
                    if (diff <= 0) diff += 7; // Next occurrence
                    target = new Date(now); target.setDate(now.getDate() + diff);
                }
            }

            if (target) {
                const yyyy = target.getFullYear();
                const mm = String(target.getMonth() + 1).padStart(2, '0');
                const dd = String(target.getDate()).padStart(2, '0');
                const str = `${yyyy}-${mm}-${dd}`;
                // Only update if different to avoid jitter? Actually inputs are controlled.
                if (startDate !== str) {
                    setStartDate(str);
                    setEndDate(str);
                }
            }
        }
    };

    // Participants logic
    const [participantMode, setParticipantMode] = useState('none');
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // RSVP logic
    const [rsvpStatus, setRsvpStatus] = useState('pending');
    const [rsvpComment, setRsvpComment] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsEditing(!event?.id);

        if (event) {
            setStartDate(event.start_date);
            setEndDate(event.end_date);
            setStatus(event.status);
            setNote(event.note || '');
            setVisibility(event.visibility || 'public');

            // Participants
            if (event.participants && event.participants.length > 0) {
                if (event.participants.length === (members?.length || 0)) {
                    setParticipantMode('select');
                } else {
                    setParticipantMode('select');
                }
                const pIds = event.participants.map(p => typeof p === 'string' ? p : p.userId);
                setSelectedParticipants(pIds.filter(id => id !== event.user_id));
            } else {
                setParticipantMode('none');
            }

            // RSVP
            if (isParticipant && myParticipantInfo) {
                setRsvpStatus(myParticipantInfo.status);
                setRsvpComment(myParticipantInfo.comment || '');
            }
        }
    }, [event, isParticipant, myParticipantInfo, members]);

    const displayStartDate = event?.start_date || startDate;
    const displayEndDate = event?.end_date || endDate;

    const buildParticipants = () => {
        if (participantMode === 'all') return members.map(m => m.id);
        if (participantMode === 'select') return [...selectedParticipants, currentUser.id];
        return [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                start_date: startDate,
                end_date: endDate || startDate,
                status,
                note,
                visibility,
                participants: buildParticipants(),
            });
            setIsEditing(false); // Switch to view mode after save? Or close? SpacePage closes modal usually.
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (newStatus) => {
        setLoading(true);
        try {
            await onRSVP(event.id, { status: newStatus, comment: rsvpComment });
            setRsvpStatus(newStatus);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定删除？')) return;
        setLoading(true);
        try { await onDelete(event.id); } finally { setLoading(false); }
    };

    const toggleParticipant = (uid) => {
        setSelectedParticipants(prev =>
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const otherMembers = (members || []).filter(m => m.id !== currentUser?.id);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {event?.id ? (isEditing ? '编辑活动' : '活动详情') : '发起活动'}
                        {!isEditing && isCreator && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)} style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                                ✏️ 编辑
                            </button>
                        )}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {isEditing ? (
                    // EDIT MODE
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label>开始日期</label>
                                <input className="input" type="date" value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }}
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label>结束日期</label>
                                <input className="input" type="date" value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)} min={startDate}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>我的状态</label>
                            <div className="select-group">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button key={opt.value} type="button"
                                        className={`select-option${status === opt.value ? ' active' : ''}`}
                                        onClick={() => setStatus(opt.value)}
                                    >{opt.label}</button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>活动内容 / 备注</label>
                            <textarea className="input" placeholder="例如：明天聚餐、周五会议..."
                                value={note} onChange={handleNoteChange} maxLength={100} rows={2}
                            />
                        </div>

                        <div className="input-group">
                            <label>👥 邀请参与者</label>
                            <div className="select-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <button type="button" className={`select-option${participantMode === 'none' ? ' active' : ''}`}
                                    onClick={() => setParticipantMode('none')} style={{ fontSize: '0.78rem' }}>👤 仅自己</button>
                                <button type="button" className={`select-option${participantMode === 'all' ? ' active' : ''}`}
                                    onClick={() => setParticipantMode('all')} style={{ fontSize: '0.78rem' }}>📢 所有人</button>
                                <button type="button" className={`select-option${participantMode === 'select' ? ' active' : ''}`}
                                    onClick={() => setParticipantMode('select')} style={{ fontSize: '0.78rem' }}>✅ 指定人</button>
                            </div>
                            {participantMode === 'select' && otherMembers.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                    {otherMembers.map(m => (
                                        <button key={m.id} type="button"
                                            className={`member-chip${selectedParticipants.includes(m.id) ? ' active' : ''}`}
                                            onClick={() => toggleParticipant(m.id)}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <span className="avatar avatar-sm" style={{ background: m.avatar_color, width: 16, height: 16, fontSize: '0.5rem' }}>{m.nickname?.charAt(0)}</span>
                                            {m.nickname}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            {event?.id && (
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading} style={{ flex: 1 }}>删除</button>
                            )}
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                                {loading ? '保存中...' : event?.id ? '更新' : '发起'}
                            </button>
                        </div>
                    </form>
                ) : event ? (
                    // VIEW MODE (Read Only + RSVP)
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                📅 {displayStartDate} {displayStartDate !== displayEndDate ? `~ ${displayEndDate}` : ''}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                {event.note || '无主题'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="event-creator-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '12px' }}>
                                    <span className="avatar avatar-sm" style={{ background: event.avatar_color, width: 20, height: 20 }}>
                                        {event.nickname?.charAt(0)}
                                    </span>
                                    <span>{event.nickname} 发起</span>
                                </div>
                                <span className={`status-badge status-${event.status}`}>
                                    {STATUS_OPTIONS.find(o => o.value === event.status)?.label}
                                </span>
                            </div>
                        </div>

                        {/* RSVP Section (For Participants) */}
                        {isParticipant && (
                            <div className="card" style={{ padding: '16px', background: 'var(--bg-hover)', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>你的回复</h3>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>

                                    <button className={`btn btn-sm ${rsvpStatus === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRSVP('accepted')} disabled={loading} style={{ flex: 1 }}>✅ 参加</button>

                                    <button className={`btn btn-sm ${rsvpStatus === 'declined' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRSVP('declined')} disabled={loading} style={{ flex: 1, borderColor: rsvpStatus === 'declined' ? 'var(--status-busy)' : '' }}>❌ 拒绝</button>

                                    <button className={`btn btn-sm ${rsvpStatus === 'tentative' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRSVP('tentative')} disabled={loading} style={{ flex: 1 }}>⏳ 待定</button>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <input className="input" placeholder="留言（可选）..." value={rsvpComment}
                                        onChange={(e) => setRsvpComment(e.target.value)}
                                        onBlur={() => { if (rsvpStatus !== 'pending') handleRSVP(rsvpStatus); }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Participants List */}
                        <div>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>参与者 ({event.participant_details?.length || 0})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {event.participant_details?.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="avatar avatar-sm" style={{ background: p.avatar_color }}>{p.nickname.charAt(0)}</span>
                                            <span>{p.nickname}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {p.status === 'accepted' && <span style={{ color: 'var(--status-available)', fontWeight: 'bold' }}>✅ 参加</span>}
                                            {p.status === 'declined' && <span style={{ color: 'var(--status-busy)', fontWeight: 'bold' }}>❌ 拒绝</span>}
                                            {p.status === 'tentative' && <span style={{ color: 'var(--status-tentative)', fontWeight: 'bold' }}>⏳ 待定</span>}
                                            {p.status === 'pending' && <span style={{ color: 'var(--text-muted)' }}>❓ 未回</span>}
                                            {p.comment && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>&quot;{p.comment}&quot;</span>}
                                        </div>
                                    </div>
                                ))}
                                {(!event.participant_details || event.participant_details.length === 0) && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>无参与者</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>活动数据加载中...</div>
                )}
            </div>
        </div>
    );
}

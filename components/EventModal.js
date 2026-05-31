'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = [
    { value: 'vacation', label: '🏖️ 休假', className: 'status-vacation' },
    { value: 'busy', label: '💼 忙碌', className: 'status-busy' },
    { value: 'available', label: '✅ 可约', className: 'status-available' },
    { value: 'tentative', label: '❓ 待定', className: 'status-tentative' },
    { value: 'ghost', label: '👻 想去(Ghost)', className: 'status-ghost' },
];

const RECURRENCE_OPTIONS = [
    { value: 'none', label: '不重复' },
    { value: 'daily', label: '每天' },
    { value: 'weekly', label: '每周' },
    { value: 'monthly', label: '每月' },
];

const VIBE_EMOJIS = ['🏃', '🍕', '🎮', '💼', '✈️', '😴', '💪', '🍺', '📚', '🏠', '🔥'];

import { parseQuickAddCommand } from '@/lib/nlp';

export default function EventModal({ date, event, events = [], members, currentUser, onClose, onSave, onDelete, onRSVP }) {
    // Mode logic: New event -> Edit mode; Existing event -> View mode
    const [isEditing, setIsEditing] = useState(!event?.id);
    const [activeTab, setActiveTab] = useState('details');
    const [nlpInput, setNlpInput] = useState('');

    const handleNlpParse = () => {
        if (!nlpInput.trim()) return;
        const result = parseQuickAddCommand(nlpInput);
        if (result.date) {
            setStartDate(result.date);
            setEndDate(result.date);
        }
        if (result.title) setNote(result.title); // Using note as title for now
        // Location support can be added to model later
        setNlpInput('');
    };

    // Form State
    const [startDate, setStartDate] = useState(date);
    const [endDate, setEndDate] = useState(date);
    const [status, setStatus] = useState('busy');
    const [note, setNote] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [recurrence, setRecurrence] = useState('none');

    // Vibe State
    const [vibeEmoji, setVibeEmoji] = useState('');
    const [vibeText, setVibeText] = useState('');

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
                if (startDate !== str) {
                    setStartDate(str);
                    setEndDate(str);
                }
            }
        }
    };

    // Conflict Detection (Client-side)
    const [conflictInfo, setConflictInfo] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommend, setLoadingRecommend] = useState(false);

    const fetchRecommendations = async () => {
        // We need spaceId here. 
        // In the current props it is not passed, but we can extract from URL if needed 
        // or just pass it down. 
        const spaceId = window.location.pathname.split('/').pop();
        if (!spaceId) return;

        setLoadingRecommend(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/recommend`);
            const data = await res.json();
            setRecommendations(data.recommendations || []);
        } catch (e) { console.error(e); }
        setLoadingRecommend(false);
    };

    useEffect(() => {
        if (!isEditing || !startDate) {
            setConflictInfo(null);
            return;
        }
        
        // Find if user has another 'busy' event on these dates
        const myBusyEvents = events.filter(e => 
            e.user_id === currentUser?.id && 
            e.id !== event?.id &&
            (e.status === 'busy' || e.status === 'vacation')
        );

        const currentEnd = endDate || startDate;
        const conflict = myBusyEvents.find(e => 
            e.start_date <= currentEnd && e.end_date >= startDate
        );

        if (conflict && (status === 'busy' || status === 'vacation')) {
            setConflictInfo(`⚠️ 此时段已有安排: ${conflict.note || conflict.status}`);
        } else {
            setConflictInfo(null);
        }
    }, [startDate, endDate, status, events, currentUser, event?.id, isEditing]);

    useEffect(() => {
        const myMember = members.find(m => m.id === currentUser?.id);
        const existingVibe = myMember?.daily_statuses?.[date] || myMember?.daily_statuses?.get?.(date);
        if (existingVibe) {
            setVibeEmoji(existingVibe.emoji || '');
            setVibeText(existingVibe.text || '');
        } else {
            setVibeEmoji('');
            setVibeText('');
        }
    }, [date, members, currentUser]);

    const handleSaveVibe = async (emoji, text) => {
        try {
            await fetch('/api/users/me/status', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: startDate, emoji, text })
            });
        } catch (e) { console.error(e); }
    };

    // Roles
    const isCreator = !event?.id || event.user_id === currentUser?.id;
    const myParticipantInfo = event?.participant_details?.find(p => p.id === currentUser?.id);
    const isParticipant = !!myParticipantInfo && !isCreator;

    // Participants logic
    const [participantMode, setParticipantMode] = useState('none');
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // RSVP logic
    const [rsvpStatus, setRsvpStatus] = useState('pending');
    const [rsvpComment, setRsvpComment] = useState('');

    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const fetchComments = useCallback(async () => {
        if (!event?.id) return;
        try {
            const res = await fetch(`/api/comments?relatedId=${event.id}`);
            const data = await res.json();
            setComments(data.comments || []);
        } catch (e) { console.error(e); }
    }, [event?.id]);

    useEffect(() => {
        setIsEditing(!event?.id);
        setActiveTab('details');

        if (event) {
            setStartDate(event.start_date);
            setEndDate(event.end_date);
            setStatus(event.status);
            setNote(event.note || '');
            setVisibility(event.visibility || 'public');
            setRecurrence(event.recurrence_rule ? 
                (event.recurrence_rule.includes('DAILY') ? 'daily' : 
                 event.recurrence_rule.includes('WEEKLY') ? 'weekly' : 
                 event.recurrence_rule.includes('MONTHLY') ? 'monthly' : 'none') 
                : 'none');
            fetchComments();

            // Participants
            if (event.participants && event.participants.length > 0) {
                if (event.participants.length === (members?.length || 0)) {
                    setParticipantMode('all');
                } else {
                    setParticipantMode('select');
                }
                const pIds = event.participants.map(p => typeof p === 'string' ? p : p.userId);
                setSelectedParticipants(pIds.filter(id => id !== event.user_id));
            } else {
                setParticipantMode('none');
                setSelectedParticipants([]);
            }

            // RSVP
            if (isParticipant && myParticipantInfo) {
                setRsvpStatus(myParticipantInfo.status);
                setRsvpComment(myParticipantInfo.comment || '');
            } else {
                setRsvpStatus('pending');
                setRsvpComment('');
            }
            return;
        }

        setStartDate(date);
        setEndDate(date);
        setStatus('busy');
        setNote('');
        setVisibility('public');
        setRecurrence('none');
        setParticipantMode('none');
        setSelectedParticipants([]);
        setRsvpStatus('pending');
        setRsvpComment('');
        setComments([]);
    }, [date, event, isParticipant, myParticipantInfo, members, fetchComments]);

    const handleSendComment = async () => {
        if (!newComment.trim() || !event?.id) return;
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ relatedId: event.id, content: newComment.trim() })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (e) { console.error(e); }
    };

    const displayStartDate = event?.start_date || startDate;
    const displayEndDate = event?.end_date || endDate;

    const buildParticipants = () => {
        if (participantMode === 'all') return (members || []).map(m => m.id);
        if (participantMode === 'select') {
            const base = selectedParticipants || [];
            if (!currentUser?.id) return base;
            return base.includes(currentUser.id) ? base : [...base, currentUser.id];
        }
        return [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Map simple recurrence to RRule
            let recurrenceRule = null;
            if (recurrence === 'daily') recurrenceRule = 'FREQ=DAILY';
            if (recurrence === 'weekly') recurrenceRule = 'FREQ=WEEKLY';
            if (recurrence === 'monthly') recurrenceRule = 'FREQ=MONTHLY';

            await onSave({
                start_date: startDate,
                end_date: endDate || startDate,
                status,
                note,
                visibility,
                recurrence_rule: recurrenceRule,
                participants: buildParticipants(),
            });
            if (event?.id) {
                setIsEditing(false);
            }
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

    const handleInterest = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/spaces/${window.location.pathname.split('/').pop()}/events/${event.id}/interest`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                // Optimistic update logic would be here or rely on parent refresh
                onClose(); // Close for now or refresh
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const isGhost = event?.status === 'ghost';
    const amInterested = event?.interested_users?.includes(currentUser?.id);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ marginBottom: '12px' }}>
                    <h2>
                        {event?.id ? (isEditing ? '编辑活动' : (isGhost ? '👻 意向详情' : '活动详情')) : '发起活动'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Tab Navigation */}
                {event?.id && (
                    <div className="modal-tabs">
                        <button className={`modal-tab${activeTab === 'details' ? ' active' : ''}`}
                            onClick={() => setActiveTab('details')}>详情</button>
                        <button className={`modal-tab${activeTab === 'comments' ? ' active' : ''}`}
                            onClick={() => setActiveTab('comments')}>
                            讨论 {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
                        </button>
                    </div>
                )}

                {/* NLP Quick Add (New Event Only) */}
                {isEditing && !event?.id && activeTab === 'details' && (
                    <div className="input-group" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                className="input" 
                                style={{ background: 'rgba(124, 58, 237, 0.05)', borderColor: 'var(--accent-solid)' }}
                                placeholder="✨ 试试：明晚7点在老地方聚餐" 
                                value={nlpInput} 
                                onChange={(e) => setNlpInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNlpParse()}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleNlpParse}>识别</button>
                        </div>
                    </div>
                )}

                {activeTab === 'details' ? (
                    <>
                        {/* Smart Recommendations */}
                        {!event?.id && (
                            <div className="recommend-area">
                                <button type="button" className="recommend-badge" onClick={fetchRecommendations} disabled={loadingRecommend}>
                                    {loadingRecommend ? '正在计算...' : '⚡️ 推荐空闲时间 (未来7天)'}
                                </button>
                                {recommendations.length > 0 && (
                                    <div className="recommend-list">
                                        {recommendations.map(r => {
                                            const tooltip = [
                                                r.hypeMembers?.length > 0 ? `🔥 Hype: ${r.hypeMembers.join(', ')}` : '',
                                                r.openMembers?.length > 0 ? `☕ Open: ${r.openMembers.join(', ')}` : '',
                                                r.lowMembers?.length > 0 ? `🔋 Low: ${r.lowMembers.join(', ')}` : ''
                                            ].filter(Boolean).join(' | ');

                                            return (
                                                <div key={r.date} className="recommend-item" title={tooltip} onClick={() => { setStartDate(r.date); setEndDate(r.date); }}>
                                                    <span style={{ fontWeight: 700 }}>{r.date.slice(5)}</span>
                                                    <span style={{ marginLeft: '6px', color: 'var(--status-available)' }}>{r.freeCount}/{r.totalCount} 有空</span>
                                                    {r.hypeMembers?.length > 0 && <span style={{ marginLeft: '4px' }}>🔥</span>}
                                                    {r.lowMembers?.length > 0 && <span style={{ marginLeft: '4px' }}>🔋</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Daily Vibe Picker (Social) - Only in Edit Mode or for New Events */}
                        {(isEditing || !event?.id) && (
                            <div className="card" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(124, 58, 237, 0.05)' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-solid)', marginBottom: '8px', textTransform: 'uppercase' }}>✨ 我的今日动态</div>
                                <div className="vibe-picker">
                                    <button className={`vibe-emoji-btn${!vibeEmoji ? ' active' : ''}`} onClick={() => { setVibeEmoji(''); handleSaveVibe('', vibeText); }}>🚫</button>
                                    {VIBE_EMOJIS.map(e => (
                                        <button key={e} className={`vibe-emoji-btn${vibeEmoji === e ? ' active' : ''}`}
                                            onClick={() => { setVibeEmoji(e); handleSaveVibe(e, vibeText); }}>{e}</button>
                                    ))}
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <input className="input" placeholder="加句短语？(如: 开启休假, 健身中...)" 
                                        value={vibeText} onChange={(e) => setVibeText(e.target.value)}
                                        onBlur={() => handleSaveVibe(vibeEmoji, vibeText)}
                                        style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                                    />
                                </div>
                            </div>
                        )}

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

                                {conflictInfo && (
                                    <div style={{ color: 'var(--status-vacation)', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 600 }}>
                                        {conflictInfo}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>重复规则</label>
                                        <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                                            {RECURRENCE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>我的状态</label>
                                        <select className={`input status-${status}`} value={status} onChange={(e) => setStatus(e.target.value)}>
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
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
                                        {event.recurrence_rule && <span style={{ marginLeft: '8px', color: 'var(--accent-solid)' }}>↻ 循环</span>}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                        {getEmojiForNote(event.note)}{event.note || '无主题'}
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
                                        {isCreator && (
                                            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                                                ✏️ 编辑
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Ghost Mode Interest Interaction */}
                                {isGhost ? (
                                    <div className="card" style={{ padding: '16px', background: 'var(--bg-hover)', marginBottom: '20px', textAlign: 'center' }}>
                                        <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            这是一个“幽灵意向”活动。如果你也想去，点击下方按钮。
                                        </div>
                                        <button 
                                            className={`ghost-interest-btn${amInterested ? ' active' : ''}`} 
                                            onClick={handleInterest}
                                            style={{ margin: '0 auto', width: 'fit-content' }}
                                            disabled={loading}
                                        >
                                            {amInterested ? '👻 已感兴趣' : '👻 我感兴趣'}
                                            <span>{event.interested_users?.length || 0}</span>
                                        </button>
                                    </div>
                                ) : (
                                    /* RSVP Section (For Participants) - Normal Events */
                                    isParticipant && (
                                        <div className="card" style={{ padding: '16px', background: 'var(--bg-hover)', marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>你的回复</h3>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                <button className={`btn btn-sm ${rsvpStatus === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => handleRSVP('accepted')} disabled={loading} style={{ flex: 1 }}>✅ 参加</button>
                                                <button className={`btn btn-sm ${rsvpStatus === 'declined' ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => handleRSVP('declined')} disabled={loading} style={{ flex: 1 }}>❌ 拒绝</button>
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
                                    )
                                )}

                                {/* Participants List */}
                                <div style={{ marginBottom: '20px' }}>
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
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>活动数据加载中...</div>
                        )}
                    </>
                ) : (
                    /* DISCUSSION TAB */
                    <div className="comment-tab-content">
                        <div className="comment-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {comments.map(c => (
                                <div key={c._id} className="comment-item">
                                    <span className="avatar avatar-sm" style={{ background: c.user_id.avatar_color }}>
                                        {c.user_id.nickname.charAt(0)}
                                    </span>
                                    <div className="comment-bubble">
                                        <div className="comment-meta">
                                            <span className="comment-author">{c.user_id.nickname}</span>
                                            <span className="comment-time">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="comment-text">{c.content}</div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>还没有讨论，发一条吧</p>
                            )}
                        </div>
                        <div className="comment-input-area">
                            <input className="comment-input" placeholder="说点什么..." 
                                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            />
                            <button className="comment-send-btn" onClick={handleSendComment}>🚀</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

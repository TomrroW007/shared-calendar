'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import NotificationBell from '@/components/NotificationBell';
import ProposalList from '@/components/ProposalList';
import UpcomingEvents from '@/components/UpcomingEvents';
import FAB from '@/components/FAB';
import SpaceWiki from '@/components/SpaceWiki';
import { useSSE, requestNotificationPermission } from '@/components/useSSE';

const STATUS_LABELS = {
    vacation: '🏖️ 休假',
    busy: '💼 忙碌',
    available: '✅ 可约',
    tentative: '❓ 待定',
};

const STATUS_CLASS = {
    vacation: 'status-vacation',
    busy: 'status-busy',
    available: 'status-available',
    tentative: 'status-tentative',
};

export default function SpacePage() {
    const router = useRouter();
    const params = useParams();
    const spaceId = params.id;

    const [space, setSpace] = useState(null);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const [selectedUserIds, setSelectedUserIds] = useState([]); // Array for multi-select
    const [selectedDate, setSelectedDate] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showWiki, setShowWiki] = useState(false);
    const [showFreeOnly, setShowFreeOnly] = useState(false);
    const [toast, setToast] = useState('');
    const [activeTab, setActiveTab] = useState('calendar');
    const [calendarMode, setCalendarMode] = useState('month'); // 'month' or 'agenda'

    const getToken = () => localStorage.getItem('token');

    const toggleUserFilter = (uid) => {
        setSelectedUserIds(prev => {
            if (prev.includes(uid)) return prev.filter(id => id !== uid);
            return [...prev, uid];
        });
    };

    const getEmojiForNote = (note = '') => {
        const text = note.toLowerCase();
        if (text.includes('餐') || text.includes('饭') || text.includes('eat')) return '🍴 ';
        if (text.includes('会') || text.includes('meet')) return '💻 ';
        if (text.includes('玩') || text.includes('戏') || text.includes('game')) return '🎮 ';
        if (text.includes('运') || text.includes('健身') || text.includes('sport')) return '🏃 ';
        if (text.includes('旅') || text.includes('游') || text.includes('trip')) return '✈️ ';
        if (text.includes('生') || text.includes('party')) return '🎂 ';
        return '';
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const fetchSpace = useCallback(async () => {
        try {
            const res = await fetch(`/api/spaces/${spaceId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.status === 401) { router.push('/login'); return; }
            if (res.status === 403) { router.push('/'); return; }
            const data = await res.json();
            setSpace(data.space);
            setMembers(data.members);
        } catch {
            router.push('/');
        }
    }, [spaceId, router]);

    const fetchEvents = useCallback(async () => {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        try {
            const res = await fetch(`/api/spaces/${spaceId}/events?month=${monthStr}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = await res.json();
            setEvents(data.events || []);
        } catch { }
    }, [spaceId, year, month]);

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const savedUser = localStorage.getItem('user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        fetchSpace().then(() => setLoading(false));
        // Request browser notification permission
        requestNotificationPermission();
    }, [fetchSpace, router]);

    useEffect(() => {
        if (!loading) fetchEvents();
    }, [fetchEvents, loading]);

    // Real-time sync: Update editingEvent when events change
    useEffect(() => {
        if (editingEvent && events.length > 0) {
            const current = events.find(e => e.id === editingEvent.id);
            if (current) {
                // Only update if content changed to avoid loop? 
                // Simple equality check or just set it.
                // JSON.stringify check to avoid infinite re-render loop if object ref changes but content same
                if (JSON.stringify(current) !== JSON.stringify(editingEvent)) {
                    setEditingEvent(current);
                }
            } else {
                // Event deleted? Keep modal open or close?
                // Maybe keep it but show deleted status? Or close.
                // For now, let's not auto-close to avoid confusion if it's network jitter.
            }
        }
    }, [events, editingEvent]);

    // SSE: real-time updates
    const handleSSEEvent = useCallback((type, data) => {
        if (type === 'notification') {
            // Refresh notification bell
            window.__refreshNotifications?.();
        }

        if (type === 'event_created') {
            if (data?.event) {
                setEvents((prev) => {
                    if (prev.some((e) => e.id === data.event.id)) return prev;
                    return [...prev, data.event];
                });
            } else {
                fetchEvents();
            }
        }

        if (type === 'event_updated') {
            if (data?.event) {
                setEvents((prev) => prev.map((e) => (e.id === data.event.id ? { ...e, ...data.event } : e)));
            } else {
                fetchEvents();
            }
        }

        if (type === 'event_deleted') {
            if (data?.eventId) {
                setEvents((prev) => prev.filter((e) => e.id !== data.eventId));
            } else {
                fetchEvents();
            }
        }

        if (type === 'proposal_created' || type === 'proposal_confirmed' || type === 'proposal_voted' || type === 'proposal_cancelled') {
            // ProposalList will handle its own refresh, but let's trigger it
            window.__refreshProposals?.();
        }
    }, [fetchEvents]);

    useSSE(handleSSEEvent);

    const handlePrevMonth = useCallback(() => {
        if (month === 0) { setYear(year - 1); setMonth(11); }
        else setMonth(month - 1);
    }, [month, year]);

    const handleNextMonth = useCallback(() => {
        if (month === 11) { setYear(year + 1); setMonth(0); }
        else setMonth(month + 1);
    }, [month, year]);

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        const myEvent = events.find(
            (e) => e.user_id === currentUser?.id && e.start_date <= dateStr && e.end_date >= dateStr
        );
        if (myEvent) {
            setEditingEvent(myEvent);
        } else {
            setEditingEvent(null);
        }
        setShowModal(true);
    };

    const handleSaveEvent = async (data) => {
        const token = getToken();
        try {
            if (editingEvent) {
                const previousEvent = events.find((e) => e.id === editingEvent.id);
                const optimisticUpdatedEvent = { ...editingEvent, ...data };
                setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? optimisticUpdatedEvent : e)));

                const res = await fetch(`/api/spaces/${spaceId}/events/${editingEvent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    const err = await res.json();
                    setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? previousEvent : e)));
                    throw new Error(err.error);
                }

                const result = await res.json();
                if (result?.event) {
                    setEvents((prev) => prev.map((e) => (e.id === result.event.id ? { ...e, ...result.event } : e)));
                }
                showToast('已更新');
            } else {
                // Optimistic UI: immediately show the event on calendar
                const tempId = `temp-${Date.now()}`;
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const optimisticEvent = {
                    id: tempId,
                    user_id: currentUser?.id,
                    nickname: savedUser.nickname || '我',
                    avatar_color: savedUser.avatar_color || '#666',
                    start_date: data.start_date,
                    end_date: data.end_date || data.start_date,
                    status: data.status,
                    note: data.note,
                    visibility: data.visibility,
                    participants: data.participants || [],
                    participant_details: [],
                };
                setEvents((prev) => [...prev, optimisticEvent]);

                const res = await fetch(`/api/spaces/${spaceId}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(data),
                });
                if (!res.ok) {
                    // Rollback optimistic update
                    setEvents((prev) => prev.filter((e) => e.id !== tempId));
                    const err = await res.json();
                    throw new Error(err.error);
                }

                const result = await res.json();
                if (result?.event) {
                    setEvents((prev) => prev.map((e) => (e.id === tempId ? result.event : e)));
                }
                showToast(data.participants?.length > 0 ? '已标记并通知' : '已标记');
            }
            setShowModal(false);
        } catch (err) {
            showToast(err.message || '操作失败');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        // Optimistic UI: immediately remove the event from state
        const previousEvents = [...events];
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setShowModal(false);

        try {
            const res = await fetch(`/api/spaces/${spaceId}/events/${eventId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) {
                // Rollback on failure
                setEvents(previousEvents);
                const err = await res.json();
                throw new Error(err.error);
            }
            showToast('已删除');
            fetchEvents();
        } catch (err) {
            showToast(err.message || '删除失败');
        }
    };

    const getFreeDays = () => {
        if (members.length <= 1) return [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const freeDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const busyUsers = new Set(
                events
                    .filter((e) => e.start_date <= dateStr && e.end_date >= dateStr &&
                        (e.status === 'busy' || e.status === 'vacation'))
                    .map((e) => e.user_id)
            );
            if (busyUsers.size === 0) freeDays.push(dateStr);
        }
        return freeDays;
    };

    const getDateEvents = (dateStr) => {
        return events.filter((e) => e.start_date <= dateStr && e.end_date >= dateStr);
    };

    // New Handlers for V2.1
    const handleRSVP = async (eventId, { status, comment }) => {
        try {
            const res = await fetch(`/api/spaces/${spaceId}/events/${eventId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ status, comment }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            showToast('回复已提交');
            fetchEvents();
        } catch (err) {
            showToast(err.message || '操作失败');
            throw err;
        }
    };

    const handleNotificationClick = async (n) => {
        if (n.type.startsWith('event_') || n.type === 'invitation' || n.type === 'mention' || n.type === 'rsvp') {
            try {
                const res = await fetch(`/api/spaces/${spaceId}/events/${n.related_id || n.relatedId}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setEditingEvent(data.event);
                    setShowModal(true);
                    setActiveTab('calendar');
                } else {
                    showToast('该活动可能已被删除');
                }
            } catch {
                showToast('无法加载活动详情');
            }
        } else if (n.type.startsWith('proposal_')) {
            setActiveTab('proposals');
        }
    };

    // Keyboard shortcuts (must be before early return to follow React Hooks rules)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore when typing in input/textarea
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

            switch (e.key.toLowerCase()) {
                case 't': {
                    const now = new Date();
                    setYear(now.getFullYear());
                    setMonth(now.getMonth());
                    break;
                }
                case 'j':
                    handlePrevMonth();
                    break;
                case 'k':
                    handleNextMonth();
                    break;
                case 'escape':
                    if (showModal) {
                        setShowModal(false);
                        setEditingEvent(null);
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, handlePrevMonth, handleNextMonth]);

    if (loading) {
        return (
            <div className="page">
                <div className="loading-center"><div className="spinner" /></div>
            </div>
        );
    }

    const freeDays = getFreeDays();
    const dateEvents = selectedDate ? getDateEvents(selectedDate) : [];

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <Link href="/" className="back-btn">←</Link>
                    <div style={{ flex: 1 }}>
                        <h1>{space?.name}</h1>
                        <p className="subtitle">{members.length} 位成员</p>
                    </div>
                    <NotificationBell onItemClick={handleNotificationClick} />
                    <Link href={`/space/${spaceId}/settings`} className="back-btn" style={{ fontSize: '1rem', marginLeft: '4px' }}>
                        ⚙️
                    </Link>
                </div>

                {/* Tab Bar */}
                <div className="tab-bar">
                    <button
                        className={`tab-item${activeTab === 'calendar' ? ' active' : ''}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        📅 日历
                    </button>
                    <button
                        className={`tab-item${activeTab === 'proposals' ? ' active' : ''}`}
                        onClick={() => setActiveTab('proposals')}
                    >
                        🎯 约活动
                    </button>
                </div>

                {activeTab === 'calendar' ? (
                    <>
                        {/* Space Memo / Announcement */}
                        {space?.memo && (
                            <div className="card space-memo" style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(124, 58, 237, 0.05)', borderStyle: 'dashed' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-solid)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>📌 空间公告</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{space.memo}</div>
                            </div>
                        )}

                        {/* Members filter bar */}
                        <div className="members-bar">
                            <button
                                className={`member-chip${selectedUserIds.length === 0 ? ' active' : ''}`}
                                onClick={() => setSelectedUserIds([])}
                            >
                                👥 所有人
                            </button>
                            {members.map((m) => (
                                <button
                                    key={m.id}
                                    className={`member-chip${selectedUserIds.includes(m.id) ? ' active' : ''}`}
                                    onClick={() => toggleUserFilter(m.id)}
                                >
                                    <span
                                        className="avatar avatar-sm"
                                        style={{ background: m.avatar_color, width: 18, height: 18, fontSize: '0.55rem' }}
                                    >
                                        {m.nickname?.charAt(0)}
                                    </span>
                                    {m.nickname}
                                </button>
                            ))}
                        </div>

                        {/* View Switcher & Toolbox */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div className="space-toolbox">
                                <button className="tool-btn" title="空间文件" onClick={() => showToast('文件柜功能即将上线...')}>📁</button>
                                <button className="tool-btn" title="空间Wiki" onClick={() => setShowWiki(true)}>📝</button>
                            </div>
                            <div className="select-group" style={{ gridTemplateColumns: 'repeat(2, 80px)', gap: '4px' }}>
                                <button className={`select-option btn-sm ${calendarMode === 'month' ? 'active' : ''}`}
                                    onClick={() => setCalendarMode('month')} style={{ padding: '4px' }}>月历</button>
                                <button className={`select-option btn-sm ${calendarMode === 'agenda' ? 'active' : ''}`}
                                    onClick={() => setCalendarMode('agenda')} style={{ padding: '4px' }}>议程</button>
                            </div>
                        </div>

                        {/* Upcoming Events Dashboard */}
                        {calendarMode === 'month' && (
                            <UpcomingEvents
                                events={events}
                                onEventClick={(evt) => { setEditingEvent(evt); setShowModal(true); }}
                            />
                        )}

                        {/* Calendar / Agenda */}
                        {calendarMode === 'month' ? (
                            <Calendar
                                year={year}
                                month={month}
                                events={events}
                                selectedUserIds={selectedUserIds}
                                members={members}
                                currentUser={currentUser}
                                onDateClick={handleDateClick}
                                onPrev={handlePrevMonth}
                                onNext={handleNextMonth}
                            />
                        ) : (
                            <div className="agenda-view">
                                {events.filter(e => selectedUserIds.length === 0 || selectedUserIds.includes(e.user_id))
                                    .sort((a, b) => a.start_date.localeCompare(b.start_date))
                                    .map(evt => (
                                        <div key={evt.id} className="event-item" onClick={() => { setEditingEvent(evt); setShowModal(true); }}>
                                            <div style={{ minWidth: '50px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{evt.start_date.slice(5, 7)}月</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{evt.start_date.slice(8)}</div>
                                            </div>
                                            <div style={{ width: '3px', alignSelf: 'stretch', background: STATUS_CLASS[evt.status] === 'status-busy' ? 'var(--status-busy)' : 'var(--status-available)', borderRadius: '2px' }} />
                                            <div className="event-item-info">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className="name">{getEmojiForNote(evt.note)}{evt.note || '无主题'}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.nickname} · {STATUS_LABELS[evt.status]}</div>
                                            </div>
                                        </div>
                                    ))}
                                {events.length === 0 && <div className="empty-state">本月暂无安排</div>}
                            </div>
                        )}

                        {/* Day detail */}
                        {selectedDate && !showModal && dateEvents.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {selectedDate} 的安排
                                </h3>
                                <div className="event-list">
                                    {dateEvents.map((evt) => (
                                        <div
                                            key={evt.id}
                                            className="event-item"
                                            onClick={() => { setEditingEvent(evt); setShowModal(true); }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="avatar avatar-sm" style={{ background: evt.avatar_color, marginTop: '2px' }}>
                                                {evt.nickname?.charAt(0)}
                                            </span>
                                            <div className="event-item-info">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    <span className="name">{evt.nickname}</span>
                                                    <span className={`status-badge ${STATUS_CLASS[evt.status]}`}>
                                                        {STATUS_LABELS[evt.status]}
                                                    </span>
                                                    {evt.participants?.length > 0 && (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            👥{evt.participant_details?.length || evt.participants.length}
                                                        </span>
                                                    )}
                                                </div>
                                                {evt.note && <div className="note">{evt.note}</div>}
                                                {evt.start_date !== evt.end_date && (
                                                    <div className="note">{evt.start_date} ~ {evt.end_date}</div>
                                                )}
                                            </div>
                                            <div className="event-item-actions">
                                                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>›</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <ProposalList />
                )}
            </div>

            {/* Floating Action Button */}
            <FAB onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setEditingEvent(null); setShowModal(true); }} />

            {/* Event Modal */}
            {showModal && (
                <EventModal
                    date={selectedDate}
                    event={editingEvent}
                    events={events} // Pass all events for conflict detection
                    members={members}
                    currentUser={currentUser}
                    onClose={() => { setShowModal(false); setEditingEvent(null); }}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onRSVP={handleRSVP}
                />
            )}

            {/* Space Wiki Modal */}
            {showWiki && (
                <SpaceWiki 
                    spaceId={spaceId} 
                    onClose={() => setShowWiki(false)} 
                />
            )}

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}

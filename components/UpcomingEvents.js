'use client';

import { useMemo } from 'react';

export default function UpcomingEvents({ events, onEventClick }) {
    const upcoming = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const end = new Date(today);
        end.setDate(today.getDate() + 3); // Future 3 days

        return events
            .filter(e => {
                const start = new Date(e.start_date);
                const endE = new Date(e.end_date);
                // Check overlap with [today, end]
                return start <= end && endE >= today;
            })
            .sort((a, b) => a.start_date.localeCompare(b.start_date));
    }, [events]);

    if (upcoming.length === 0) {
        return (
            <div className="card" style={{ padding: '16px', marginBottom: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                🎉 未来3天暂无安排，享受自由时光吧！
            </div>
        );
    }

    const STATUS_LABELS = { vacation: '🏖️ 休假', busy: '💼 忙碌', available: '✅ 可约', tentative: '❓ 待定' };
    const STATUS_CLASS = { vacation: 'status-vacation', busy: 'status-busy', available: 'status-available', tentative: 'status-tentative' };

    return (
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                📅 未来3天安排
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({upcoming.length})
                </span>
            </h3>
            <div className="event-list">
                {upcoming.map(evt => (
                    <div
                        key={evt.id}
                        className="event-item"
                        onClick={() => onEventClick(evt)}
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
                            <div className="note" style={{ color: 'var(--accent-solid)' }}>
                                {evt.start_date === evt.end_date ? evt.start_date : `${evt.start_date} ~ ${evt.end_date}`}
                            </div>
                        </div>
                        <div className="event-item-actions">
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>›</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

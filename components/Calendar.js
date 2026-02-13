'use client';

import { useState, useEffect } from 'react';
import { getHolidaysForMonth } from '@/lib/holidays';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const STATUS_COLORS = {
    vacation: '#f59e0b',
    busy: '#ef4444',
    available: '#22c55e',
    tentative: '#6366f1',
};

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getEventsForDate(events, dateStr) {
    return events.filter((e) => e.start_date <= dateStr && e.end_date >= dateStr);
}

export default function Calendar({ year, month, events, onDateClick, onPrev, onNext, selectedUserIds = [], members = [], currentUser = null }) {
    const [holidays, setHolidays] = useState({});

    // Get vibe for a specific date
    const getVibeForDate = (dateStr) => {
        if (!dateStr || members.length === 0) return null;
        
        // If one user selected, show theirs
        if (selectedUserIds.length === 1) {
            const user = members.find(m => m.id === selectedUserIds[0]);
            return user?.daily_statuses?.[dateStr] || user?.daily_statuses?.get?.(dateStr) || null;
        }

        // Default: show current user's vibe if exists
        const me = members.find(m => m.id === currentUser?.id);
        return me?.daily_statuses?.[dateStr] || me?.daily_statuses?.get?.(dateStr) || null;
    };

    // Load holidays when year/month changes
    useEffect(() => {
        let mounted = true;
        
        getHolidaysForMonth(year, month).then(data => {
            if (mounted) {
                setHolidays(data);
            }
        }).catch(err => {
            console.error('加载节假日数据失败:', err);
            if (mounted) {
                setHolidays({});
            }
        });

        return () => { mounted = false; };
    }, [year, month]);

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    const monthNames = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月',
    ];

    // Build calendar grid
    const cells = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        cells.push({ day, otherMonth: true, dateStr: null });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(year, month, d);
        cells.push({ day: d, otherMonth: false, dateStr });
    }

    // Next month fill
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, otherMonth: true, dateStr: null });
    }

    // Only show 5 weeks if possible
    const totalRows = cells.length > 35 ? 6 : 5;
    const displayCells = cells.slice(0, totalRows * 7);

    // Heatmap Logic: Calculate overlap when multiple users are selected
    const getHeatmapStyle = (dateStr) => {
        if (!dateStr || selectedUserIds.length < 2) return {};

        const dayEvents = getEventsForDate(events, dateStr);
        const busyUsers = new Set(
            dayEvents
                .filter(e => selectedUserIds.includes(e.user_id) && (e.status === 'busy' || e.status === 'vacation'))
                .map(e => e.user_id)
        );

        const freeCount = selectedUserIds.length - busyUsers.size;
        const freeRatio = freeCount / selectedUserIds.length;

        if (freeRatio === 1) {
            return { background: 'rgba(34, 197, 94, 0.25)', border: '1px solid rgba(34, 197, 94, 0.4)' }; // All free: Deep Green
        } else if (freeRatio >= 0.5) {
            return { background: 'rgba(34, 197, 94, 0.1)' }; // Most free: Light Green
        } else if (freeRatio === 0) {
            return { background: 'rgba(239, 68, 68, 0.15)' }; // All busy: Light Red
        }
        return {};
    };

    const filteredEvents = selectedUserIds.length > 0
        ? events.filter((e) => selectedUserIds.includes(e.user_id))
        : events;

    return (
        <div className="calendar">
            <div className="calendar-nav">
                <button onClick={onPrev}>◂</button>
                <div style={{ textAlign: 'center' }}>
                    <h2>{year} 年 {monthNames[month]}</h2>
                    {selectedUserIds.length > 1 && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--status-available)', fontWeight: 600 }}>对比模式：寻找共同空闲 🎯</div>
                    )}
                </div>
                <button onClick={onNext}>▸</button>
            </div>

            <div className="calendar-weekdays">
                {WEEKDAYS.map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>

            <div className="calendar-days">
                {displayCells.map((cell, idx) => {
                    const isToday = cell.dateStr === todayStr;
                    const dayEvents = cell.dateStr ? getEventsForDate(filteredEvents, cell.dateStr) : [];
                    const holiday = cell.dateStr ? holidays[cell.dateStr] : null;
                    const heatmapStyle = cell.dateStr ? getHeatmapStyle(cell.dateStr) : {};

                    // Deduplicate by user to show at most one dot per user
                    const uniqueUserEvents = [];
                    const seen = new Set();
                    for (const e of dayEvents) {
                        if (!seen.has(e.user_id)) {
                            seen.add(e.user_id);
                            uniqueUserEvents.push(e);
                        }
                    }

                    // Weekend check (0=Sun, 6=Sat)
                    const dayOfWeek = idx % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                        <button
                            key={idx}
                            className={`calendar-day${cell.otherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${holiday?.type === 'holiday' ? ' is-holiday' : ''}${holiday?.type === 'workday' ? ' is-workday' : ''}`}
                            onClick={() => {
                                if (!cell.otherMonth && cell.dateStr) onDateClick(cell.dateStr);
                            }}
                            disabled={cell.otherMonth}
                            title={holiday ? holiday.name : undefined}
                            style={heatmapStyle}
                        >
                            <span className={`day-number${(isWeekend && !cell.otherMonth) ? ' weekend' : ''}`}>
                                {cell.day}
                                {dayEvents.some(e => e.recurrence_rule) && !cell.otherMonth && (
                                    <span style={{ fontSize: '0.6rem', marginLeft: '2px', opacity: 0.7 }} title="包含重复事件">↻</span>
                                )}
                            </span>
                            {holiday && !cell.otherMonth && (
                                <span className={`holiday-label ${holiday.type}`}>
                                    {holiday.type === 'workday' ? '班' : holiday.name.length > 2 ? holiday.name.slice(0, 2) : holiday.name}
                                </span>
                            )}
                            
                            {/* Daily Vibe Display */}
                            {!cell.otherMonth && (
                                <div className="day-vibe">
                                    {getVibeForDate(cell.dateStr)?.emoji}
                                </div>
                            )}

                            {uniqueUserEvents.length > 0 && (
                                <div className="day-dots">
                                    {uniqueUserEvents.slice(0, 4).map((e, i) => (
                                        <span
                                            key={i}
                                            className="day-dot"
                                            style={{ background: STATUS_COLORS[e.status] || e.avatar_color }}
                                            title={`${e.nickname}: ${e.status}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

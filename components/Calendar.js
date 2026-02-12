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

export default function Calendar({ year, month, events, onDateClick, onPrev, onNext, filterUserId }) {
    const [holidays, setHolidays] = useState({});

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

    const filteredEvents = filterUserId
        ? events.filter((e) => e.user_id === filterUserId)
        : events;

    return (
        <div className="calendar">
            <div className="calendar-nav">
                <button onClick={onPrev}>◂</button>
                <h2>{year} 年 {monthNames[month]}</h2>
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
                        >
                            <span className={`day-number${(isWeekend && !cell.otherMonth) ? ' weekend' : ''}`}>
                                {cell.day}
                            </span>
                            {holiday && !cell.otherMonth && (
                                <span className={`holiday-label ${holiday.type}`}>
                                    {holiday.type === 'workday' ? '班' : holiday.name.length > 2 ? holiday.name.slice(0, 2) : holiday.name}
                                </span>
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

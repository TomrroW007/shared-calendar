'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PulseTimeline({ events, members, currentUser }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentHour = today.getHours();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const processedEvents = useMemo(() => {
    return events.filter(e => e.start_date === todayStr || e.start_date === tomorrowStr);
  }, [events, todayStr, tomorrowStr]);

  const getEventsAtHour = (dayStr, hour) => {
    return processedEvents.filter(e => {
      if (e.start_date !== dayStr) return false;
      if (!e.start_at) return false;
      const h = new Date(e.start_at).getHours();
      return h === hour;
    });
  };

  // Smart time compression
  const compressTimeline = (dayStr, isToday) => {
    const result = [];
    let emptyStart = null;

    for (const hour of hours) {
      const hourEvents = getEventsAtHour(dayStr, hour);
      const isCurrent = isToday && hour === currentHour;

      if (hourEvents.length > 0 || isCurrent) {
        if (emptyStart !== null) {
          result.push({ type: 'gap', from: emptyStart, to: hour - 1 });
          emptyStart = null;
        }
        result.push({ type: 'hour', hour, events: hourEvents, isCurrent });
      } else {
        if (emptyStart === null) emptyStart = hour;
      }
    }
    if (emptyStart !== null) {
      result.push({ type: 'gap', from: emptyStart, to: 23 });
    }
    return result;
  };

  const formatHour = (h) => `${String(h).padStart(2, '0')}:00`;

  const hasAnyEvents = (dayStr) => processedEvents.some(e => e.start_date === dayStr);

  const renderTimeline = (dayStr, label, isToday) => {
    const segments = compressTimeline(dayStr, isToday);
    const dayHasEvents = hasAnyEvents(dayStr);

    return (
      <div className="time-beam-day" style={{ marginBottom: '28px' }}>
        {/* Day label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '14px',
          paddingLeft: '12px',
        }}>
          <div style={{
            width: '8px', height: '8px',
            background: isToday ? 'var(--cosmic-cyan)' : 'var(--accent-primary)',
            borderRadius: '50%',
            boxShadow: `0 0 10px ${isToday ? 'var(--cosmic-cyan)' : 'var(--accent-primary)'}`,
          }} />
          <span style={{
            fontSize: '0.75rem',
            color: isToday ? 'var(--cosmic-cyan)' : 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontFamily: 'var(--font-tech)',
            fontWeight: '700',
          }}>
            {label}
          </span>
          {isToday && (
            <span style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-tech)',
              opacity: 0.5,
              letterSpacing: '0.1em',
            }}>
              {formatHour(currentHour)} ACTIVE
            </span>
          )}
        </div>

        {/* Timeline container with beam */}
        <div className="time-beam-container" style={{ position: 'relative', marginLeft: '12px' }}>
          {/* Enhanced Beam — wider glow band */}
          <div className="time-beam-enhanced" />

          {/* Segments */}
          <div className="time-beam-segments">
            {segments.map((seg, idx) => {
              if (seg.type === 'gap') {
                const span = seg.to - seg.from + 1;
                return (
                  <div key={`gap-${idx}`} className="time-beam-row time-gap-row">
                    {/* Time + tick */}
                    <div className="beam-tick-area">
                      <span className="beam-time-label" style={{ opacity: 0.3 }}>
                        {formatHour(seg.from)}
                      </span>
                      <div className="beam-tick beam-tick-dim" />
                    </div>
                    {/* Dashed connector + gap info */}
                    <div className="beam-connector">
                      <div className="beam-dash" />
                      <span className="beam-gap-text">
                        {span === 1
                          ? `空闲`
                          : `${formatHour(seg.from)} — ${formatHour(seg.to)} · ${span}h 空闲`}
                      </span>
                    </div>
                  </div>
                );
              }

              // Rendered hour — with or without events
              return (
                <div key={`hour-${seg.hour}`} className={`time-beam-row ${seg.isCurrent ? 'time-beam-row-active' : ''}`}>
                  {/* Time + tick */}
                  <div className="beam-tick-area">
                    <span className={`beam-time-label ${seg.isCurrent ? 'beam-time-now' : ''}`}>
                      {formatHour(seg.hour)}
                    </span>
                    {seg.isCurrent ? (
                      <motion.div
                        className="beam-tick beam-tick-now"
                        animate={{
                          boxShadow: [
                            '0 0 4px var(--cosmic-cyan), 0 0 8px var(--cosmic-cyan)',
                            '0 0 8px var(--cosmic-cyan), 0 0 20px var(--cosmic-cyan)',
                            '0 0 4px var(--cosmic-cyan), 0 0 8px var(--cosmic-cyan)',
                          ],
                          scale: [1, 1.4, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : seg.events.length > 0 ? (
                      <div className="beam-tick beam-tick-event" />
                    ) : (
                      <div className="beam-tick beam-tick-empty" />
                    )}
                  </div>

                  {/* Dashed connector + data node */}
                  <div className="beam-connector">
                    {seg.events.length > 0 ? (
                      <>
                        <div className="beam-dash beam-dash-active" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {seg.events.map((e) => (
                            <Link key={e.id} href={`/space/${e.space_id}`}>
                              <motion.div
                                whileHover={{ scale: 1.02, borderColor: 'var(--cosmic-cyan)' }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="data-node"
                              >
                                {/* Avatar */}
                                <div className="data-node-avatar" style={{
                                  background: e.avatar_color || 'var(--accent-primary)',
                                  boxShadow: `0 0 10px ${e.avatar_color || 'var(--accent-primary)'}50`,
                                }}>
                                  {e.nickname?.charAt(0)}
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="data-node-title">
                                    {e.title || e.note || '未命名活动'}
                                  </div>
                                  <div className="data-node-meta">
                                    {e.nickname} · {e.start_at ? new Date(e.start_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '全天'}
                                  </div>
                                </div>
                                {/* Side accent bar */}
                                <div style={{
                                  width: '3px', height: '20px', borderRadius: '2px',
                                  background: e.avatar_color || 'var(--accent-primary)',
                                  opacity: 0.5, flexShrink: 0,
                                }} />
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : seg.isCurrent ? (
                      <>
                        <div className="beam-dash beam-dash-active" />
                        <div className="beam-now-label">NOW</div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state: scanning animation when no events */}
          {!dayHasEvents && (
            <div className="beam-scan-card">
              <div className="beam-scan-line" />
              <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '20px', height: '20px',
                    border: '2px solid var(--cosmic-cyan)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: '700',
                    color: 'var(--cosmic-cyan)',
                    fontFamily: 'var(--font-tech)',
                    letterSpacing: '0.1em',
                  }}>
                    SCANNING FREQUENCIES...
                  </div>
                  <div style={{
                    fontSize: '0.6rem', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-tech)', marginTop: '2px',
                  }}>
                    暂无日程数据 · 等待信号输入
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pulse-timeline-v2">
      {renderTimeline(todayStr, '今天', true)}
      {renderTimeline(tomorrowStr, '明天', false)}
    </div>
  );
}

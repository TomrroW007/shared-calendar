"use client";

import { useMemo, useEffect, useState, useCallback } from "react";

export default function PulseTimeline({ events, members, currentUser }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  const processedEvents = useMemo(() => {
    return events.filter((e) => e.start_date === todayStr);
  }, [events, todayStr]);

  const getEventsAtHour = useCallback(
    (hour) => {
      return processedEvents.filter((e) => {
        if (!e.start_at) return false;
        return new Date(e.start_at).getHours() === hour;
      });
    },
    [processedEvents],
  );

  const timelineSegments = useMemo(() => {
    const result = [];
    let emptyStart = null;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    for (const hour of hours) {
      const hourEvents = getEventsAtHour(hour);
      const isCurrentHour = hour === currentHour;

      if (hourEvents.length > 0 || isCurrentHour) {
        if (emptyStart !== null) {
          result.push({ type: "gap", from: emptyStart, to: hour - 1 });
          emptyStart = null;
        }
        result.push({
          type: "hour",
          hour,
          events: hourEvents,
          isCurrent: isCurrentHour,
        });
      } else {
        if (emptyStart === null) emptyStart = hour;
      }
    }
    if (emptyStart !== null) {
      result.push({ type: "gap", from: emptyStart, to: 23 });
    }
    return result;
  }, [getEventsAtHour, currentHour]);

  return (
    <div className="pulse-stream-container">
      {/* 增强型战术光束 - 多层光学衰减 */}
      <div className="time-beam-core" />

      {/* 物理级雷达扫描激光 - mix-blend-mode: color-dodge */}
      <div className="scanner-laser" />

      <div className="pulse-stream-content">
        {timelineSegments.map((segment, idx) => (
          <div key={idx} className="pulse-row-wrapper">
            {segment.type === "gap" ? (
              <GapSegment from={segment.from} to={segment.to} />
            ) : (
              <HourSegment
                hour={segment.hour}
                events={segment.events}
                isCurrent={segment.isCurrent}
              />
            )}
          </div>
        ))}
      </div>

      {/* 扫描空状态 */}
      {processedEvents.length === 0 && (
        <div className="beam-scan-card">
          <div className="beam-scan-laser-inner" />
          <div className="scan-icon">◬</div>
          <div
            className="tech-label"
            style={{
              color: "var(--accent-cyan)",
              animation: "pulse 2s infinite",
            }}
          >
            SCANNING LOCAL FREQUENCIES...
          </div>
        </div>
      )}
    </div>
  );
}

function GapSegment({ from, to }) {
  const duration = to - from + 1;
  const timeLabel = `${String(from).padStart(2, "0")}00`;

  return (
    <div className="pulse-row gap-row">
      <div className="pulse-time gap-time">{timeLabel}</div>
      <div className="pulse-tick gap-tick" />
      <div className="pulse-node">
        <div className="gap-label">{duration}H SILENT MODE</div>
      </div>
    </div>
  );
}

function HourSegment({ hour, events, isCurrent }) {
  const timeLabel = `${String(hour).padStart(2, "0")}00`;

  return (
    <div className={`pulse-row ${isCurrent ? "is-current" : ""}`}>
      <div className="pulse-time">
        {timeLabel}
        {isCurrent && <div className="now-badge">NOW</div>}
      </div>

      <div
        className={`pulse-tick ${isCurrent ? "tick-now" : events.length > 0 ? "tick-event" : "tick-empty"}`}
      >
        {isCurrent && <div className="tick-core-ping" />}
      </div>

      <div className="pulse-node-container">
        {events.length === 0 && isCurrent && (
          <div className="pulse-node empty-node">
            <div className="tech-label">STANDBY</div>
          </div>
        )}

        {events.map((event) => (
          <div key={event._id} className="pulse-node data-card">
            <div className="data-card-avatar">
              {event.title ? event.title.charAt(0) : "◭"}
            </div>
            <div className="data-card-content">
              <h4 className="data-title">{event.title}</h4>
              <p className="data-meta tech-label">
                <span className="status-dot" />
                {new Date(event.start_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" · "}INITIATED
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

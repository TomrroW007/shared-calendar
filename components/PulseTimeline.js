"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Helper Tick Style Generator
const getTickStyle = (type) => {
  const base = {
    position: "absolute",
    right: "-1px" /* Align to right edge of left container, touching beam */,
    transform: "translateY(-50%)",
  };

  switch (type) {
    case "now":
      return {
        ...base,
        width: "10px",
        height: "10px",
        background: "var(--accent-cyan)",
        borderRadius: "50%",
        boxShadow: "0 0 10px var(--accent-cyan)",
      };
    case "event":
      return {
        ...base,
        width: "8px",
        height: "8px",
        background: "var(--accent-primary)",
        borderRadius: "50%",
        boxShadow: "0 0 8px var(--accent-primary)",
      };
    case "empty":
      return {
        ...base,
        width: "5px",
        height: "5px",
        background: "rgba(6, 182, 212, 0.3)",
        borderRadius: "50%",
      };
    case "dim":
    default:
      return {
        ...base,
        width: "4px",
        height: "4px",
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "50%",
      };
  }
};

export default function PulseTimeline({ events, members, currentUser }) {
  const [now, setNow] = useState(new Date());

  // Update "NOW" every minute
  useEffect(() => {
    // Set initial time on client side to match server/hydration
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  // We use local format for simple comparison for now, assuming events are in local or consistent UTC
  // In a real app with timezones, this needs robust handling (date-fns-tz etc.)
  const todayStr = now.toISOString().split("T")[0];

  const processedEvents = useMemo(() => {
    // PRD: "Tactical Data Stream" - filtering for likely relevant events
    return events.filter((e) => e.start_date === todayStr);
  }, [events, todayStr]);

  const getEventsAtHour = useCallback(
    (hour) => {
      return processedEvents.filter((e) => {
        if (!e.start_at) return false;
        const h = new Date(e.start_at).getHours();
        return h === hour;
      });
    },
    [processedEvents],
  );

  // Compressed Timeline Logic
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
  }, [processedEvents, currentHour, getEventsAtHour]);

  if (
    processedEvents.length === 0 &&
    timelineSegments.length <= 1 &&
    !timelineSegments.some((s) => s.isCurrent)
  ) {
    // Fallback if somehow empty
  }

  return (
    <div className="pulse-container">
      {/* The Time Beam - Fixed Vertical Line */}
      <div className="time-beam" />

      {/* Scanner Line Animation */}
      <div className="scanner-container">
        <motion.div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "150px",
            background:
              "linear-gradient(to bottom, transparent, var(--accent-cyan), transparent)",
            opacity: 0.3,
            boxShadow: "0 0 15px var(--accent-cyan)",
          }}
          animate={{ top: ["-20%", "120%"] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="pulse-segments">
        {timelineSegments.map((segment, idx) => (
          <div key={idx} className="pulse-segment">
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

      {/* Empty State / Bottom Filler */}
      {processedEvents.length === 0 && (
        <div className="empty-state">
          <RadarScan />
          <div className="scan-text">SCANNING LOCAL FREQUENCIES...</div>
        </div>
      )}
    </div>
  );
}

function GapSegment({ from, to }) {
  const duration = to - from + 1;
  const label =
    duration > 1
      ? `${String(from).padStart(2, "0")}:00 — ${String(to + 1).padStart(2, "0")}:00`
      : `${String(from).padStart(2, "0")}:00 Empty`;

  return (
    <div className="gap-segment">
      {/* Time Label Area (Left of Beam) */}
      <div className="gap-time">
        {/* Hover to see start time of gap */}
        {String(from).padStart(2, "0")}:00
      </div>

      {/* Tick on Beam */}
      <div
        style={{
          position: "absolute",
          left: "48px",
          ...getTickStyle("dim"),
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Content Area (Right of Beam) */}
      <div className="gap-content">
        {label} · {duration}h SILENT
      </div>
    </div>
  );
}

function HourSegment({ hour, events, isCurrent }) {
  const timeLabel = `${String(hour).padStart(2, "0")}:00`;

  return (
    <div className="hour-segment">
      {/* Time Label (Left) */}
      <div className={`hour-label ${isCurrent ? "current" : "inactive"}`}>
        {timeLabel}
      </div>

      {/* Tick (On Beam) */}
      <div
        style={{
          position: "absolute",
          left: "48px",
          zIndex: 20,
          ...getTickStyle(
            isCurrent ? "now" : events.length > 0 ? "event" : "empty",
          ),
          top: "24px",
          transform: "translate(-50%, -50%)",
        }}
      >
        {isCurrent && <div className="ping-animation"></div>}
      </div>

      {/* NOW Indicator Badge */}
      {isCurrent && <div className="now-badge">NOW</div>}

      {/* Events List */}
      <div className={`events-list ${isCurrent ? "with-now" : ""}`}>
        {events.map((event) => (
          <div key={event._id} className="data-node">
            <div style={{ flex: 1 }}>
              <h4 className="event-title">{event.title}</h4>
              <p className="event-time">
                <span className="event-dot"></span>
                {new Date(event.start_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>

            {/* Simple decoration for the node */}
            <div className="event-decoration">
              <div className="event-line"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarScan() {
  return (
    <div className="radar-scan">
      <div className="radar-ring"></div>
      <div className="radar-beam"></div>
    </div>
  );
}

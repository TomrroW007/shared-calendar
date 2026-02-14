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
    <div className="relative w-full pb-24 font-sans select-none">
      {/* The Time Beam - Fixed Vertical Line */}
      <div className="time-beam" />

      {/* Scanner Line Animation */}
      <div className="absolute left-[48px] top-0 bottom-0 w-[2px] overflow-hidden pointer-events-none z-0">
        <motion.div
          style={{
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
          className="absolute left-0"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-0 pt-8 pl-0">
        {timelineSegments.map((segment, idx) => (
          <div key={idx} className="relative w-full">
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
        <div className="ml-16 mt-8 p-6 border border-dashed border-slate-800 rounded-xl opacity-50 flex items-center justify-center flex-col gap-4">
          <RadarScan />
          <div className="text-xs font-tech tracking-[0.2em] text-cyan-500/50 animate-pulse">
            SCANNING LOCAL FREQUENCIES...
          </div>
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
    <div className="flex h-12 items-center text-xs text-muted-foreground/30 relative group">
      {/* Time Label Area (Left of Beam) */}
      <div className="w-12 text-right pr-4 font-tech tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute left-0">
        {/* Hover to see start time of gap */}
        {String(from).padStart(2, "0")}:00
      </div>

      {/* Tick on Beam */}
      <div
        className="absolute left-[48px]"
        style={{
          ...getTickStyle("dim"),
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Content Area (Right of Beam) */}
      <div className="pl-16 text-[10px] uppercase tracking-widest opacity-20 font-tech w-full">
        {label} · {duration}h SILENT
      </div>
    </div>
  );
}

function HourSegment({ hour, events, isCurrent }) {
  const timeLabel = `${String(hour).padStart(2, "0")}:00`;

  return (
    <div className="relative min-h-[60px] py-2">
      {/* Time Label (Left) */}
      <div
        className={`absolute left-0 w-11 text-right font-tech text-sm tracking-wider leading-none transition-colors ${
          isCurrent
            ? "text-cyan-400 font-bold shadow-cyan-500/50"
            : "text-slate-500"
        }`}
        style={{ top: "18px" }}
      >
        {timeLabel}
      </div>

      {/* Tick (On Beam) */}
      <div
        className="absolute left-[48px] z-20"
        style={{
          ...getTickStyle(
            isCurrent ? "now" : events.length > 0 ? "event" : "empty",
          ),
          top: "24px",
          transform: "translate(-50%, -50%)",
        }}
      >
        {isCurrent && (
          <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
        )}
      </div>

      {/* NOW Indicator Badge */}
      {isCurrent && (
        <div className="absolute left-[64px] top-[14px] px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/30 rounded-[4px] text-[10px] text-cyan-300 font-bold tracking-widest font-tech z-10 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          NOW
        </div>
      )}

      {/* Events List */}
      <div
        className="flex flex-col gap-3 min-h-[20px]"
        style={{ marginTop: isCurrent ? "40px" : "0" }}
      >
        {events.map((event) => (
          <div key={event._id} className="data-node group">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white tracking-wide font-sans group-hover:text-cyan-200 transition-colors">
                {event.title}
              </h4>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-tech tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"></span>
                {new Date(event.start_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>

            {/* Simple decoration for the node */}
            <div className="opacity-20 group-hover:opacity-100 transition-opacity">
              <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarScan() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center opacity-50">
      <div className="absolute inset-0 border border-cyan-500/20 rounded-full"></div>
      <div className="w-full h-[1px] bg-cyan-500/30 absolute top-1/2 -translate-y-1/2 animate-spin-slow origin-center"></div>
    </div>
  );
}

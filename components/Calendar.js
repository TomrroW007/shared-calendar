"use client";

import { useState, useEffect } from "react";
import { getHolidaysForMonth } from "@/lib/holidays";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const STATUS_COLORS = {
  vacation: "#FF6B00", // Energy High
  busy: "#F87171",
  available: "#4ADE80",
  tentative: "#A855F7", // Neon Purple
  ghost: "rgba(255,255,255,0.3)",
};

// ... (helper functions remain same)

export default function Calendar({
  year,
  month,
  events,
  onDateClick,
  onPrev,
  onNext,
  selectedUserIds = [],
  members = [],
  currentUser = null,
}) {
  const [holidays, setHolidays] = useState({});

  // Get vibe for a specific date
  const getVibeForDate = (dateStr) => {
    if (!dateStr || members.length === 0) return null;
    if (selectedUserIds.length === 1) {
      const user = members.find((m) => m.id === selectedUserIds[0]);
      return (
        user?.daily_statuses?.[dateStr] ||
        user?.daily_statuses?.get?.(dateStr) ||
        null
      );
    }
    const me = members.find((m) => m.id === currentUser?.id);
    return (
      me?.daily_statuses?.[dateStr] ||
      me?.daily_statuses?.get?.(dateStr) ||
      null
    );
  };

  useEffect(() => {
    let mounted = true;
    getHolidaysForMonth(year, month)
      .then((data) => {
        if (mounted) setHolidays(data);
      })
      .catch(() => {
        if (mounted) setHolidays({});
      });
    return () => {
      mounted = false;
    };
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const today = new Date();
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({ day, otherMonth: true, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);
    cells.push({ day: d, otherMonth: false, dateStr });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, otherMonth: true, dateStr: null });
  }

  const totalRows = cells.length > 35 ? 6 : 5;
  const displayCells = cells.slice(0, totalRows * 7);

  const filteredEvents =
    selectedUserIds.length > 0
      ? events.filter((e) => selectedUserIds.includes(e.user_id))
      : events;

  return (
    <div className="calendar">
      <div className="calendar-nav" style={{ marginBottom: "24px" }}>
        <button
          onClick={onPrev}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          ◂
        </button>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              letterSpacing: "0.05em",
            }}
          >
            {year}{" "}
            <span style={{ color: "var(--accent-primary)", opacity: 0.8 }}>
              /
            </span>{" "}
            {monthNames[month]}
          </h2>
        </div>
        <button
          onClick={onNext}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          ▸
        </button>
      </div>

      <div
        className="calendar-weekdays"
        style={{ opacity: 0.4, marginBottom: "12px" }}
      >
        {WEEKDAYS.map((d) => (
          <span key={d} style={{ fontSize: "0.7rem", fontWeight: "800" }}>
            {d}
          </span>
        ))}
      </div>

      <div className="calendar-days">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px",
              width: "100%",
            }}
          >
            {displayCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = cell.dateStr
                ? getEventsForDate(filteredEvents, cell.dateStr)
                : [];
              const holiday = cell.dateStr ? holidays[cell.dateStr] : null;
              const dayVibe = getVibeForDate(cell.dateStr);

              // PulseRadar V2 Heatmap Logic
              const busyLevel = dayEvents.length;
              let glowColor = "transparent";
              let glowOpacity = 0;

              if (!cell.otherMonth && cell.dateStr) {
                if (busyLevel === 0) {
                  glowColor = "var(--accent-cyan)"; // Free - Blue/Cyan
                  glowOpacity = 0.05;
                } else if (busyLevel <= 2) {
                  glowColor = "var(--accent-primary)"; // Moderate - Purple
                  glowOpacity = 0.1;
                } else {
                  glowColor = "var(--status-busy)"; // Busy - Red/Orange
                  glowOpacity = 0.15 + busyLevel * 0.05; // Intensify
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.92 }}
                  className={`calendar-day ${isToday ? "today" : ""}`}
                  style={{
                    opacity: cell.otherMonth ? 0.2 : 1,
                    position: "relative",
                    height: "56px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      !cell.otherMonth && cell.dateStr
                        ? `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`
                        : "transparent",
                    boxShadow: isToday ? "0 0 15px var(--accent-glow)" : "none",
                  }}
                  onClick={() => {
                    if (!cell.otherMonth && cell.dateStr)
                      onDateClick(cell.dateStr);
                  }}
                  disabled={cell.otherMonth}
                >
                  <span
                    style={{
                      fontSize: "0.95rem",
                      zIndex: 2,
                      fontWeight: isToday ? "800" : "500",
                      color:
                        (idx % 7 === 0 || idx % 7 === 6) && !cell.otherMonth
                          ? "#F87171"
                          : "inherit",
                    }}
                  >
                    {cell.day}
                  </span>

                  {/* Holiday Label */}
                  {holiday && !cell.otherMonth && (
                    <span
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        fontSize: "0.5rem",
                        opacity: 0.6,
                        fontWeight: "bold",
                        color:
                          holiday.type === "holiday"
                            ? "#F87171"
                            : "var(--text-muted)",
                      }}
                    >
                      {holiday.type === "workday"
                        ? "班"
                        : holiday.name.slice(0, 2)}
                    </span>
                  )}

                  {/* Vibe Emoji */}
                  {dayVibe && !cell.otherMonth && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        fontSize: "0.6rem",
                      }}
                    >
                      {dayVibe.emoji}
                    </div>
                  )}

                  {/* Event Dots */}
                  {dayEvents.length > 0 && !cell.otherMonth && (
                    <div
                      style={{ display: "flex", gap: "3px", marginTop: "4px" }}
                    >
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div
                          key={i}
                          className="day-dot"
                          style={{
                            background:
                              STATUS_COLORS[e.status] || e.avatar_color,
                            color: STATUS_COLORS[e.status] || e.avatar_color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Info,
  MessageCircle,
  Trash2,
  Send,
} from "lucide-react";
import { parseQuickAddCommand } from "@/lib/nlp";
import CosmicCard from "@/components/CosmicCard";

const STATUS_OPTIONS = [
  { value: "vacation", label: "🏖️ 休假", color: "#FF6B00" },
  { value: "busy", label: "💼 忙碌", color: "#F87171" },
  { value: "available", label: "✅ 可约", color: "#4ADE80" },
  { value: "tentative", label: "❓ 待定", color: "#A855F7" },
  { value: "ghost", label: "👻 想去", color: "rgba(255,255,255,0.3)" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "不重复" },
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
];

const VIBE_EMOJIS = [
  "🏃",
  "🍕",
  "🎮",
  "💼",
  "✈️",
  "😴",
  "💪",
  "🍺",
  "📚",
  "🏠",
  "🔥",
];

const PillSelector = ({ options, value, onChange, activeColor }) => (
  <div className="pill-group" style={{ marginBottom: "16px" }}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`pill-option ${value === opt.value ? "active" : ""}`}
        onClick={() => onChange(opt.value)}
        style={
          value === opt.value
            ? {
                background: activeColor || "var(--accent-primary)",
                color: "#000",
              }
            : {}
        }
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function EventModal({
  date,
  event,
  events = [],
  members,
  currentUser,
  onClose,
  onSave,
  onDelete,
  onRSVP,
}) {
  const [isEditing, setIsEditing] = useState(!event?.id);
  const [activeTab, setActiveTab] = useState("details");
  const [nlpInput, setNlpInput] = useState("");

  // Form State
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(true);
  const [status, setStatus] = useState("busy");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [recurrence, setRecurrence] = useState("none");

  // Vibe State
  const [vibeEmoji, setVibeEmoji] = useState("");
  const [vibeText, setVibeText] = useState("");

  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [conflictInfo, setConflictInfo] = useState(null);

  // Roles & RSVP
  const isCreator = !event?.id || event.user_id === currentUser?.id;
  const myParticipantInfo = event?.participant_details?.find(
    (p) => p.id === currentUser?.id,
  );
  const isParticipant = !!myParticipantInfo && !isCreator;
  const [rsvpStatus, setRsvpStatus] = useState("pending");
  const [rsvpComment, setRsvpComment] = useState("");
  const [participantMode, setParticipantMode] = useState("none");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const handleNlpParse = () => {
    if (!nlpInput.trim()) return;
    const result = parseQuickAddCommand(nlpInput);
    if (result.date) {
      setStartDate(result.date);
      setEndDate(result.date);
    }
    if (result.time) {
      setStartTime(result.time);
      setIsAllDay(false);
      const [h, m] = result.time.split(":").map(Number);
      setEndTime(
        `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
    if (result.title) setNote(result.title);
    setNlpInput("");
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    if (isEditing && val.length < 20) {
      // Simple keyword parsing logic
      const now = new Date();
      let target = null;
      if (val.includes("明天")) {
        target = new Date(now);
        target.setDate(now.getDate() + 1);
      } else if (val.includes("后天")) {
        target = new Date(now);
        target.setDate(now.getDate() + 2);
      }
      if (target) {
        const str = target.toISOString().split("T")[0];
        if (startDate !== str) {
          setStartDate(str);
          setEndDate(str);
        }
      }
    }
  };

  const fetchComments = useCallback(async () => {
    if (!event?.id) return;
    try {
      const res = await fetch(`/api/comments?relatedId=${event.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error(e);
    }
  }, [event?.id]);

  useEffect(() => {
    setIsEditing(!event?.id);
    setActiveTab("details");
    if (event) {
      setStartDate(event.start_date);
      setEndDate(event.end_date);
      setStatus(event.status);
      setNote(event.note || "");
      setLocation(event.location || "");
      setVisibility(event.visibility || "public");
      setRecurrence(event.recurrence_rule ? "weekly" : "none"); // Simplified
      fetchComments();
      if (isParticipant && myParticipantInfo) {
        setRsvpStatus(myParticipantInfo.status);
        setRsvpComment(myParticipantInfo.comment || "");
      }
    }
  }, [event, date, isParticipant, myParticipantInfo, fetchComments]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        start_date: startDate,
        end_date: endDate || startDate,
        start_at: isAllDay ? null : new Date(`${startDate}T${startTime}`),
        end_at: isAllDay
          ? null
          : new Date(`${endDate || startDate}T${endTime}`),
        is_all_day: isAllDay,
        status,
        note,
        location,
        visibility,
        recurrence_rule: recurrence !== "none" ? "FREQ=WEEKLY" : null,
        participants:
          participantMode === "all"
            ? members.map((m) => m.id)
            : selectedParticipants,
      });
      if (event?.id) setIsEditing(false);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          zIndex: 1000,
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "500px", width: "95%" }}
        >
          <CosmicCard style={{ padding: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                className="gradient-text"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: "800",
                }}
              >
                {event?.id ? (isEditing ? "调整火花" : "火花详情") : "发射火花"}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  width: "36px",
                  height: "36px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {event?.id && (
              <div
                style={{
                  marginBottom: "32px",
                  display: "flex",
                  gap: "24px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: "12px",
                }}
              >
                <button
                  className={`modal-tab ${activeTab === "details" ? "active" : ""}`}
                  onClick={() => setActiveTab("details")}
                  style={{
                    background: "none",
                    border: "none",
                    color:
                      activeTab === "details"
                        ? "var(--cosmic-cyan)"
                        : "var(--text-secondary)",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 0",
                    transition: "all 0.3s",
                    borderBottom:
                      activeTab === "details"
                        ? "2px solid var(--cosmic-cyan)"
                        : "2px solid transparent",
                  }}
                >
                  <Info size={18} /> 概览
                </button>
                <button
                  className={`modal-tab ${activeTab === "comments" ? "active" : ""}`}
                  onClick={() => setActiveTab("comments")}
                  style={{
                    background: "none",
                    border: "none",
                    color:
                      activeTab === "comments"
                        ? "var(--cosmic-cyan)"
                        : "var(--text-secondary)",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 0",
                    transition: "all 0.3s",
                    borderBottom:
                      activeTab === "comments"
                        ? "2px solid var(--cosmic-cyan)"
                        : "2px solid transparent",
                  }}
                >
                  <MessageCircle size={18} /> 讨论{" "}
                  {comments.length > 0 && (
                    <span className="comment-count">{comments.length}</span>
                  )}
                </button>
              </div>
            )}

            <div>
              {activeTab === "details" ? (
                isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="group" style={{ marginBottom: "32px" }}>
                      <label
                        className="font-tech"
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--cosmic-cyan)",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        活动主题
                      </label>
                      <input
                        className="cosmic-input"
                        placeholder="今晚去哪儿野？"
                        value={note}
                        onChange={handleNoteChange}
                        style={{ fontSize: "1.5rem", fontWeight: "700" }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "32px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label
                          className="font-tech"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "700",
                          }}
                        >
                          📅 日期
                        </label>
                        <input
                          className="cosmic-input"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          className="font-tech"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: "700",
                          }}
                        >
                          📍 地点
                        </label>
                        <input
                          className="cosmic-input"
                          placeholder="在哪？"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "32px" }}>
                      <label
                        className="font-tech"
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: "700",
                          display: "block",
                          marginBottom: "12px",
                        }}
                      >
                        状态类型
                      </label>
                      <PillSelector
                        options={STATUS_OPTIONS}
                        value={status}
                        onChange={setStatus}
                        activeColor={
                          STATUS_OPTIONS.find((o) => o.value === status)?.color
                        }
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "40px",
                      }}
                    >
                      {event?.id && (
                        <button
                          type="button"
                          className="btn-cosmic"
                          onClick={onDelete}
                          style={{
                            width: "56px",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(248,113,113,0.2)",
                            borderColor: "#F87171",
                          }}
                        >
                          <Trash2 size={24} />
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn-cosmic"
                        style={{ flex: 1, height: "56px", fontSize: "1.1rem" }}
                      >
                        {loading
                          ? "同步中..."
                          : event?.id
                            ? "更新火花"
                            : "发射火花 ✨"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="view-mode">
                    <div style={{ marginBottom: "32px" }}>
                      <h3
                        className="gradient-text"
                        style={{
                          fontSize: "2rem",
                          fontWeight: "900",
                          marginBottom: "12px",
                          lineHeight: "1.2",
                        }}
                      >
                        {note || "无主题"}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <CalendarIcon size={16} className="text-purple-400" />{" "}
                          {startDate}
                        </span>
                        {location && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <MapPin size={16} className="text-cyan-400" />{" "}
                            {location}
                          </span>
                        )}
                      </div>
                    </div>

                    <CosmicCard
                      corners={false}
                      style={{ padding: "20px", marginBottom: "32px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          className="avatar"
                          style={{
                            background: event.avatar_color,
                            width: 48,
                            height: 48,
                            fontSize: "1.2rem",
                          }}
                        >
                          {event.nickname?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "1rem", fontWeight: "800" }}>
                            {event.nickname}
                          </div>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: STATUS_OPTIONS.find(
                                (o) => o.value === event.status,
                              )?.color,
                            }}
                          >
                            {
                              STATUS_OPTIONS.find(
                                (o) => o.value === event.status,
                              )?.label
                            }
                          </div>
                        </div>
                        {isCreator && (
                          <button
                            className="btn-cosmic"
                            onClick={() => setIsEditing(true)}
                            style={{ padding: "6px 16px", fontSize: "0.85rem" }}
                          >
                            编辑
                          </button>
                        )}
                      </div>
                    </CosmicCard>

                    {isParticipant && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          className={`btn-cosmic ${rsvpStatus === "accepted" ? "" : "btn-secondary"}`}
                          onClick={() => handleRSVP("accepted")}
                          style={{ flex: 1, height: "50px" }}
                        >
                          确认参加
                        </button>
                        <button
                          className="btn-cosmic"
                          onClick={() => handleRSVP("declined")}
                          style={{
                            width: "50px",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(248,113,113,0.2)",
                            borderColor: "#F87171",
                          }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="comments-section">
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      marginBottom: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {comments.map((c) => (
                      <div key={c._id} style={{ display: "flex", gap: "12px" }}>
                        <div
                          className="avatar-sm"
                          style={{ background: c.user_id.avatar_color }}
                        >
                          {c.user_id.nickname.charAt(0)}
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: "10px 16px",
                            borderRadius: "16px 16px 16px 4px",
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "800",
                              marginBottom: "2px",
                            }}
                          >
                            {c.user_id.nickname}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {c.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      className="cosmic-input"
                      placeholder="说点什么..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn-cosmic"
                      style={{
                        width: "48px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CosmicCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

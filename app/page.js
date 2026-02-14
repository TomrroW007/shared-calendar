"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Box,
  Zap,
  Radar,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import FAB from "@/components/FAB";
import VibeSlider from "@/components/VibeSlider";
import PulseTimeline from "@/components/PulseTimeline";
import CosmicCard from "@/components/CosmicCard";
import Calendar from "@/components/Calendar";
import PulseSummary from "@/components/PulseSummary";
import EventModal from "@/components/EventModal";

export default function HomePage() {
  const [spaces, setSpaces] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for calendar
  const [todayEvents, setTodayEvents] = useState([]);
  const [battery, setBattery] = useState({ level: 100, status: "active" });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Event Modal State
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newSpaceName, setNewSpaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");
  const router = useRouter();

  // Listen for global command palette events
  useEffect(() => {
    const handleOpenCreate = () => setShowCreate(true);
    window.addEventListener("open-create-space", handleOpenCreate);
    return () =>
      window.removeEventListener("open-create-space", handleOpenCreate);
  }, []);

  const getToken = () => localStorage.getItem("token");

  const handleLogout = () => {
    if (!confirm("确定要退出登录吗？\n退出前请确保已保存好你的访问令牌。"))
      return;
    localStorage.clear();
    router.push("/login");
  };

  const handleCopyToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigator.clipboard.writeText(token);
      showToast("令牌已复制到剪贴板");
    }
  };

  const fetchSpaces = useCallback(
    async (token) => {
      try {
        const currentToken = token || getToken();
        // In a real app, we would fetch events for the whole month.
        // For now, reusing todayEvents endpoint or assuming it returns enough data.
        // Ideally: fetch(`/api/events?year=${currentDate.getFullYear()}&month=${currentDate.getMonth()}`)

        const [spacesRes, todayRes, meRes] = await Promise.all([
          fetch("/api/spaces", {
            headers: { Authorization: `Bearer ${currentToken}` },
          }),
          fetch("/api/events/today", {
            headers: { Authorization: `Bearer ${currentToken}` },
          }),
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${currentToken}` },
          }),
        ]);

        if (spacesRes.status === 401) {
          router.push("/login");
          return;
        }
        const spacesData = await spacesRes.json();
        const todayData = await todayRes.json();
        const meData = await meRes.json();

        setSpaces(spacesData.spaces || []);

        // Mocking 'allEvents' from 'todayEvents' for demo purposes
        // In reality, this should come from a month-range query
        const events = todayData.events || [];
        setTodayEvents(events);
        setAllEvents(events);

        if (meData.user) {
          setUser(meData.user);
          if (meData.user.social_battery)
            setBattery(meData.user.social_battery);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const updateBattery = async (level, vibe) => {
    try {
      const res = await fetch("/api/users/me/battery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ level, vibe }),
      });
      const data = await res.json();
      if (data.success) {
        setBattery(data.battery);
        if (data.vibe)
          setUser((prev) => ({ ...prev, current_vibe: data.vibe }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchSpaces(token);
  }, [router, fetchSpaces]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const allMembers = spaces
    .flatMap((s) => s.members || [])
    .reduce((acc, current) => {
      const x = acc.find((item) => item.id === current.id);
      return !x ? acc.concat([current]) : acc;
    }, []);

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setEditingEvent({});
  };

  const handleSaveEvent = async (e) => {
    setLoading(true);
    setTimeout(() => {
      showToast(e.id ? "火花已更新" : "火花已发射 ✨");
      setLoading(false);
      setSelectedDate(null);
      setEditingEvent(null);
    }, 800);
  };

  // ... (Keep handleCreateSpace and handleJoinSpace logic)
  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: newSpaceName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCreate(false);
      setNewSpaceName("");
      showToast(`空间创建成功！邀请码：${data.space.invite_code}`);
      fetchSpaces();
    } catch (err) {
      showToast(err.message || "创建失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSpace = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowJoin(false);
      setInviteCode("");
      if (data.already_member) {
        showToast("你已经是该空间的成员");
      } else {
        showToast(`成功加入「${data.space.name}」`);
      }
      fetchSpaces();
    } catch (err) {
      showToast(err.message || "加入失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      {/* Background Aurora Blobs are handled in globals.css */}

      <div className="container" style={{ paddingBottom: "100px" }}>
        {/* Header */}
        <header
          className="page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 0 20px",
            // borderBottom: "1px solid rgba(6,182,212,0.1)", // Removed border for cleaner look
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              className="gradient-text"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: "900",
                letterSpacing: "-0.02em",
                marginBottom: "4px",
                lineHeight: "1",
              }}
            >
              CALENDAR
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radar size={12} className="text-cyan-500 animate-spin-slow" />
              <p
                style={{
                  color: "rgba(6,182,212,0.8)",
                  fontSize: "0.65rem",
                  fontWeight: "500",
                  fontFamily: "var(--font-tech)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textShadow: "0 0 5px rgba(6,182,212,0.4)",
                }}
              >
                PULSE RADAR ACTIVE
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* Add Event Button Placeholder */}
            <button
              className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0];
                handleDateClick(todayStr);
              }}
            >
              <Plus size={20} strokeWidth={3} />
            </button>

            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hex-avatar-hud"
                style={{
                  background: user.avatar_color,
                  width: "36px",
                  height: "36px",
                  fontSize: "1rem",
                }}
                onClick={() => setShowAccount(true)}
              >
                {user.nickname?.charAt(0)}
              </motion.div>
            )}
          </div>
        </header>

        {/* Pulse Summary Card */}
        <PulseSummary />

        {/* Main Calendar View */}
        <div className="mb-8">
          <Calendar
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            events={allEvents}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
            onDateClick={handleDateClick}
          />
        </div>

        {/* Today's Pulse Stream */}
        <div className="mb-4 flex items-center gap-2">
          <Activity size={16} className="text-accent-primary" />
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Today's Pulse
          </h3>
        </div>

        <section
          className="pulse-stream-section"
          style={{ position: "relative", minHeight: "30vh" }}
        >
          <PulseTimeline events={todayEvents} members={[]} currentUser={user} />
        </section>
      </div>

      {/* Modals */}
      {showAccount && user && (
        <div
          className="modal-overlay"
          onClick={() => setShowAccount(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <CosmicCard
            style={{ maxWidth: "480px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  fontSize: "1.5rem",
                }}
              >
                我的账户
              </h2>
              <button
                onClick={() => setShowAccount(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                className="avatar avatar-lg"
                style={{
                  background: user.avatar_color,
                  margin: "0 auto 12px",
                  width: 64,
                  height: 64,
                  fontSize: "1.5rem",
                }}
              >
                {user.nickname?.charAt(0)}
              </div>
              <h3 style={{ fontSize: "1.2rem" }}>{user.nickname}</h3>
            </div>

            <div className="token-display">
              <span className="token-label">访问令牌 (Access Token)</span>
              <span className="token-value">
                {localStorage.getItem("token")}
              </span>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                ⚠️
                这是你进入账户的唯一凭证，请妥善保存。你可以在其他设备上使用此令牌登录。
              </p>
            </div>

            <button
              className="btn-cosmic"
              onClick={handleCopyToken}
              style={{ marginBottom: "12px", width: "100%" }}
            >
              📋 复制令牌
            </button>
            <button
              className="btn-danger btn-full"
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "14px 32px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "999px",
                color: "#fca5a5",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              🚪 退出登录
            </button>
          </CosmicCard>
        </div>
      )}

      {/* Event Modal */}
      <AnimatePresence>
        {(selectedDate || editingEvent) && (
          <EventModal
            date={selectedDate}
            event={editingEvent || {}}
            events={allEvents}
            members={allMembers}
            currentUser={user}
            onClose={() => {
              setSelectedDate(null);
              setEditingEvent(null);
            }}
            onSave={handleSaveEvent}
            onDelete={() => {
              showToast("火花已熄灭 (Moved to Trash)");
              setSelectedDate(null);
              setEditingEvent(null);
            }}
            onRSVP={() => showToast("已回复请求")}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

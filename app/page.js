"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import FAB from "@/components/FAB";
import VibeSlider from "@/components/VibeSlider";
import PulseTimeline from "@/components/PulseTimeline";
import CosmicCard from "@/components/CosmicCard";

export default function HomePage() {
  const [spaces, setSpaces] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [battery, setBattery] = useState({ level: 100, status: "active" });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
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
        setTodayEvents(todayData.events || []);
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

  const getBatteryColor = (lvl) => {
    if (lvl <= 20) return "#ef4444";
    if (lvl <= 50) return "#f59e0b";
    return "#22c55e";
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

      <div className="container">
        <header
          className="page-header"
          style={{ justifyContent: "space-between", padding: "40px 0" }}
        >
          <div>
            <h1
              className="gradient-text"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.5rem",
                fontWeight: "900",
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              PULSE RADAR
            </h1>
            {user && (
              <p
                style={{
                  color: "var(--cosmic-cyan)",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  fontFamily: "var(--font-tech)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Synchronizing lives, not managing time
              </p>
            )}
          </div>
          {user && (
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="avatar"
              style={{
                background: user.avatar_color,
                cursor: "pointer",
                width: "40px",
                height: "40px",
                fontSize: "0.95rem",
                border: "2px solid rgba(6,182,212,0.5)",
                boxShadow: "0 0 16px rgba(6,182,212,0.3), inset 0 0 8px rgba(6,182,212,0.1)",
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                borderRadius: "0",
              }}
              onClick={() => setShowAccount(true)}
            >
              {user.nickname?.charAt(0)}
            </motion.div>
          )}
        </header>

        <div className="pulse-grid">
          <div className="pulse-center">
            {/* V3.2 Social Pulse Timeline Section */}
            <section
              className="dashboard-section"
              style={{ marginBottom: "40px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "24px",
                    background: "var(--cosmic-cyan)",
                    borderRadius: "2px",
                    boxShadow: "0 0 10px var(--cosmic-cyan)",
                  }}
                />
                <h3
                  className="holo-text"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.25rem",
                    fontWeight: "700",
                  }}
                >
                  ✨ 社交脉搏
                </h3>
              </div>

              <PulseTimeline
                events={todayEvents}
                members={[]}
                currentUser={user}
              />
            </section>

            <section className="spaces-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "24px",
                    background: "var(--cosmic-purple)",
                    borderRadius: "2px",
                    boxShadow: "0 0 10px var(--cosmic-purple)",
                  }}
                />
                <h3
                  className="holo-text"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.25rem",
                    fontWeight: "700",
                  }}
                >
                  🏘️ 你的空间
                </h3>
              </div>

              {spaces.length === 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  {/* Join Space — console button */}
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowJoin(true)}
                    style={{
                      padding: '24px 16px',
                      background: 'rgba(6,182,212,0.04)',
                      border: '1px dashed rgba(6,182,212,0.2)',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(6,182,212,0.1)',
                      border: '1px solid rgba(6,182,212,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', color: 'var(--cosmic-cyan)',
                    }}>🔗</div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '700',
                      fontFamily: 'var(--font-tech)',
                      color: 'var(--cosmic-cyan)',
                      letterSpacing: '0.08em',
                    }}>加入空间</span>
                    <span style={{
                      fontSize: '0.55rem', color: 'var(--text-muted)',
                      fontFamily: 'var(--font-tech)', opacity: 0.5,
                    }}>输入邀请码</span>
                  </motion.button>

                  {/* Create Space — console button */}
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(139,92,246,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCreate(true)}
                    style={{
                      padding: '24px 16px',
                      background: 'rgba(139,92,246,0.04)',
                      border: '1px dashed rgba(139,92,246,0.2)',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', color: 'var(--accent-primary)',
                    }}>✦</div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '700',
                      fontFamily: 'var(--font-tech)',
                      color: 'var(--accent-primary)',
                      letterSpacing: '0.08em',
                    }}>创建空间</span>
                    <span style={{
                      fontSize: '0.55rem', color: 'var(--text-muted)',
                      fontFamily: 'var(--font-tech)', opacity: 0.5,
                    }}>新建频道</span>
                  </motion.button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {spaces.map((space) => (
                    <Link key={space.id} href={`/space/${space.id}`}>
                      <motion.div
                        whileHover={{
                          y: -5,
                          borderColor: "var(--accent-primary)",
                        }}
                        className="card space-card"
                        style={{
                          padding: "24px",
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          className="space-card-icon"
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            background: "var(--bg-secondary)",
                            color: "var(--accent-primary)",
                            fontSize: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(168, 85, 247, 0.2)",
                          }}
                        >
                          🪐
                        </div>
                        <div className="space-card-info" style={{ flex: 1 }}>
                          <h3
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: "800",
                              color: "#FFF",
                            }}
                          >
                            {space.name}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {space.member_count} 成员已就绪
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="pulse-right desktop-only">
            <div
              style={{
                position: "sticky",
                top: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <div
                style={{
                  background: 'rgba(2,6,23,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'inset 0 0 20px rgba(139,92,246,0.04)',
                }}
              >
                <h3
                  className="holo-text"
                  style={{
                    marginBottom: "20px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ⚡ 社交电池
                </h3>
                <VibeSlider
                  initialLevel={battery.level}
                  onVibeChange={(lvl, vibe) => updateBattery(lvl, vibe)}
                />
              </div>

              <div
                style={{
                  background: 'rgba(2,6,23,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'inset 0 0 20px rgba(139,92,246,0.04)',
                }}
              >
                <h3
                  className="holo-text"
                  style={{
                    marginBottom: "20px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  📡 实时雷达
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {todayEvents.slice(0, 6).map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        className="avatar avatar-sm"
                        style={{
                          background: e.avatar_color,
                          width: "32px",
                          height: "32px",
                        }}
                      >
                        {e.nickname?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                          {e.nickname}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {e.note || "同步中..."}
                        </div>
                      </div>
                      {e.status === "party" && (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--energy-high)",
                            boxShadow: "0 0 8px var(--energy-high)",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom Actions for Mobile */}
      <div
        className="container mobile-only"
        style={{ marginTop: "40px", paddingBottom: "120px" }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-secondary"
            onClick={() => setShowJoin(true)}
            style={{
              flex: 1,
              padding: "20px",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>🔗</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
              加入空间
            </span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowCreate(true)}
            style={{
              flex: 1,
              padding: "20px",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>➕</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
              创建空间
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .mobile-only {
          display: block;
        }
        .desktop-only {
          display: none;
        }
        @media (min-width: 1024px) {
          .mobile-only {
            display: none;
          }
          .desktop-only {
            display: block;
          }
          .container {
            max-width: 1280px;
          }
        }
      `}</style>

      {/* Account Modal */}
      <style jsx>{`
        .mobile-only {
          display: block;
        }
        .desktop-only {
          display: none;
        }

        @media (min-width: 1024px) {
          .mobile-only {
            display: none;
          }
          .desktop-only {
            display: block;
          }
          .container {
            max-width: 1200px;
          }
        }
      `}</style>

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

      {/* Create Space Modal */}
      {showCreate && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreate(false)}
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
                创建新空间
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSpace}>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--cosmic-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  空间名称
                </label>
                <input
                  className="cosmic-input"
                  placeholder="例如：老友聚会群"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  autoFocus
                  maxLength={30}
                />
              </div>
              <button
                className="btn-cosmic"
                type="submit"
                disabled={actionLoading || !newSpaceName.trim()}
                style={{ width: "100%" }}
              >
                {actionLoading ? "创建中..." : "创建空间 →"}
              </button>
            </form>
          </CosmicCard>
        </div>
      )}

      {/* Join Space Modal */}
      {showJoin && (
        <div
          className="modal-overlay"
          onClick={() => setShowJoin(false)}
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
                加入空间
              </h2>
              <button
                onClick={() => setShowJoin(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJoinSpace}>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--cosmic-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  邀请码
                </label>
                <input
                  className="cosmic-input"
                  placeholder="输入6位邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  autoFocus
                  maxLength={6}
                  style={{
                    letterSpacing: "4px",
                    textAlign: "center",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                  }}
                />
              </div>
              <button
                className="btn-cosmic"
                type="submit"
                disabled={actionLoading || inviteCode.trim().length < 6}
                style={{ width: "100%" }}
              >
                {actionLoading ? "加入中..." : "加入空间 →"}
              </button>
            </form>
          </CosmicCard>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

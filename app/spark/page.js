"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Ghost } from "lucide-react";
import CosmicCard from "@/components/CosmicCard";

export default function SparkPage() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [ghostMode, setGhostMode] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const res = await fetch("/api/spaces", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setSpaces(data.spaces || []);
      if (data.spaces?.length > 0) setSelectedSpaceId(data.spaces[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!input.trim()) {
        setParsed(null);
        return;
      }
      const res = await fetch("/api/engine/ignite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          text: input,
          spaceId: selectedSpaceId,
          previewOnly: true,
        }),
      });
      const data = await res.json();
      if (data.spark) setParsed(data.spark);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, selectedSpaceId]);

  const handleIgnite = async () => {
    if (!input.trim() || !selectedSpaceId) return;
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate([10, 30, 10, 30]);
    setLoading(true);
    try {
      const res = await fetch("/api/engine/ignite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          text: input,
          spaceId: selectedSpaceId,
          ghost: ghostMode,
        }),
      });
      const data = await res.json();
      if (data.success) router.push(`/space/${selectedSpaceId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page spark-page"
      style={{
        background: "#030014",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "40vh",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Command Bar Container — centered, narrow on desktop */}
      <div
        className="container"
        style={{
          maxWidth: "580px",
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
          padding: "0 20px",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          style={{
            color: "var(--text-muted)",
            marginBottom: "40px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
        </motion.button>

        <header style={{ marginBottom: "36px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              className="gradient-text"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.5rem",
                fontWeight: "900",
                letterSpacing: "-0.04em",
                lineHeight: "1",
              }}
            >
              What's the vibe?
            </h1>
            <p
              className="font-tech"
              style={{
                color: "var(--cosmic-cyan)",
                fontSize: "0.9rem",
                marginTop: "10px",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              发射一个火花，同步你的生命瞬间
            </p>
          </motion.div>
        </header>

        {/* Borderless Input Area */}
        <div style={{ position: "relative", marginBottom: "32px" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：明晚7点在老地方火锅..."
            style={{
              width: "100%",
              fontSize: "1.5rem",
              fontWeight: "700",
              resize: "none",
              minHeight: "90px",
              fontFamily: "inherit",
              padding: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: "16px",
              color: "white",
              outline: "none",
              letterSpacing: "0.02em",
              lineHeight: "1.4",
            }}
          />
          {/* Bottom neon progress line */}
          <div
            style={{
              height: "2px",
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "1px",
              position: "relative",
              marginTop: "2px",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                background:
                  "linear-gradient(90deg, var(--cosmic-cyan), var(--accent-primary))",
                boxShadow: "0 0 10px var(--accent-primary)",
                borderRadius: "1px",
              }}
              animate={{ width: input.length > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>

        {/* Ghost Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGhostMode(!ghostMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "20px",
              background: ghostMode
                ? "rgba(6,182,212,0.15)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                ghostMode
                  ? "rgba(6,182,212,0.4)"
                  : "rgba(255,255,255,0.06)"
              }`,
              color: ghostMode ? "var(--cosmic-cyan)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.75rem",
              fontFamily: "var(--font-tech)",
              fontWeight: "700",
              letterSpacing: "0.08em",
            }}
          >
            <Ghost size={14} />
            <span>意向试探</span>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: ghostMode
                  ? "var(--cosmic-cyan)"
                  : "rgba(255,255,255,0.15)",
                boxShadow: ghostMode
                  ? "0 0 8px var(--cosmic-cyan)"
                  : "none",
                transition: "all 0.2s",
              }}
            />
          </motion.button>
          <span
            style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              opacity: 0.5,
              fontFamily: "var(--font-tech)",
            }}
          >
            {ghostMode
              ? "对方只会看到模糊的意向信号"
              : "正常发送火花"}
          </span>
        </div>

        <AnimatePresence>
          {parsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <CosmicCard style={{ padding: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <span
                    className="font-tech"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--cosmic-cyan)",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Sparkles size={14} /> AI PREVIEW
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                    }}
                  >
                    {parsed.date || "Checking..."}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    marginBottom: "8px",
                    color: "#FFF",
                  }}
                >
                  {parsed.emoji} {parsed.title}
                </h2>
                {parsed.location && (
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#a1a1aa",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📍 {parsed.location}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <select
                    value={selectedSpaceId}
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                    className="cosmic-input"
                    style={{
                      fontSize: "0.85rem",
                      flex: 1,
                      padding: "10px 16px",
                    }}
                  >
                    {spaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CosmicCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            marginTop: "40px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="btn-cosmic"
            onClick={handleIgnite}
            disabled={loading || !input.trim()}
            style={{
              padding: "16px 40px",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              maxWidth: "280px",
            }}
          >
            {loading ? (
              "Igniting..."
            ) : (
              <>
                Ignite Spark <Zap size={18} fill="currentColor" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

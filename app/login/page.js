"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Key, User as UserIcon } from "lucide-react";
import CosmicCard from "@/components/CosmicCard";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [mode, setLoginMode] = useState("register"); // 'register' or 'token'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "register") {
      if (!nickname.trim()) return;
      handleRegister();
    } else {
      if (!tokenInput.trim()) return;
      handleTokenLogin();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError(err.message || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${tokenInput.trim()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("无效的令牌，请检查后重试");
      localStorage.setItem("token", tokenInput.trim());
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen relative overflow-hidden"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background is handled by globals.css body::before */}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md px-4"
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "1rem",
          zIndex: 10,
        }}
      >
        {/* Logo Section - Holographic Radar Ring */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              display: "inline-block",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2px dashed var(--cosmic-cyan)",
                boxShadow:
                  "0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--accent-gradient)",
                  boxShadow: "0 0 20px rgba(139,92,246,0.8)",
                }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="gradient-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3rem",
              fontWeight: "900",
              letterSpacing: "0.1em",
              marginBottom: "0.75rem",
            }}
          >
            NEXUS
          </motion.h1>
          <p
            style={{
              fontFamily: "var(--font-tech)",
              color: "var(--cosmic-cyan)",
              fontSize: "1.2rem",
              marginTop: "0.5rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Synchronizing Lives
          </p>
        </div>

        <CosmicCard>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div style={{ marginBottom: "8px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  color: "white",
                  marginBottom: "4px",
                }}
              >
                {mode === "register" ? "INITIATE SEQUENCE" : "ACCESS PORTAL"}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {mode === "register"
                  ? "Create your unique identity signal."
                  : "Enter your access token."}
              </p>
            </div>

            {mode === "register" ? (
              <div className="group">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--cosmic-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Identity / Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. StarWalker"
                  className="cosmic-input"
                  autoFocus
                />
              </div>
            ) : (
              <div className="group">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--cosmic-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Access Token
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste token here..."
                  className="cosmic-input"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "#fca5a5",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>⚠️</span> {error}
              </motion.div>
            )}

            <button type="submit" className="btn-cosmic" disabled={loading}>
              {loading ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    className="animate-spin"
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></span>
                  Processing...
                </span>
              ) : mode === "register" ? (
                "Begin Journey →"
              ) : (
                "Connect System →"
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMode(mode === "register" ? "token" : "register");
                  setError("");
                }}
                className="sci-fi-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px",
                  cursor: "pointer",
                }}
              >
                {mode === "register"
                  ? "I have an existing token"
                  : "Create new identity"}
              </button>
            </div>
          </form>
        </CosmicCard>
      </motion.div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

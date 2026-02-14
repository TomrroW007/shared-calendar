"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Zap, Layers, Info } from "lucide-react";

export default function DesktopSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Pulse", icon: <Activity size={20} strokeWidth={2} />, path: "/" },
    { label: "Spark", icon: <Zap size={20} strokeWidth={2} />, path: "/spark" },
    {
      label: "Memories",
      icon: <Layers size={20} strokeWidth={2} />,
      path: "/memories",
    },
  ];

  return (
    <aside
      className="desktop-sidebar"
      style={{
        background: "rgba(15,23,42,0.4)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(6,182,212,0.1)",
      }}
    >
      <div style={{ marginBottom: "60px", padding: "0 12px" }}>
        <h2
          className="gradient-text"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: "900",
            letterSpacing: "-0.04em",
          }}
        >
          NEXUS
        </h2>
        <div
          style={{
            width: "20px",
            height: "3px",
            background:
              "linear-gradient(90deg, var(--cosmic-purple), var(--cosmic-cyan))",
            marginTop: "4px",
            borderRadius: "2px",
            boxShadow: "0 0 8px var(--cosmic-cyan)",
          }}
        />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="font-tech"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 20px",
                borderRadius: "16px",
                color: isActive
                  ? "var(--cosmic-cyan)"
                  : "var(--text-secondary)",
                background: isActive ? "rgba(6,182,212,0.1)" : "transparent",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontWeight: isActive ? "800" : "500",
                border: isActive
                  ? "1px solid rgba(6,182,212,0.3)"
                  : "1px solid transparent",
                boxShadow: isActive
                  ? "0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.1)"
                  : "none",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span
                style={{ color: isActive ? "var(--cosmic-cyan)" : "inherit" }}
              >
                {item.icon}
              </span>
              <span style={{ fontSize: "0.9rem" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", padding: "12px" }}>
        <div
          style={{
            padding: "20px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "24px",
            border: "1px solid var(--glass-stroke)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.05) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          <p
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Info size={14} />{" "}
            <span>
              Tip: Press{" "}
              <kbd
                style={{
                  background: "#111",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  color: "#FFF",
                }}
              >
                C
              </kbd>{" "}
              to spark.
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

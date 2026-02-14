"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Zap, Layers } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Pulse",
      icon: <Activity size={24} strokeWidth={1.5} />,
      path: "/",
    },
    {
      label: "Spark",
      icon: <Zap size={24} strokeWidth={1.5} />,
      path: "/spark",
    },
    {
      label: "Memories",
      icon: <Layers size={24} strokeWidth={1.5} />,
      path: "/memories",
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        padding: "0 20px",
        gap: "4px",
        background: "rgba(3,0,20,0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "none",
        position: "relative",
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
            style={{
              position: "relative",
              flex: 1,
              height: "100%",
              justifyContent: "center",
            }}
          >
            <span
              className="nav-icon"
              style={{
                zIndex: 2,
                transition: "all 0.3s",
                color: isActive
                  ? "var(--cosmic-cyan)"
                  : "var(--text-secondary)",
              }}
            >
              {item.icon}
            </span>
            <span
              className="font-tech"
              style={{
                fontSize: "0.65rem",
                fontWeight: "800",
                zIndex: 2,
                opacity: isActive ? 1 : 0.5,
                color: isActive ? "var(--cosmic-cyan)" : "inherit",
              }}
            >
              {item.label}
            </span>

            {isActive && (
              <>
                <motion.div
                  layoutId="nav-glow"
                  style={{
                    position: "absolute",
                    width: "60px",
                    height: "60px",
                    background:
                      "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
                    borderRadius: "50%",
                    filter: "blur(20px)",
                    zIndex: 1,
                  }}
                />
                <motion.div
                  layoutId="nav-border"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "50%",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, transparent, var(--cosmic-cyan), transparent)",
                    zIndex: 3,
                  }}
                />
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

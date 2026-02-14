"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, BarChart2, CheckSquare, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Calendar",
      icon: <Calendar size={24} strokeWidth={1.5} />,
      path: "/",
    },
    {
      label: "Insights",
      icon: <BarChart2 size={24} strokeWidth={1.5} />,
      path: "/insights",
    },
    {
      label: "Tasks",
      icon: <CheckSquare size={24} strokeWidth={1.5} />,
      path: "/tasks",
    },
    {
      label: "Profile",
      icon: <User size={24} strokeWidth={1.5} />,
      path: "/profile",
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav holo-dock"
      style={{
        padding: "0 20px",
        gap: "4px",
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
            {isActive && (
              <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full transform scale-50" />
            )}
            <span
              className="nav-icon"
              style={{
                zIndex: 2,
                transition: "all 0.3s",
                color: isActive
                  ? "var(--cosmic-cyan)"
                  : "var(--text-secondary)",
                filter: isActive
                  ? "drop-shadow(0 0 8px var(--cosmic-cyan))"
                  : "none",
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
                marginTop: "4px",
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

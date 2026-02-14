"use client";

/**
 * Cosmic HUD Showcase Page
 * 演示所有 v3.3 组件和样式的示例页面
 */

import { useState } from "react";
import CosmicCard from "@/components/CosmicCard";
import NeonInput from "@/components/NeonInput";
import NeonButton from "@/components/NeonButton";

export default function CosmicShowcase() {
  const [inputValue, setInputValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "60px",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🪐</div>
        <h1
          className="gradient-text"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "3rem",
            marginBottom: "12px",
            letterSpacing: "0.05em",
          }}
        >
          COSMIC HUD
        </h1>
        <p
          style={{
            color: "var(--cosmic-cyan)",
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: "0 auto",
            fontFamily: "var(--font-tech)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Shared Calendar v3.3.1 视觉系统
        </p>
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "32px",
          marginBottom: "40px",
        }}
      >
        {/* Card 1: Basic Inputs */}
        <CosmicCard>
          <h3
            style={{
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            01 // Neon Inputs
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "var(--accent-cyan)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              Identity
            </label>
            <NeonInput
              type="text"
              placeholder="Enter name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "var(--accent-cyan)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              Email Address
            </label>
            <NeonInput
              type="email"
              placeholder="user@nexus.space"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>

          <NeonButton style={{ width: "100%" }}>Submit →</NeonButton>
        </CosmicCard>

        {/* Card 2: Typography */}
        <CosmicCard>
          <h3
            style={{
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            02 // Typography
          </h3>

          <h1
            className="holo-text"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              marginBottom: "12px",
            }}
          >
            Holographic Text
          </h1>

          <h2
            className="gradient-text"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              marginBottom: "12px",
            }}
          >
            Gradient Glow Text
          </h2>

          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "16px",
              lineHeight: "1.7",
            }}
          >
            This is regular body text using Inter Tight font. It&apos;s
            optimized for readability on dark cosmic backgrounds.
          </p>

          <p
            style={{
              fontFamily: "var(--font-tech)",
              color: "var(--cosmic-cyan)",
              fontSize: "0.875rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Tech Font: Orbitron/Rajdhani
          </p>

          <div style={{ marginTop: "12px" }}>
            <a href="#" className="sci-fi-link">
              Sci-Fi Link (hover me)
            </a>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: "8px",
            }}
          >
            <code
              style={{
                color: "var(--accent-cyan)",
                fontSize: "0.85rem",
              }}
            >
              color: var(--accent-cyan)
            </code>
          </div>
        </CosmicCard>

        {/* Card 3: Buttons */}
        <CosmicCard>
          <h3
            style={{
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            03 // Buttons
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <NeonButton>🚀 Primary Action</NeonButton>

            <button
              className="btn-secondary"
              style={{
                padding: "14px 32px",
                borderRadius: "999px",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              Secondary Action
            </button>

            <button
              style={{
                padding: "14px 32px",
                background: "transparent",
                border: "1px solid var(--glass-stroke)",
                borderRadius: "999px",
                color: "var(--text-secondary)",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Ghost Button
            </button>
          </div>
        </CosmicCard>
      </div>

      {/* Full Width Card: Advanced Components */}
      <CosmicCard style={{ marginBottom: "40px" }}>
        <h3
          style={{
            color: "var(--accent-cyan)",
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            marginBottom: "32px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          04 // Advanced Components
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Hexagon Avatar */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "12px",
                letterSpacing: "0.1em",
              }}
            >
              Hexagon Avatar
            </p>
            <div
              className="hex-avatar"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              👤
            </div>
          </div>

          {/* Energy Timeline */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "12px",
                letterSpacing: "0.1em",
              }}
            >
              Energy Timeline
            </p>
            <div className="energy-timeline" style={{ height: "100px" }} />
          </div>

          {/* Day Marker Dots */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "12px",
                letterSpacing: "0.1em",
              }}
            >
              Day Marker Dots
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <div className="day-marker-dot" />
              <div className="day-marker-dot" />
              <div className="day-marker-dot" />
              <div className="day-marker-dot" />
              <div className="day-marker-dot" />
            </div>
          </div>
        </div>
      </CosmicCard>

      {/* Color Palette */}
      <CosmicCard corners={false}>
        <h3
          style={{
            color: "var(--accent-cyan)",
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            marginBottom: "32px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          05 // Color Palette
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            { name: "Cyber Grape", value: "#8b5cf6" },
            { name: "Electric Blue", value: "#3b82f6" },
            { name: "Cyan Highlight", value: "#06b6d4" },
            { name: "Pure White", value: "#ffffff" },
            { name: "Ice Blue Gray", value: "#e2e8f0" },
            { name: "Void Black", value: "#030014" },
          ].map((color) => (
            <div key={color.value}>
              <div
                style={{
                  width: "100%",
                  height: "80px",
                  background: color.value,
                  borderRadius: "12px",
                  marginBottom: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: `0 4px 12px ${color.value}40`,
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                }}
              >
                {color.name}
              </p>
              <code
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                {color.value}
              </code>
            </div>
          ))}
        </div>
      </CosmicCard>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "60px",
          paddingTop: "40px",
          borderTop: "1px solid var(--glass-stroke)",
        }}
      >
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
          }}
        >
          Cosmic HUD v3.3 • Shared Calendar by Nexus
        </p>
      </div>
    </div>
  );
}

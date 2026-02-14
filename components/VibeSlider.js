'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const VIBES = [
  { id: 'focus', label: '仅限紧急', emoji: '🔋', text: 'I need space', color: '#4FD1C5', level: 20 },
  { id: 'chill', label: '开放闲聊', emoji: '☕', text: 'Up for coffee', color: '#B692F6', level: 60 },
  { id: 'party', label: '来嗨！', emoji: '🔥', text: "Let's rage", color: '#FF6B00', level: 100 },
];

export default function VibeSlider({ initialLevel, onVibeChange }) {
  const [level, setLevel] = useState(initialLevel || 60);
  const [activeVibe, setActiveVibe] = useState(VIBES[1]);

  useEffect(() => {
    const closest = VIBES.reduce((prev, curr) => 
      Math.abs(curr.level - level) < Math.abs(prev.level - level) ? curr : prev
    );
    setActiveVibe(closest);
  }, [level]);

  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    setLevel(val);
  };

  const handleMouseUp = () => {
    onVibeChange(level, activeVibe.id);
  };

  const handleSegmentClick = (v) => {
    setLevel(v.level);
    onVibeChange(v.level, v.id);
  };

  return (
    <div className="vibe-slider-container" style={{ margin: '20px 0' }}>
      {/* Mobile Slider View */}
      <div className="mobile-only">
        <div className="vibe-info" style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="vibe-emoji" style={{ fontSize: '2.5rem', marginBottom: '4px' }}>
            {activeVibe.emoji}
          </div>
          <div className="vibe-text" style={{ 
            fontSize: '1.1rem', 
            fontWeight: '700',
            color: activeVibe.color,
            transition: 'color 0.3s'
          }}>
            {activeVibe.text}
          </div>
        </div>
        
        <div className="slider-wrapper" style={{ position: 'relative', padding: '0 10px' }}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={level} 
            onChange={handleChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="vibe-range-input"
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              appearance: 'none',
              background: 'var(--border-color)', /* Zinc-800 subtle track */
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <div className="vibe-labels" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '8px',
          padding: '0 4px'
        }}>
          {VIBES.map(v => (
            <span key={v.id} style={{ 
              fontSize: '0.65rem', 
              color: activeVibe.id === v.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeVibe.id === v.id ? '700' : '500',
              transition: 'all 0.3s'
            }}>
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop Segmented Control View */}
      <div className="desktop-only">
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>{activeVibe.emoji}</span>
          <div>
            <div style={{ fontWeight: '900', color: '#FFF', fontSize: '1rem' }}>{activeVibe.text}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{activeVibe.label}</div>
          </div>
        </div>
        <div className="segmented-control" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-stroke)', padding: '6px', borderRadius: '20px' }}>
          {VIBES.map(v => (
            <motion.div 
              key={v.id} 
              whileHover={{ background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.95 }}
              className={`segmented-item ${activeVibe.id === v.id ? 'active' : ''}`}
              onClick={() => handleSegmentClick(v)}
              style={{
                borderRadius: '14px',
                padding: '10px',
                background: activeVibe.id === v.id ? 'var(--accent-primary)' : 'transparent',
                color: activeVibe.id === v.id ? '#000' : 'var(--text-muted)',
                boxShadow: activeVibe.id === v.id ? '0 4px 15px var(--accent-glow)' : 'none'
              }}
            >
              {v.emoji}
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .mobile-only { display: block; }
        .desktop-only { display: none; }
        
        @media (min-width: 1024px) {
          .mobile-only { display: none; }
          .desktop-only { display: block; }
        }

        .vibe-range-input::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FFF;
          border: 4px solid var(--accent-primary);
          cursor: pointer;
          box-shadow: 0 0 20px var(--accent-glow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vibe-range-input::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}

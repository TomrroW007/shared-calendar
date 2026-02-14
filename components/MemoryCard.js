'use client';

import { motion } from 'framer-motion';
import { Calendar, Flame } from 'lucide-react';

const VIBE_COLORS = {
  high: '#FF6B00',
  medium: '#A855F7',
  low: '#22D3EE'
};

export default function MemoryCard({ memory, index }) {
  const isLeft = index % 2 === 0;
  const vibeColor = memory.vibe_score > 80 ? VIBE_COLORS.high : memory.vibe_score > 50 ? VIBE_COLORS.medium : VIBE_COLORS.low;

  return (
    <motion.div 
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`memory-node ${isLeft ? 'left' : 'right'}`} 
      style={{
        display: 'flex',
        flexDirection: isLeft ? 'row' : 'row-reverse',
        alignItems: 'center',
        marginBottom: '100px',
        position: 'relative',
        width: '100%'
      }}
    >
      {/* Connector Dot */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: vibeColor,
          boxShadow: `0 0 20px ${vibeColor}`,
          zIndex: 10,
          border: '3px solid rgba(255,255,255,0.2)'
        }} 
      />

      {/* Content Card */}
      <motion.div 
        whileHover={{ scale: 1.02, borderColor: vibeColor }}
        style={{
          width: '44%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '28px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          textAlign: isLeft ? 'right' : 'left',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(135deg, ${vibeColor}05 0%, transparent 100%)`, pointerEvents: 'none' }} />
        
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isLeft ? 'flex-end' : 'flex-start', fontWeight: '700' }}>
          <Calendar size={14} /> {new Date(memory.created_at).toLocaleDateString()}
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '16px', color: '#FFF', letterSpacing: '-0.02em' }}>
          {memory.event_id?.title || '精彩回忆'}
        </h3>
        
        {memory.assets?.[0] && (
          <div style={{ 
            width: '100%', 
            aspectRatio: '16/10', 
            borderRadius: '20px', 
            overflow: 'hidden',
            marginBottom: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <img src={memory.assets[0].url} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: isLeft ? 'flex-end' : 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} fill="#FF6B00" stroke="none" /> {memory.streak_count || 1}
          </span>
          <span style={{ fontSize: '0.75rem', background: `${vibeColor}15`, color: vibeColor, padding: '6px 12px', borderRadius: '14px', fontWeight: '900' }}>
            {memory.vibe_score}% VIBE
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

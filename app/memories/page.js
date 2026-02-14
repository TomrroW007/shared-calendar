'use client';

import { useState, useEffect } from 'react';
import MemoryCard from '@/components/MemoryCard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CosmicCard from '@/components/CosmicCard';

export default function MemoriesPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page memories-page" style={{ paddingBottom: '120px', background: '#030014' }}>
      <div className="container" style={{ position: 'relative' }}>
        <header style={{ padding: '60px 0', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3rem',
              fontWeight: '900',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '12px',
              letterSpacing: '-0.04em'
            }}>Memory Chain</h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', fontWeight: '600' }}>
              生命的沉淀 <span style={{ opacity: 0.3 }}>/</span> DNA 螺旋演进
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginTop: '40px' }}
          >
            <CosmicCard corners={false} style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div className="emoji" style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.3))' }}>💎</div>
              <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginTop: '24px', marginBottom: '32px', lineHeight: '1.8' }}>
                还没有沉淀的回忆<br />点燃火花，开启你的 DNA 进化链
              </p>
              <button className="btn-cosmic" onClick={() => router.push('/spark')} style={{ maxWidth: '240px', padding: '14px 32px' }}>创造第一颗火花</button>
            </CosmicCard>
          </motion.div>
        ) : (
          <div className="memory-timeline" style={{ position: 'relative', marginTop: '60px' }}>
            {/* DNA Helix Background Lines */}
            <div className="dna-helix-bg" style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '60px',
              transform: 'translateX(-50%)',
              zIndex: 1
            }}>
              <div className="helix-strand strand-a"></div>
              <div className="helix-strand strand-b"></div>
            </div>

            {/* Memory Nodes */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {memories.map((m, i) => (
                <MemoryCard key={m._id} memory={m} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .helix-strand {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, #A855F7, #4F46E5, #22D3EE, #A855F7);
          background-size: 100% 600px;
          animation: helixFlow 15s linear infinite;
          opacity: 0.3;
        }
        .strand-a {
          left: 15px;
          border-radius: 4px;
          box-shadow: 0 0 20px rgba(168,85,247,0.5);
        }
        .strand-b {
          right: 15px;
          border-radius: 4px;
          box-shadow: 0 0 20px rgba(34,211,238,0.5);
          animation-delay: -7.5s;
        }

        @keyframes helixFlow {
          from { background-position: 0 0; }
          to { background-position: 0 600px; }
        }
      `}</style>
    </div>
  );
}

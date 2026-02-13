'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Toggle Palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search Logic (Spaces)
    const fetchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/spaces', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            const filtered = (data.spaces || []).filter(s => 
                s.name.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) fetchResults(search);
        }, 200);
        return () => clearTimeout(timer);
    }, [search, isOpen, fetchResults]);

    if (!isOpen) return null;

    return (
        <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
            <div className="cmd-content" onClick={e => e.stopPropagation()}>
                <div className="cmd-header">
                    <span className="cmd-icon">🔍</span>
                    <input 
                        className="cmd-input" 
                        placeholder="搜索空间或命令... (Try: 'Family')" 
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <kbd className="cmd-shortcut">ESC</kbd>
                </div>
                
                <div className="cmd-list">
                    {loading && <div className="cmd-item">搜索中...</div>}
                    
                    {!loading && results.length > 0 && (
                        <>
                            <div className="cmd-group-label">跳转至空间</div>
                            {results.map(s => (
                                <div key={s.id} className="cmd-item" onClick={() => {
                                    router.push(`/space/${s.id}`);
                                    setIsOpen(false);
                                }}>
                                    <span className="cmd-item-icon">📅</span>
                                    <span className="cmd-item-name">{s.name}</span>
                                    <span className="cmd-item-meta">{s.member_count} 成员</span>
                                </div>
                            ))}
                        </>
                    )}

                    {!loading && search.length > 0 && results.length === 0 && (
                        <div className="cmd-empty">未找到匹配的空间</div>
                    )}

                    <div className="cmd-group-label">快捷操作</div>
                    <div className="cmd-item" onClick={() => { router.push('/'); setIsOpen(false); }}>
                        <span className="cmd-item-icon">🏠</span>
                        <span className="cmd-item-name">回到首页</span>
                    </div>
                    <div className="cmd-item" onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('open-create-space')); }}>
                        <span className="cmd-item-icon">➕</span>
                        <span className="cmd-item-name">创建新空间</span>
                    </div>
                </div>
                
                <div className="cmd-footer">
                    <span>键盘 <b>↑↓</b> 选择</span>
                    <span><b>Enter</b> 确认</span>
                </div>
            </div>
        </div>
    );
}

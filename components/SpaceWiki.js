'use client';

import { useState, useEffect, useCallback } from 'react';

export default function SpaceWiki({ spaceId, onClose }) {
    const [notes, setNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null); // null, 'new', or {id, title, content}
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/notes`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setNotes(data.notes || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [spaceId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleSave = async () => {
        if (!title.trim()) return;
        try {
            const res = await fetch(`/api/spaces/${spaceId}/notes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    title, 
                    content, 
                    noteId: editingNote?._id 
                })
            });
            if (res.ok) {
                setEditingNote(null);
                fetchNotes();
            }
        } catch (e) { console.error(e); }
    };

    const startEdit = (note) => {
        if (note === 'new') {
            setEditingNote('new');
            setTitle('');
            setContent('');
        } else {
            setEditingNote(note);
            setTitle(note.title);
            setContent(note.content);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>{editingNote ? (editingNote === 'new' ? '新建笔记' : '编辑笔记') : '📖 空间 Wiki'}</h2>
                    <button className="modal-close" onClick={editingNote ? () => setEditingNote(null) : onClose}>
                        {editingNote ? '取消' : '✕'}
                    </button>
                </div>

                {editingNote ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input 
                            className="input" 
                            placeholder="笔记标题..." 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                        />
                        <textarea 
                            className="input" 
                            style={{ flex: 1, resize: 'none' }} 
                            placeholder="支持 Markdown 内容..." 
                            value={content} 
                            onChange={e => setContent(e.target.value)}
                        />
                        <button className="btn btn-primary btn-full" onClick={handleSave}>保存笔记</button>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <button className="btn btn-secondary btn-full" style={{ marginBottom: '16px' }} onClick={() => startEdit('new')}>
                            ➕ 新增笔记
                        </button>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notes.map(note => (
                                <div key={note._id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => startEdit(note)}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{note.title}</h3>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {note.created_by?.nickname} 更新于 {new Date(note.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && !loading && (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    还没有笔记，点击上方按钮开始沉淀知识吧
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

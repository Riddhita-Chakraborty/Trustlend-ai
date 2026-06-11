import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send, Loader2, BookOpen, ChevronDown, ChevronUp,
    MessageCircle, UploadCloud, FileText, X, Sparkles
} from 'lucide-react';
import { startChatSession, askQuestion, endChatSession } from '../services/api';

// ── Suggested questions shown before the user types ──────────────────────────
const SUGGESTED_QUESTIONS = [
    "What is my interest rate and is it fair?",
    "What happens if I miss a payment?",
    "Can I repay this loan early without penalty?",
    "Are there any hidden charges in this agreement?",
    "What collateral is required for this loan?",
    "Does this loan comply with RBI guidelines?",
    "What are my rights if the lender changes the terms?",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CitationPill({ citation, index }) {
    const [open, setOpen] = useState(false);
    const colors = [
        '#2563eb', '#7c3aed', '#059669', '#d97706',
        '#dc2626', '#0891b2', '#9333ea'
    ];
    const color = colors[index % colors.length];

    return (
        <div style={{ marginTop: '0.4rem' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: color + '15', border: `1px solid ${color}40`,
                    borderRadius: '999px', padding: '0.15rem 0.6rem',
                    fontSize: '0.7rem', color, fontWeight: 600, cursor: 'pointer',
                }}
            >
                <BookOpen size={10} />
                {citation.source_label}
                {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {open && (
                <div style={{
                    marginTop: '0.4rem', padding: '0.6rem 0.75rem',
                    background: color + '08', borderLeft: `3px solid ${color}`,
                    borderRadius: '0 0.4rem 0.4rem 0',
                    fontSize: '0.75rem', color: 'var(--text-secondary)',
                    lineHeight: 1.6, fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {citation.excerpt}
                </div>
            )}
        </div>
    );
}

function Message({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: '1rem',
            alignItems: 'flex-start',
            gap: '0.6rem',
        }}>
            {/* Avatar */}
            {!isUser && (
                <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Sparkles size={16} color="#fff" />
                </div>
            )}

            <div style={{ maxWidth: '78%' }}>
                {/* Bubble */}
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: isUser
                        ? '1rem 1rem 0.25rem 1rem'
                        : '1rem 1rem 1rem 0.25rem',
                    background: isUser
                        ? 'var(--accent-primary)'
                        : 'var(--bg-secondary)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}>
                    {msg.content}
                </div>

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: '0.4rem', paddingLeft: '0.25rem' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            Based on:
                        </div>
                        {msg.citations.map((c, i) => (
                            <CitationPill key={i} citation={c} index={i} />
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <div style={{
                    fontSize: '0.65rem', color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    textAlign: isUser ? 'right' : 'left',
                }}>
                    {msg.time}
                </div>
            </div>

            {isUser && (
                <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)',
                }}>
                    U
                </div>
            )}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Sparkles size={16} color="#fff" />
            </div>
            <div style={{
                padding: '0.75rem 1rem', borderRadius: '1rem 1rem 1rem 0.25rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                display: 'flex', gap: '4px', alignItems: 'center',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--text-secondary)',
                        animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoanChat() {
    const [phase, setPhase]         = useState('upload');  // upload | loading | chat
    const [sessionId, setSessionId] = useState(null);
    const [filename, setFilename]   = useState('');
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState('');
    const [isAsking, setIsAsking]   = useState(false);
    const [uploadErr, setUploadErr] = useState(null);
    const [file, setFile]           = useState(null);
    const [drag, setDrag]           = useState(false);

    const bottomRef  = useRef(null);
    const inputRef   = useRef(null);
    const sessionRef = useRef(null);  // for cleanup on unmount

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAsking]);

    // Cleanup session on unmount
    useEffect(() => {
        return () => {
            if (sessionRef.current) endChatSession(sessionRef.current);
        };
    }, []);

    const now = () =>
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ── Upload handlers ───────────────────────────────────────────────────────

    const handleFile = useCallback((f) => {
        if (f) { setFile(f); setUploadErr(null); }
    }, []);

    const onDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDrag(e.type === 'dragenter' || e.type === 'dragover');
    };
    const onDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDrag(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleStart = async () => {
        if (!file) return;
        setPhase('loading');
        setUploadErr(null);
        try {
            const data = await startChatSession(file);
            sessionRef.current = data.session_id;
            setSessionId(data.session_id);
            setFilename(data.filename);
            setMessages([{
                role: 'assistant',
                content: `I've read **${data.filename}**. Ask me anything about this loan agreement — interest rates, hidden charges, penalty clauses, your rights, or anything else.`,
                citations: [],
                time: now(),
            }]);
            setPhase('chat');
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (err) {
            setUploadErr(err.message || 'Failed to process document.');
            setPhase('upload');
        }
    };

    // ── Ask handler ───────────────────────────────────────────────────────────

    const handleAsk = async (questionText) => {
        const q = (questionText || input).trim();
        if (!q || isAsking) return;
        setInput('');

        const userMsg = { role: 'user', content: q, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setIsAsking(true);

        try {
            const result = await askQuestion(sessionId, q);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content:   result.answer,
                    citations: result.citations || [],
                    time:      now(),
                }
            ]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Sorry, something went wrong: ${err.message}`,
                    citations: [],
                    time: now(),
                }
            ]);
        } finally {
            setIsAsking(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    const resetChat = () => {
        if (sessionRef.current) endChatSession(sessionRef.current);
        sessionRef.current = null;
        setPhase('upload'); setSessionId(null); setFilename('');
        setMessages([]); setInput(''); setFile(null);
    };

    // ── Render: Upload phase ──────────────────────────────────────────────────

    if (phase === 'upload' || phase === 'loading') {
        return (
            <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <MessageCircle size={36} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
                    <h2 style={{ margin: 0 }}>Ask About Your Loan</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Upload a loan agreement and ask questions in plain English.
                    </p>
                </div>

                {/* Drop zone */}
                <div
                    onDragEnter={onDrag} onDragLeave={onDrag}
                    onDragOver={onDrag} onDrop={onDrop}
                    onClick={() => document.getElementById('chat-file-input').click()}
                    style={{
                        border: `2px dashed ${drag ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        borderRadius: '0.75rem', padding: '2rem', textAlign: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                        background: drag ? 'rgba(37,99,235,0.05)' : 'transparent',
                        marginBottom: '1.25rem',
                    }}
                >
                    <input
                        id="chat-file-input" type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                    />
                    {file ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={32} color="var(--accent-primary)" />
                            <span style={{ fontWeight: 500 }}>{file.name}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <button
                                onClick={e => { e.stopPropagation(); setFile(null); }}
                                style={{
                                    background: 'none', border: '1px solid var(--border-color)',
                                    borderRadius: '999px', padding: '0.2rem 0.75rem',
                                    fontSize: '0.75rem', cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                }}
                            >
                                <X size={12} /> Remove
                            </button>
                        </div>
                    ) : (
                        <>
                            <UploadCloud size={36} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 500 }}>Drop your loan document here</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                PDF, PNG, JPG up to 16MB
                            </div>
                        </>
                    )}
                </div>

                {uploadErr && (
                    <div style={{
                        marginBottom: '1rem', padding: '0.75rem 1rem',
                        background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                        borderRadius: '0.5rem', fontSize: '0.85rem',
                    }}>
                        {uploadErr}
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={handleStart}
                    disabled={!file || phase === 'loading'}
                    style={{ width: '100%', opacity: (!file || phase === 'loading') ? 0.5 : 1 }}
                >
                    {phase === 'loading'
                        ? <><Loader2 size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />Reading document…</>
                        : 'Start Chat'
                    }
                </button>

                <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
            </div>
        );
    }

    // ── Render: Chat phase ────────────────────────────────────────────────────

    const showSuggestions = messages.length <= 1;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '72vh', minHeight: 480, maxWidth: 760, margin: '0 auto',
            border: '1px solid var(--border-color)', borderRadius: '1rem',
            overflow: 'hidden', background: 'var(--bg-primary)',
        }}>
            {/* Header */}
            <div style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MessageCircle size={20} color="var(--accent-primary)" />
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loan Assistant</div>
                        <div style={{
                            fontSize: '0.72rem', color: 'var(--text-secondary)',
                            maxWidth: 280, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }} title={filename}>
                            {filename}
                        </div>
                    </div>
                </div>
                <button
                    onClick={resetChat}
                    style={{
                        background: 'none', border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem', padding: '0.3rem 0.75rem',
                        cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem',
                    }}
                >
                    ← New document
                </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {isAsking && <TypingIndicator />}

                {/* Suggested questions */}
                {showSuggestions && !isAsking && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                            Suggested questions:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAsk(q)}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '999px',
                                        padding: '0.35rem 0.85rem',
                                        fontSize: '0.78rem', cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.borderColor = 'var(--accent-primary)';
                                        e.target.style.color = 'var(--accent-primary)';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.borderColor = 'var(--border-color)';
                                        e.target.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{
                padding: '0.875rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
            }}>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your loan… (Enter to send)"
                    disabled={isAsking}
                    rows={1}
                    style={{
                        flex: 1, resize: 'none', border: '1px solid var(--border-color)',
                        borderRadius: '0.75rem', padding: '0.65rem 0.875rem',
                        fontSize: '0.88rem', fontFamily: 'inherit',
                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                        outline: 'none', lineHeight: 1.5,
                        maxHeight: 120, overflowY: 'auto',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button
                    onClick={() => handleAsk()}
                    disabled={!input.trim() || isAsking}
                    style={{
                        width: 42, height: 42, borderRadius: '0.75rem', flexShrink: 0,
                        background: (!input.trim() || isAsking) ? 'var(--border-color)' : 'var(--accent-primary)',
                        border: 'none', cursor: (!input.trim() || isAsking) ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                    }}
                >
                    {isAsking
                        ? <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Send size={18} color="#fff" />
                    }
                </button>
            </div>
        </div>
    );
}
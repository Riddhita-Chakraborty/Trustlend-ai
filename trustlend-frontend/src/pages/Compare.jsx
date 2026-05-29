import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import FairnessMeter from '../components/FairnessMeter';
import { compareDocuments } from '../services/api';
import {
    UploadCloud, FileText, X, Loader2, CheckCircle,
    AlertTriangle, Trophy, ShieldAlert, Minus, ChevronDown, ChevronUp
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function verdictColor(verdict) {
    if (verdict === 'Fair')         return 'var(--success)';
    if (verdict === 'Needs Review') return 'var(--warning)';
    return 'var(--danger)';
}

function rateColor(rate) {
    if (!rate) return 'var(--text-primary)';
    if (rate > 25) return 'var(--danger)';
    if (rate > 18) return 'var(--warning)';
    return 'var(--success)';
}

// Parse "[A]" / "[B]" / "[=]" prefix from a diff sentence
function parseDiff(sentence) {
    const m = sentence.match(/^\[([AB=])\]\s*/);
    if (!m) return { tag: '=', text: sentence };
    return { tag: m[1], text: sentence.replace(m[0], '') };
}

// ── sub-components ────────────────────────────────────────────────────────────

function DropZone({ label, file, onFile, disabled }) {
    const [drag, setDrag] = useState(false);
    const inputId = `upload-${label.replace(/\s/g, '-')}`;

    const handle = useCallback((f) => { if (f) onFile(f); }, [onFile]);

    const onDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDrag(e.type === 'dragenter' || e.type === 'dragover');
    };
    const onDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDrag(false);
        if (e.dataTransfer.files?.[0]) handle(e.dataTransfer.files[0]);
    };

    return (
        <div
            onDragEnter={onDrag} onDragLeave={onDrag}
            onDragOver={onDrag} onDrop={onDrop}
            onClick={() => !disabled && document.getElementById(inputId).click()}
            style={{
                border: `2px dashed ${drag ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '0.75rem', padding: '2rem', textAlign: 'center',
                cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s',
                background: drag ? 'rgba(37,99,235,0.05)' : 'transparent',
                minHeight: 160, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            }}
        >
            <input
                id={inputId} type="file" accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) handle(e.target.files[0]); }}
            />

            {file ? (
                <>
                    <FileText size={32} color="var(--accent-primary)" />
                    <div style={{ fontWeight: 500 }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onFile(null); }}
                        style={{
                            background: 'none', border: '1px solid var(--border-color)',
                            borderRadius: '999px', padding: '0.2rem 0.75rem',
                            fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}
                    >
                        <X size={12} /> Remove
                    </button>
                </>
            ) : (
                <>
                    <UploadCloud size={36} color="var(--text-secondary)" />
                    <div style={{ fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        PDF, PNG, JPG
                    </div>
                </>
            )}
        </div>
    );
}

// A compact collapsible list of findings
function FindingsList({ items, emptyText, danger }) {
    const [open, setOpen] = useState(false);
    const color = danger ? 'var(--danger)' : 'var(--warning)';
    if (!items || items.length === 0) {
        return (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--success)' }}>
                <CheckCircle size={14} /> {emptyText}
            </div>
        );
    }
    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.8rem', color, fontWeight: 500,
                }}
            >
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {items.length} item{items.length !== 1 ? 's' : ''}
            </button>
            {open && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {items.map((t, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{t}</li>)}
                </ul>
            )}
        </div>
    );
}

// One column of the side-by-side comparison
function LoanColumn({ data, label, isWinner }) {
    const { filename, analysis, fairness } = data;
    const {
        interest_rate, loan_amount, tenure_months,
        hidden_charges_detected, hidden_charges_details,
        penalty_clauses, risky_terms, rbi_compliance_issues, summary,
    } = analysis;

    return (
        <div style={{
            flex: 1, minWidth: 0,
            border: isWinner
                ? '2px solid var(--accent-primary)'
                : '1px solid var(--border-color)',
            borderRadius: '1rem',
            overflow: 'hidden',
        }}>
            {/* Column header */}
            <div style={{
                padding: '0.75rem 1.25rem',
                background: isWinner ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.5rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontWeight: 700, fontSize: '0.85rem',
                        color: isWinner ? '#fff' : 'var(--text-secondary)',
                    }}>
                        {label}
                    </span>
                    <span style={{
                        fontSize: '0.78rem', color: isWinner ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160,
                    }} title={filename}>
                        {filename}
                    </span>
                </div>
                {isWinner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
                        <Trophy size={14} /> Recommended
                    </div>
                )}
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Fairness score */}
                <FairnessMeter score={fairness.score} compact />

                {/* Key stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <MiniStat label="Interest rate" value={interest_rate ? `${interest_rate}%` : 'N/A'} valueColor={rateColor(interest_rate)} />
                    <MiniStat label="Loan amount"   value={loan_amount   ? `₹${Number(loan_amount).toLocaleString('en-IN')}` : 'N/A'} />
                    <MiniStat label="Tenure"        value={tenure_months ? `${tenure_months} mo` : 'N/A'} />
                    <MiniStat
                        label="Hidden charges"
                        value={hidden_charges_detected ? 'Yes' : 'No'}
                        valueColor={hidden_charges_detected ? 'var(--danger)' : 'var(--success)'}
                    />
                </div>

                {/* Verdict badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Verdict</span>
                    <span style={{
                        background: verdictColor(fairness.verdict) + '20',
                        color: verdictColor(fairness.verdict),
                        borderRadius: '999px', padding: '0.2rem 0.75rem',
                        fontSize: '0.78rem', fontWeight: 600,
                    }}>
                        {fairness.verdict}
                    </span>
                </div>

                {/* Summary */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {summary}
                </p>

                {/* Findings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <FindingRow label="Risky terms">
                        <FindingsList items={risky_terms} emptyText="None" danger />
                    </FindingRow>
                    <FindingRow label="Penalty clauses">
                        <FindingsList items={penalty_clauses} emptyText="None" />
                    </FindingRow>
                    <FindingRow label="RBI violations">
                        <FindingsList items={rbi_compliance_issues} emptyText="None" danger />
                    </FindingRow>
                    <FindingRow label="Hidden charges">
                        <FindingsList items={hidden_charges_details} emptyText="None" />
                    </FindingRow>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, valueColor }) {
    return (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: valueColor || 'var(--text-primary)', marginTop: '0.15rem' }}>{value}</div>
        </div>
    );
}

function FindingRow({ label, children }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 100, flexShrink: 0 }}>{label}</span>
            <div style={{ textAlign: 'right' }}>{children}</div>
        </div>
    );
}

// Verdict banner at the top of the results
function VerdictBanner({ verdict }) {
    const { winner, winner_label, score_diff, key_differences } = verdict;
    const isTie = winner === 'tie';

    return (
        <div style={{
            background: isTie ? 'var(--bg-secondary)' : 'rgba(37,99,235,0.08)',
            border: `1px solid ${isTie ? 'var(--border-color)' : 'rgba(37,99,235,0.3)'}`,
            borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {isTie
                    ? <Minus size={28} color="var(--text-secondary)" />
                    : <Trophy size={28} color="var(--accent-primary)" />
                }
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {isTie ? 'These loans are roughly equal' : `Recommended: ${winner_label}`}
                    </div>
                    {!isTie && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {score_diff} point{score_diff !== 1 ? 's' : ''} higher fairness score
                        </div>
                    )}
                </div>
            </div>

            {key_differences.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {key_differences.map((d, i) => {
                        const { tag, text } = parseDiff(d);
                        const tagColor = tag === '=' ? 'var(--text-secondary)' : 'var(--accent-primary)';
                        return (
                            <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                                <span style={{
                                    background: tag === '=' ? 'var(--bg-secondary)' : 'rgba(37,99,235,0.12)',
                                    color: tagColor, borderRadius: '999px',
                                    padding: '0.1rem 0.5rem', fontWeight: 700,
                                    fontSize: '0.7rem', flexShrink: 0, marginTop: '0.15rem',
                                }}>
                                    {tag === '=' ? '=' : `Loan ${tag}`}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
    const [fileA, setFileA] = useState(null);
    const [fileB, setFileB] = useState(null);
    const [status, setStatus]   = useState('idle'); // idle | loading | results | error
    const [results, setResults] = useState(null);
    const [error, setError]     = useState(null);

    const canCompare = fileA && fileB && status !== 'loading';

    const handleCompare = async () => {
        if (!canCompare) return;
        setStatus('loading');
        setError(null);
        try {
            const data = await compareDocuments(fileA, fileB);
            setResults(data);
            setStatus('results');
        } catch (err) {
            setError(err.message || 'Comparison failed.');
            setStatus('error');
        }
    };

    const reset = () => {
        setFileA(null); setFileB(null);
        setResults(null); setError(null);
        setStatus('idle');
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px' }}>

                {/* Page title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Loan Comparison</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Upload two loan agreements and get a side-by-side fairness analysis.
                    </p>
                </div>

                {/* Upload section — always visible until results */}
                {status !== 'results' && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <DropZone label="Loan A" file={fileA} onFile={setFileA} disabled={status === 'loading'} />
                            <DropZone label="Loan B" file={fileB} onFile={setFileB} disabled={status === 'loading'} />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleCompare}
                                disabled={!canCompare}
                                style={{ opacity: canCompare ? 1 : 0.5, minWidth: 200 }}
                            >
                                {status === 'loading'
                                    ? <><Loader2 size={18} className="spin" style={{ marginRight: 8 }} />Analysing both loans…</>
                                    : 'Compare Loans'
                                }
                            </button>
                        </div>

                        {status === 'error' && (
                            <div style={{
                                marginTop: '1rem', padding: '1rem',
                                background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem',
                                color: 'var(--danger)', display: 'flex', gap: '0.75rem', alignItems: 'center',
                            }}>
                                <AlertTriangle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {status === 'results' && results && (
                    <div>
                        <button
                            onClick={reset}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--accent-primary)', marginBottom: '1.5rem',
                                padding: 0, fontSize: '0.9rem',
                            }}
                        >
                            ← Compare different loans
                        </button>

                        {/* Verdict banner */}
                        <VerdictBanner verdict={results.verdict} />

                        {/* Side-by-side columns */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <LoanColumn
                                data={results.loan_a}
                                label="Loan A"
                                isWinner={results.verdict.winner === 'A'}
                            />
                            <LoanColumn
                                data={results.loan_b}
                                label="Loan B"
                                isWinner={results.verdict.winner === 'B'}
                            />
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, DollarSign,
  Calendar, Percent, BookOpen, ChevronDown, ChevronUp,
  ShieldAlert, ShieldCheck, FileText
} from 'lucide-react';
import FairnessMeter from './FairnessMeter';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

// Extracts the "[KB ref: ...]" tag from a finding string
function parseKbRef(text) {
  const match = text.match(/\[KB ref:\s*([^\]]+)\]/i);
  return match ? { clean: text.replace(match[0], '').trim(), ref: match[1].trim() } : { clean: text, ref: null };
}

// Choose badge colour by KB file name
function refColor(ref) {
  if (!ref) return '#6b7280';
  if (ref.toLowerCase().includes('penal'))      return '#ef4444';
  if (ref.toLowerCase().includes('kfs'))        return '#f97316';
  if (ref.toLowerCase().includes('benchmark'))  return '#8b5cf6';
  if (ref.toLowerCase().includes('predatory') || ref.toLowerCase().includes('glossary')) return '#dc2626';
  if (ref.toLowerCase().includes('fair prac'))  return '#2563eb';
  if (ref.toLowerCase().includes('nbfc') || ref.toLowerCase().includes('digital')) return '#0891b2';
  return '#6b7280';
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function StatBox({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem'
    }}>
      <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: color || 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

// A single finding row with optional KB ref badge
function FindingRow({ text, icon, bgColor, textColor }) {
  const { clean, ref } = parseKbRef(text);
  return (
    <li style={{
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      marginBottom: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem',
      background: bgColor || 'rgba(239,68,68,0.1)',
    }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ color: textColor || 'var(--danger)', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
        <span style={{ color: textColor || 'var(--danger)', lineHeight: 1.5 }}>{clean}</span>
      </div>
      {ref && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          alignSelf: 'flex-start', marginLeft: '1.75rem',
          background: refColor(ref) + '20',
          border: `1px solid ${refColor(ref)}40`,
          borderRadius: '999px', padding: '0.15rem 0.6rem',
          fontSize: '0.7rem', color: refColor(ref), fontWeight: 600,
        }}>
          <BookOpen size={10} />
          {ref}
        </div>
      )}
    </li>
  );
}

// Simple list box (hidden charges, penalty clauses)
function DetailBox({ title, items, emptyText, isRisk }) {
  const color = isRisk ? 'var(--danger)' : 'var(--warning)';
  const bg    = isRisk ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)';
  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
      <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{title}</h4>
      {items && items.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item, idx) => {
            const { clean, ref } = parseKbRef(item);
            return (
              <li key={idx} style={{ marginBottom: '0.6rem' }}>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{clean}</div>
                {ref && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem',
                    background: refColor(ref) + '20', border: `1px solid ${refColor(ref)}40`,
                    borderRadius: '999px', padding: '0.15rem 0.6rem',
                    fontSize: '0.7rem', color: refColor(ref), fontWeight: 600,
                  }}>
                    <BookOpen size={10} />{ref}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle size={16} color="var(--success)" /> <span>{emptyText || 'None detected'}</span>
        </div>
      )}
    </div>
  );
}

// Collapsible KB citations panel
function CitationsPanel({ citations }) {
  const [open, setOpen] = useState(false);
  if (!citations || citations.length === 0) return null;

  // Group by source label
  const grouped = citations.reduce((acc, c) => {
    const key = c.source_label;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div style={{ marginTop: '2rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', background: 'var(--bg-secondary)',
          border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
          <FileText size={18} color="var(--accent-primary)" />
          Knowledge Base References
          <span style={{
            background: 'var(--accent-primary)', color: '#fff',
            borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.5rem', fontWeight: 700,
          }}>
            {citations.length}
          </span>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            These are the exact excerpts from the RBI knowledge base that were retrieved
            and used to ground the analysis above.
          </p>
          {Object.entries(grouped).map(([label, chunks]) => (
            <div key={label}>
              {/* Source label */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: refColor(label) + '18', border: `1px solid ${refColor(label)}50`,
                borderRadius: '0.4rem', padding: '0.3rem 0.75rem',
                fontSize: '0.78rem', fontWeight: 700, color: refColor(label),
                marginBottom: '0.6rem',
              }}>
                <BookOpen size={12} />{label}
              </div>
              {/* Excerpt cards */}
              {chunks.map((c, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', borderRadius: '0.5rem',
                  padding: '0.75rem 1rem', marginBottom: '0.5rem',
                  borderLeft: `3px solid ${refColor(label)}`,
                  fontSize: '0.82rem', color: 'var(--text-secondary)',
                  lineHeight: 1.6, fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {c.excerpt}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */

export default function ResultsCard({ results }) {
  const { analysis, fairness } = results;
  const { breakdown, score }   = fairness;
  const {
    interest_rate, loan_amount, tenure_months,
    hidden_charges_detected, hidden_charges_details,
    penalty_clauses, risky_terms, rbi_compliance_issues,
    summary, kb_citations,
  } = analysis;

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Analysis Results</h2>

      {/* Fairness gauge */}
      <FairnessMeter score={score} />

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatBox icon={<Percent />}   label="Interest Rate" value={interest_rate ? `${interest_rate}%` : 'N/A'} color={interest_rate > 20 ? 'var(--danger)' : 'var(--text-primary)'} />
        <StatBox icon={<DollarSign />} label="Loan Amount"  value={loan_amount   ? `₹${Number(loan_amount).toLocaleString('en-IN')}` : 'N/A'} />
        <StatBox icon={<Calendar />}  label="Tenure"        value={tenure_months ? `${tenure_months} months` : 'N/A'} />
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Executive Summary</h3>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>{summary || 'No summary available.'}</p>
      </div>

      {/* Fairness score breakdown */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Score Breakdown</h3>
        {breakdown.length === 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--success)' }}>
            <CheckCircle /> <p style={{ margin: 0 }}>No major issues found. Looks fair!</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {breakdown.map((item, idx) => (
              <FindingRow key={idx} text={item} icon={<AlertTriangle size={20} />} />
            ))}
          </ul>
        )}
      </div>

      {/* RBI compliance issues */}
      {rbi_compliance_issues && rbi_compliance_issues.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} /> RBI Compliance Violations
            </span>
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {rbi_compliance_issues.map((item, idx) => (
              <FindingRow
                key={idx} text={item}
                icon={<ShieldAlert size={20} />}
                bgColor="rgba(239,68,68,0.12)"
                textColor="var(--danger)"
              />
            ))}
          </ul>
        </div>
      )}

      {/* Risky terms + penalty clauses side by side */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
        <DetailBox title="⚠️ Risky Terms"      items={risky_terms}             emptyText="None detected" isRisk />
        <DetailBox title="💰 Penalty Clauses"  items={penalty_clauses}         emptyText="None detected" isRisk={false} />
      </div>

      {/* Hidden charges */}
      <div style={{ marginBottom: '2rem' }}>
        <DetailBox title="🔍 Hidden / Excessive Charges" items={hidden_charges_details} emptyText="None detected" isRisk={false} />
      </div>

      {/* KB Citations panel */}
      <CitationsPanel citations={kb_citations} />
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

export default function FairnessMeter({ score, compact = false }) {
    let color = 'var(--danger)';
    let verdict = 'Unfair';

    if (score >= 80) {
        color = 'var(--success)';
        verdict = 'Fair';
    } else if (score >= 50) {
        color = 'var(--warning)';
        verdict = 'Needs Review';
    }

    // ── Compact mode: small horizontal bar used in comparison columns ──────────
    if (compact) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Fairness score
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{score}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: color, borderRadius: 999 }}
                    />
                </div>
                <div style={{ fontSize: '0.72rem', color, fontWeight: 600, marginTop: '0.3rem', textAlign: 'right' }}>
                    {verdict}
                </div>
            </div>
        );
    }

    // ── Full mode: original gauge ─────────────────────────────────────────────
    return (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ position: 'relative', width: '240px', margin: '0 auto' }}>
                <svg viewBox="0 0 200 110" width="100%">
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="var(--bg-secondary)"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    <motion.path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={color}
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        strokeDashoffset="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * score / 100) }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                </svg>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1, color }}
                    >
                        {score}
                    </motion.div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        FAIRNESS SCORE
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold', color }}
            >
                {verdict}
            </motion.div>
        </div>
    );
}
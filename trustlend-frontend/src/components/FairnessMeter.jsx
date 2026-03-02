import React from 'react';
import { motion } from 'framer-motion';

export default function FairnessMeter({ score }) {
    let color = 'var(--danger)';
    let verdict = 'Unfair';

    if (score >= 80) {
        color = 'var(--success)';
        verdict = 'Fair';
    } else if (score >= 50) {
        color = 'var(--warning)';
        verdict = 'Needs Review';
    }

    return (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto', overflow: 'hidden' }}>
                {/* Background Arc */}
                <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '20px solid var(--bg-secondary)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    boxSizing: 'border-box'
                }} />

                {/* Active Arc - Using SVG for better control or simple rotation hack */}
                <motion.div
                    initial={{ rotate: -180 }}
                    animate={{ rotate: -180 + (score / 100) * 180 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        boxSizing: 'border-box',
                        border: `20px solid transparent`,
                        borderTopColor: color,
                        borderRightColor: 'transparent',
                        // This CSS hack for arc is tricky, simpler to use SVG for gauge
                    }}
                />
                {/* SVG Implementation is cleaner */}
            </div>

            {/* Better SVG Approach */}
            <div style={{ position: 'relative', width: '240px', margin: '0 auto' }}>
                <svg viewBox="0 0 200 110" width="100%">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--bg-secondary)" strokeWidth="20" strokeLinecap="round" />
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
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1, color }}
                    >
                        {score}
                    </motion.div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>FAIRNESS SCORE</div>
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

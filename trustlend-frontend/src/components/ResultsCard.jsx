import React from 'react';
import { AlertTriangle, CheckCircle, Info, DollarSign, Calendar, Percent } from 'lucide-react';
import FairnessMeter from './FairnessMeter';

export default function ResultsCard({ results }) {
    const { analysis, fairness } = results;
    const { breakdown, score, verdict } = fairness;
    const {
        interest_rate,
        loan_amount,
        tenure_months,
        hidden_charges_detected,
        hidden_charges_details,
        penalty_clauses,
        risky_terms,
        summary
    } = analysis;

    return (
        <div className="card">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Analysis Results</h2>

            <FairnessMeter score={score} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatBox icon={<Percent />} label="Interest Rate" value={interest_rate ? `${interest_rate}%` : 'N/A'} color={interest_rate > 20 ? 'var(--danger)' : 'var(--text-primary)'} />
                <StatBox icon={<DollarSign />} label="Loan Amount" value={loan_amount ? loan_amount : 'N/A'} />
                <StatBox icon={<Calendar />} label="Tenure" value={tenure_months ? `${tenure_months} months` : 'N/A'} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Executive Summary</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{summary || "No summary available."}</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Issues Found</h3>
                {breakdown.length === 0 ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--success)' }}>
                        <CheckCircle /> <p>No major issues found. Looks fair!</p>
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {breakdown.map((item, index) => (
                            <li key={index} style={{
                                display: 'flex',
                                gap: '0.75rem',
                                marginBottom: '0.75rem',
                                alignItems: 'start',
                                color: 'var(--danger)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '0.75rem',
                                borderRadius: '0.5rem'
                            }}>
                                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <DetailBox title="Hidden Charges" items={hidden_charges_details} emptyParams={{ icon: <CheckCircle color="var(--success)" />, text: "None detected" }} />
                <DetailBox title="Risky Terms" items={risky_terms} emptyParams={{ icon: <CheckCircle color="var(--success)" />, text: "None detected" }} />
            </div>
        </div>
    );
}

function StatBox({ icon, label, value, color }) {
    return (
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: color || 'var(--text-primary)' }}>{value}</div>
            </div>
        </div>
    );
}

function DetailBox({ title, items, emptyParams }) {
    return (
        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{title}</h4>
            {items && items.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                    {items.map((item, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                </ul>
            ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    {emptyParams.icon} <span>{emptyParams.text}</span>
                </div>
            )}
        </div>
    );
}

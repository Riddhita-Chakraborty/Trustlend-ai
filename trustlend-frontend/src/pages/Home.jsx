import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldCheck, Search, FileText } from 'lucide-react';

export default function Home() {
    return (
        <>
            <Navbar />
            <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                    Transparency before you <span className="text-gradient">sign</span>.
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                    AI-powered analysis of loan documents. Detect hidden charges, risky clauses, and unfair terms in seconds.
                </p>

                <Link to="/analyze" className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '1rem 2.5rem', textDecoration: 'none' }}>
                    Analyze My Loan
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '5rem', textAlign: 'left' }}>
                    <FeatureCard
                        icon={<Search />}
                        title="Hidden Charges"
                        desc="Instantly spot processing fees, insurance bundling, and other costs buried in the fine print."
                    />
                    <FeatureCard
                        icon={<ShieldCheck />}
                        title="Fairness Score"
                        desc="Get a simple 0-100 score indicating how fair the loan terms are compared to market standards."
                    />
                    <FeatureCard
                        icon={<FileText />}
                        title="Clause Explanation"
                        desc="Complex legal jargon translated into plain English so you know exactly what you're agreeing to."
                    />
                </div>
            </div>
        </>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="card" style={{ padding: '2rem' }}>
            <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem', width: '48px', height: '48px' }}>
                {React.cloneElement(icon, { size: 48 })}
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{desc}</p>
        </div>
    );
}

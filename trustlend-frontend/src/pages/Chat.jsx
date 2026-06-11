import React from 'react';
import Navbar from '../components/Navbar';
import LoanChat from '../components/LoanChat';

export default function ChatPage() {
    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Ask Your Loan</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Upload any loan agreement and ask questions in plain English.
                        Every answer is grounded in RBI regulations.
                    </p>
                </div>
                <LoanChat />
            </div>
        </>
    );
}
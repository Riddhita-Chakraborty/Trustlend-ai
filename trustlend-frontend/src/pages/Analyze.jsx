import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ResultsCard from '../components/ResultsCard';
import { analyzeDocument } from '../services/api';
import Navbar from '../components/Navbar';

export default function AnalyzePage() {
    const [status, setStatus] = useState('idle'); // idle, analyzing, results, error
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelect = async (file) => {
        if (!file) return;

        setStatus('analyzing');
        setError(null);

        try {
            const data = await analyzeDocument(file);
            setResults(data);
            setStatus('results');
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to analyze document.");
            setStatus('error');
        }
    };

    const resetAnalysis = () => {
        setStatus('idle');
        setResults(null);
        setError(null);
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Loan Analysis</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Upload your loan agreement to detect hidden risks and unfair terms.</p>
                </div>

                {status === 'idle' || status === 'analyzing' || status === 'error' ? (
                    <div className="card">
                        <FileUpload onFileSelect={handleFileSelect} isLoading={status === 'analyzing'} />
                        {status === 'error' && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--danger)', color: 'white', borderRadius: '0.5rem' }}>
                                Error: {error}
                                <button onClick={resetAnalysis} style={{ marginLeft: '1rem', background: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>Retry</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <button className="btn" onClick={resetAnalysis} style={{ marginBottom: '1rem', paddingLeft: 0, color: 'var(--accent-primary)' }}>
                            ← Analyze another document
                        </button>
                        <ResultsCard results={results} />
                    </div>
                )}
            </div>
        </>
    );
}

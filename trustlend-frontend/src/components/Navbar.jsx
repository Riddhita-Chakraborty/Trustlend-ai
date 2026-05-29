import React from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { pathname } = useLocation();

    const navLink = (to, label) => (
        <Link
            to={to}
            style={{
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.4rem 0.75rem',
                borderRadius: '0.5rem',
                color: pathname === to ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: pathname === to ? 'rgba(37,99,235,0.08)' : 'transparent',
                transition: 'all 0.15s',
            }}
        >
            {label}
        </Link>
    );

    return (
        <nav style={{
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0',
            backgroundColor: 'var(--bg-secondary)',
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                    to="/"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}
                >
                    <ShieldCheck size={32} color="var(--accent-primary)" />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>TrustLend</span>
                </Link>

                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {navLink('/analyze', 'Analyze')}
                    {navLink('/compare', 'Compare')}

                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            marginLeft: '0.5rem',
                        }}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
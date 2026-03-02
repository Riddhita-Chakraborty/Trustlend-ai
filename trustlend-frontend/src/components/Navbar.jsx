import React from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <ShieldCheck size={32} color="var(--accent-primary)" />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>TrustLend</span>
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              padding: '0.5rem', 
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex'
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

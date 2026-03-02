import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';

export default function FileUpload({ onFileSelect, isLoading }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        onFileSelect(null);
    };

    return (
        <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '1rem',
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                position: 'relative'
            }}
            onClick={() => document.getElementById('file-upload').click()}
        >
            <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleChange}
                accept=".pdf,.png,.jpg,.jpeg"
            />

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
                    <p style={{ color: 'var(--text-secondary)' }}>Analyzing document...</p>
                </div>
            ) : selectedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <FileText size={32} color="var(--accent-primary)" />
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontWeight: 500, margin: 0 }}>{selectedFile.name}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                            <X size={20} color="var(--text-secondary)" />
                        </button>
                    </div>
                    <p style={{ color: 'var(--success)', fontWeight: 500 }}>Ready to analyze</p>
                </div>
            ) : (
                <>
                    <UploadCloud size={64} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Drop your loan document here</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Supports PDF, PNG, JPG
                    </p>
                    <button className="btn btn-primary" onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('file-upload').click();
                    }}>
                        Browse Files
                    </button>
                </>
            )}

            <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

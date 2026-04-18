import React, { useState, useEffect } from 'react';
import ImageComparator from './ImageComparator';
import Legend from './Legend';
import SystemHUD from './SystemHUD';
import HistoryDock from './HistoryDock';
import { Download, RotateCcw, ShieldCheck, Cpu } from 'lucide-react';

/**
 * ResultsPanel Component
 * ----------------------
 * Displays segmentation results with futuristic GHOST HUD and History features.
 */
function ResultsPanel({ results = [], onReset }) {
  const isMulti = results.length > 1;
  const allClasses = results.length > 0 
    ? [...new Set(results.flatMap(r => r.classes))].sort((a, b) => a - b)
    : [];

  const handleDownload = (maskBase64, index) => {
    if (!maskBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${maskBase64}`;
    link.download = `segmentation_mask_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="results-panel animate-fade-in" style={{ 
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div className="glass-panel" style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(5, 5, 5, 0.4)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>
            {isMulti ? `${results.length} Composite Frames` : 'Terrain Analysis Report'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <ShieldCheck size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure Prediction Verified</span>
          </div>
        </div>
        <button className="btn-ghost" style={{ padding: '8px 16px' }} onClick={onReset}>
          <RotateCcw size={16} /> New Session
        </button>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {results.map((result, i) => (
          <div key={i} className="glass-panel ghost-shadow" style={{ 
            padding: '12px', 
            background: 'rgba(5, 5, 5, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <ImageComparator
              originalSrc={result.originalUrl}
              maskSrc={`data:image/png;base64,${result.maskBase64}`}
            />
          </div>
        ))}
      </div>

      {/* Legend Panel */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        background: 'rgba(5, 5, 5, 0.4)', 
        border: '1px solid rgba(255,255,255,0.05)',
        marginTop: '24px'
      }}>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
          Detected Composition
        </h3>
        <Legend classes={allClasses} />
      </div>

      {/* Quick Actions */}
      <div className="glass-panel" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', marginTop: '24px' }}>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
           Export Options
        </h3>
        <button
           className="btn-ghost"
           style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}
          onClick={() => handleDownload(results[0]?.maskBase64, 0)}
        >
          <Download size={18} /> Download Mask
        </button>
      </div>
    </div>
  );
}

export default ResultsPanel;

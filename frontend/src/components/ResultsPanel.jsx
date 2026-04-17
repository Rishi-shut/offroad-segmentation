import React from 'react';
import ImageComparator from './ImageComparator';
import Legend from './Legend';
import { Download, RotateCcw } from 'lucide-react';

/**
 * ResultsPanel Component
 * ----------------------
 * Displays segmentation results for single images or multiple video frames.
 * Includes:
 *   - Original vs Mask comparison (ImageComparator)
 *   - Terrain class legend
 *   - Telemetry stats
 *   - Download button for the segmented mask
 * 
 * Props:
 *   - results: Array of { originalUrl, maskBase64, classes }
 *   - onReset: callback to return to input state
 */
function ResultsPanel({ results, onReset }) {
  const isMulti = results.length > 1;

  // Download the mask image as a PNG file
  const handleDownload = (maskBase64, index) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${maskBase64}`;
    link.download = `segmentation_mask_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregate all unique classes across all results
  const allClasses = [...new Set(results.flatMap(r => r.classes))].sort((a, b) => a - b);

  return (
    <div className="results-panel animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>
          {isMulti ? `${results.length} Frame Results` : 'Segmentation Results'}
        </h2>
        <button className="btn-ghost" style={{ padding: '8px 16px' }} onClick={onReset}>
          <RotateCcw size={18} />
          New Analysis
        </button>
      </div>

      {/* Results Grid */}
      <div className={isMulti ? 'results-grid' : ''}>
        {results.map((result, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px', marginBottom: isMulti ? '0' : '24px' }}>
            {isMulti && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Frame {i + 1}</span>
                <button
                  onClick={() => handleDownload(result.maskBase64, i)}
                  style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Save
                </button>
              </div>
            )}
            <ImageComparator
              originalSrc={result.originalUrl}
              maskSrc={`data:image/png;base64,${result.maskBase64}`}
            />
          </div>
        ))}
      </div>

      {/* Telemetry + Legend Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '24px', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Telemetry
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="telemetry-stat-value">
              {allClasses.length}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Unique<br/>Terrains</span>
          </div>
          {isMulti && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="telemetry-stat-value" style={{ color: '#fff' }}>
                {results.length}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Frames<br/>Processed</span>
            </div>
          )}

          {/* Download All Button (single result) */}
          {!isMulti && (
            <button
               className="btn-ghost"
               style={{ width: '100%', marginTop: '16px', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}
              onClick={() => handleDownload(results[0].maskBase64, 0)}
            >
              <Download size={18} />
              Download Mask
            </button>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Detected Composition
          </h3>
          <Legend classes={allClasses} />
        </div>
      </div>
    </div>
  );
}

export default ResultsPanel;

import React, { useMemo } from 'react';
import { Eye, ArrowLeft, Zap } from 'lucide-react';

/**
 * PreviewPanel Component
 * ----------------------
 * Universal preview component used by all input modes (image, video, camera).
 * Shows the selected content and requires user confirmation before processing.
 * 
 * Props:
 *   - files: Array of File objects to preview
 *   - mode: 'image' | 'video' | 'camera' — determines layout
 *   - onConfirm: called when user clicks "Analyze"
 *   - onCancel: called when user clicks "Go Back"
 */
function PreviewPanel({ files, mode, onConfirm, onCancel }) {
  // Generate preview URLs from File objects
  const previewUrls = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  const isMultiFrame = mode === 'video' && files.length > 1;

  return (
    <div className="preview-panel animate-fade-in">
      <div className="preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Eye size={22} color="var(--primary)" />
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>
              {isMultiFrame ? `${files.length} Frames Extracted` : 'Preview'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              {isMultiFrame
                ? 'Review frames before processing all'
                : 'Verify your image before sending for analysis'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className={isMultiFrame ? 'preview-grid' : 'preview-single'}>
        {previewUrls.map((url, i) => (
          <div key={i} className="preview-frame">
            <img src={url} alt={`Preview ${i + 1}`} />
            {isMultiFrame && (
              <span className="frame-badge">Frame {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Confirm / Cancel Actions */}
      <div className="preview-actions" style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button
          onClick={onCancel}
          style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500', flex: 1, justifyContent: 'center' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button 
          onClick={onConfirm}
          className="btn-primary"
          style={{ flex: 2, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 20px rgba(59,130,246,0.3)', fontWeight: '600', transition: 'all 0.2s' }}
        >
          <Zap size={18} />
          {isMultiFrame ? `Analyze All ${files.length} Frames` : 'Start Analysis'}
        </button>
      </div>
    </div>
  );
}

export default PreviewPanel;

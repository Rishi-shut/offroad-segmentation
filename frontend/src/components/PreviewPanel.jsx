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
      <div className="preview-actions">
        <button
          className="btn-primary"
          onClick={onCancel}
          style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
        <button className="btn-primary" onClick={onConfirm}>
          <Zap size={18} />
          {isMultiFrame ? `Analyze All ${files.length} Frames` : 'Analyze'}
        </button>
      </div>
    </div>
  );
}

export default PreviewPanel;

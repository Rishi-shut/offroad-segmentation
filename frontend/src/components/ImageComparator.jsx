import React, { useRef, useState } from 'react';

/**
 * ImageComparator Component
 * -------------------------
 * Interactive before/after slider for comparing original image with segmentation mask.
 * 
 * IMPORTANT: Uses 100% inline styles to ensure each instance is fully independent.
 * Previously used shared CSS class names which caused all sliders to sync together
 * when multiple instances existed (e.g. video frame results).
 */
const ImageComparator = ({ originalSrc, maskSrc }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX || (e.touches && e.touches[0].clientX);
    if (x === undefined) return;
    let position = ((x - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position));
    setSliderPos(position);
  };

  // All styles are inline — no shared CSS class names between instances
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '400px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    cursor: 'col-resize',
    background: '#000',
    margin: '0',
    userSelect: 'none',
  };

  const baseImgStyle = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  const overlayImgStyle = {
    ...baseImgStyle,
    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
    opacity: 0.85,
  };

  const sliderLineStyle = {
    position: 'absolute',
    top: 0, bottom: 0,
    left: `${sliderPos}%`,
    width: '3px',
    background: 'var(--primary)',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    boxShadow: '0 0 10px var(--primary)',
    zIndex: 2,
  };

  const sliderKnobStyle = {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30px', height: '30px',
    background: 'var(--primary)',
    borderRadius: '50%',
    border: '3px solid #fff',
  };

  // Labels for before/after
  const labelStyle = (side) => ({
    position: 'absolute',
    bottom: '10px',
    [side]: '12px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    zIndex: 3,
    pointerEvents: 'none',
  });

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Original Image (bottom layer) */}
      <img src={originalSrc} alt="Original" style={baseImgStyle} />

      {/* Mask (top layer, clipped for reveal effect) */}
      {maskSrc && (
        <img 
          src={maskSrc} 
          alt="Mask" 
          style={{
            ...overlayImgStyle,
            opacity: 1.0, // Respect backend transparency (Class 0 is hidden)
            mixBlendMode: 'normal', // Let the RGBA colors naturally overlay the terrain
          }} 
        />
      )}

      {/* Slider line + knob */}
      <div style={sliderLineStyle}>
        <div style={sliderKnobStyle} />
      </div>

      {/* Dynamic Labels */}
      <span style={labelStyle('left')}>Segmented</span>
      <span style={labelStyle('right')}>Original Image</span>
    </div>
  );
};

export default ImageComparator;

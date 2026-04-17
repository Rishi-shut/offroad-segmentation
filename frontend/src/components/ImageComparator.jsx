import React, { useRef, useState } from 'react';

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

  const css = `
    .comp-container {
      position: relative;
      width: 100%;
      height: 400px;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: col-resize;
      background: #000;
      margin: 20px 0;
    }
    .comp-img {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: contain;
      user-select: none;
    }
    .comp-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: contain;
      clip-path: polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%);
      opacity: 0.8;
    }
    .slider {
      position: absolute;
      top: 0; bottom: 0;
      left: ${sliderPos}%;
      width: 3px;
      background: var(--primary);
      transform: translateX(-50%);
      pointer-events: none;
      box-shadow: 0 0 10px var(--primary);
    }
    .slider-knob {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 30px; height: 30px;
      background: var(--primary);
      border-radius: 50%;
      border: 3px solid #fff;
    }
  `;

  return (
    <div 
      className="comp-container animate-fade-in"
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <style>{css}</style>
      <img src={originalSrc} alt="Original" className="comp-img" />
      {maskSrc && <img src={maskSrc} alt="Mask" className="comp-overlay" />}
      <div className="slider"><div className="slider-knob"></div></div>
    </div>
  );
};

export default ImageComparator;

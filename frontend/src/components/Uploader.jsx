import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

/**
 * Uploader Component (Updated)
 * ----------------------------
 * Drag-and-drop image upload zone.
 * Instead of auto-processing, it now calls onFileChosen
 * which triggers the preview step in the parent.
 */
function Uploader({ onFileChosen }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (onFileChosen) onFileChosen(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className="upload-icon-wrapper">
        {dragging ? (
          <ImageIcon size={48} color="var(--primary)" />
        ) : (
          <Upload size={48} color="var(--text-muted)" />
        )}
      </div>

      <h3 style={{ marginTop: '16px', color: '#fff', fontSize: '1.1rem' }}>
        {dragging ? 'Drop your image here' : 'Upload Image'}
      </h3>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
        Drag & drop or click to browse • JPG, PNG, WebP
      </p>
    </div>
  );
}

export default Uploader;

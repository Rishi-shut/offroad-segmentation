import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';

const Uploader = ({ onFileSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  };

  const css = `
    .upload-area {
      border: 2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border-color)'};
      border-radius: var(--radius-md);
      padding: 60px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: ${isDragOver ? 'rgba(0, 212, 255, 0.05)' : 'transparent'};
    }
    .upload-area:hover {
      border-color: var(--primary);
      background: rgba(0, 212, 255, 0.05);
    }
    .uploader-icon {
      margin-bottom: 15px;
      color: ${isDragOver ? 'var(--primary)' : 'var(--text-main)'};
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {selectedFile ? (
            <>
              <CheckCircle size={48} className="uploader-icon" color="var(--primary)" />
              <p style={{ fontWeight: 'bold' }}>{selectedFile.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Click to change</p>
            </>
          ) : (
            <>
              <UploadCloud size={48} className="uploader-icon" />
              <p>Click to select an image</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>or drag and drop here</p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Uploader;

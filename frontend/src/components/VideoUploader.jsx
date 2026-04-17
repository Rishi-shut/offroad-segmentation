import React, { useRef, useState, useCallback } from 'react';
import { Film, Upload, AlertTriangle, X } from 'lucide-react';

/**
 * VideoUploader Component
 * -----------------------
 * Handles video file upload with:
 *   - Drag-and-drop support
 *   - Client-side duration validation (max 5 seconds)
 *   - Frame extraction at 1 FPS using hidden <video> + <canvas>
 * 
 * Returns an array of extracted frame File objects via onFramesExtracted.
 */

const MAX_DURATION = 5; // seconds

function VideoUploader({ onFramesExtracted }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Validate and process a video file
  const processVideo = useCallback(async (file) => {
    setError('');
    setExtracting(true);
    setProgress(0);

    const url = URL.createObjectURL(file);

    // Create a hidden video element for metadata + frame extraction
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = video.duration;

      // Reject videos longer than MAX_DURATION
      if (duration > MAX_DURATION) {
        setError(`Video is ${duration.toFixed(1)}s long. Maximum allowed is ${MAX_DURATION} seconds.`);
        setExtracting(false);
        URL.revokeObjectURL(url);
        return;
      }

      // Calculate frame count: 1 frame per second
      const frameCount = Math.max(1, Math.floor(duration));
      const frames = [];
      let currentFrame = 0;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Seek to each second and capture a frame
      const captureFrame = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const frameFile = new File(
              [blob],
              `frame_${currentFrame + 1}_of_${frameCount}.png`,
              { type: 'image/png' }
            );
            frames.push(frameFile);
          }

          currentFrame++;
          setProgress(Math.round((currentFrame / frameCount) * 100));

          if (currentFrame < frameCount) {
            // Seek to the next second
            video.currentTime = currentFrame;
          } else {
            // All frames extracted
            setExtracting(false);
            URL.revokeObjectURL(url);
            if (onFramesExtracted) {
              onFramesExtracted(frames);
            }
          }
        }, 'image/png');
      };

      // Listen for seek completion, then capture
      video.onseeked = captureFrame;

      // Start seeking to the first frame (t=0)
      video.currentTime = 0;
    };

    video.onerror = () => {
      setError('Could not read this video file. Try a different format (MP4, WebM).');
      setExtracting(false);
      URL.revokeObjectURL(url);
    };
  }, [onFramesExtracted]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      processVideo(file);
    } else {
      setError('Please drop a valid video file (MP4, WebM, MOV).');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processVideo(file);
  };

  return (
    <div className="video-uploader">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Error Banner */}
      {error && (
        <div className="video-error">
          <AlertTriangle size={20} color="#f59e0b" />
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>
      )}

      {/* Extracting Progress */}
      {extracting && (
        <div className="video-extracting">
          <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }} />
          <h4 style={{ color: '#fff', marginBottom: '8px' }}>Extracting Frames</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Processing at 1 frame per second...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>{progress}%</span>
        </div>
      )}

      {/* Drop Zone */}
      {!extracting && (
        <div
          className={`video-dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Film size={48} color={dragging ? 'var(--primary)' : 'var(--text-muted)'} />
          <h3 style={{ marginTop: '16px', color: '#fff' }}>Upload Video</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Drag & drop or click to select • Max {MAX_DURATION} seconds
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            MP4, WebM, MOV supported
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoUploader;

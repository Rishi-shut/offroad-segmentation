import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Check, XCircle } from 'lucide-react';

/**
 * CameraCapture Component
 * -----------------------
 * Accesses the device camera via browser APIs, displays a live feed,
 * and allows the user to capture a snapshot. The captured image is
 * returned as a File object to the parent via onCapture callback.
 * 
 * Flow: Live Feed → Capture → Preview → Confirm / Retake
 */
function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [error, setError] = useState('');

  // Start the camera stream
  const startCamera = useCallback(async () => {
    setError('');
    setCapturedUrl(null);
    setCapturedFile(null);

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API is not supported in this browser. Try Chrome or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Attach stream to video element once both are ready
  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      // Explicitly call play() to ensure video starts
      video.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [isStreaming]);

  // Stop the camera stream to free resources
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture a snapshot from the live video feed
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure the video has actual dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera feed not ready yet. Please wait a moment and try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert canvas to a blob, then to a File object
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      setCapturedFile(file);
      stopCamera(); // Stop the stream after capture
    }, 'image/png');
  };

  // User confirms the captured photo
  const handleConfirm = () => {
    if (capturedFile && onCapture) {
      onCapture(capturedFile);
    }
  };

  // User wants to retake — restart the camera
  const handleRetake = () => {
    setCapturedUrl(null);
    setCapturedFile(null);
    startCamera();
  };

  return (
    <div className="camera-container">
      {/* Hidden canvas used for frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error State */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <XCircle color="#ef4444" size={48} style={{ marginBottom: '16px' }} />
          <p style={{ color: '#fca5a5', marginBottom: '20px' }}>{error}</p>
          <button className="btn-primary" onClick={startCamera}>Try Again</button>
        </div>
      )}

      {/* Initial State: Camera not started */}
      {!isStreaming && !capturedUrl && !error && (
        <div className="upload-zone-premium" onClick={startCamera}>
          <div className="upload-icon-wrapper">
             <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '50%', display: 'inline-block', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Camera size={48} color="var(--text-muted)" />
             </div>
          </div>
          <h3 style={{ marginTop: '24px', color: '#fff', fontSize: '1.25rem', fontWeight: '600' }}>Access Camera</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.95rem' }}>
            Click to start live video feed
          </p>
        </div>
      )}

      {/* Live Feed State */}
      {isStreaming && !capturedUrl && (
        <div className="camera-viewfinder">
          <div className="viewfinder-corner tl" />
          <div className="viewfinder-corner tr" />
          <div className="viewfinder-corner bl" />
          <div className="viewfinder-corner br" />

          {/* Crosshair target */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', zIndex: 5 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%' }} />
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', zIndex: 20 }}>
            <button
               onClick={stopCamera}
               style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
               onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
               onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
              Cancel
            </button>

            <button className="shutter-btn" onClick={handleCapture}>
              <div className="shutter-btn-inner" />
            </button>

            {/* Spacer for symmetry */}
            <div style={{ width: '85px' }} />
          </div>
        </div>
      )}

      {/* Preview State: Photo captured */}
      {capturedUrl && (
        <div className="camera-preview-wrapper">
          <img src={capturedUrl} alt="Captured" className="camera-preview-img" />
          <div className="camera-confirm-controls">
            <button className="btn-primary" onClick={handleRetake} style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <RotateCcw size={18} />
              Retake
            </button>
            <button className="btn-primary" onClick={handleConfirm}>
              <Check size={18} />
              Use This Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;

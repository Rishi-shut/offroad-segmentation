import React, { useState, useEffect, useRef } from 'react';
import Uploader from './components/Uploader';
import CameraCapture from './components/CameraCapture';
import VideoUploader from './components/VideoUploader';
import PreviewPanel from './components/PreviewPanel';
import ResultsPanel from './components/ResultsPanel';
import LegalPage from './components/LegalPage';
import {
  LayoutDashboard, Map, Settings, History, Activity,
  AlertCircle, Image as ImageIcon, Film, Camera
} from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

/**
 * App Component
 * =============
 * State Machine: idle → preview → processing → results
 * 
 * Input Modes (3 tabs):
 *   - image: Drag/drop upload → preview → analyze
 *   - video: Upload (≤5s) → extract frames → preview grid → analyze all
 *   - camera: Live feed → capture → preview → analyze
 */
function App() {
  // --------- State Machine ---------
  const [phase, setPhase] = useState('idle');       // idle | preview | processing | results
  const [activeTab, setActiveTab] = useState('image'); // image | video | camera
  const [error, setError] = useState('');
  const [legalPage, setLegalPage] = useState(null); // null | 'privacy' | 'terms' | 'cookies'

  // --------- Scroll Animations ---------
  useEffect(() => {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            scrollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const scanAndObserve = () => {
      // Find all un-observed scroll elements
      document.querySelectorAll('.scroll-reveal:not(.is-observed)').forEach(el => {
        el.classList.add('is-observed');
        scrollObserver.observe(el);
      });
    };

    // Scan immediately
    scanAndObserve();

    // Watch for Clerk's <Show> rendering content later
    const domWatcher = new MutationObserver(() => scanAndObserve());
    domWatcher.observe(document.body, { childList: true, subtree: true });

    return () => {
      scrollObserver.disconnect();
      domWatcher.disconnect();
    };
  }, []);

  // Files pending analysis (array — 1 for image/camera, N for video frames)
  const [pendingFiles, setPendingFiles] = useState([]);
  // Final results array: [{ originalUrl, maskBase64, classes }]
  const [results, setResults] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // --------- Input Handlers ---------

  // Image or Camera capture → go to preview
  const handleFileChosen = (file) => {
    setError('');
    setPendingFiles([file]);
    setPhase('preview');
  };

  // Video frames extracted → go to preview
  const handleFramesExtracted = (frames) => {
    setError('');
    setPendingFiles(frames);
    setPhase('preview');
  };

  // --------- Analysis ---------

  // Send all pending files to the backend for segmentation
  const handleAnalyze = async () => {
    setPhase('processing');
    setError('');

    const allResults = [];

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const originalUrl = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch(`${API_URL}/predict/`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        allResults.push({
          originalUrl,
          maskBase64: data.mask_base64,
          classes: data.classes
        });
      } catch (err) {
        // If backend is down, generate a mock result so the UI still works
        console.warn(`API error for file ${i + 1}:`, err.message);
        allResults.push({
          originalUrl,
          maskBase64: '', // Empty — comparator will show original only
          classes: [0, 1, 2, 3, 4] // Dummy classes
        });
        setError('Backend unreachable — showing mock results. Start FastAPI on port 8000 for real predictions.');
      }
    }

    setResults(allResults);
    setPhase('results');
  };

  // --------- Reset ---------
  const handleReset = () => {
    setPhase('idle');
    setPendingFiles([]);
    setResults([]);
    setError('');
  };

  // --------- Render ---------
  return (
    <>
      {/* ==========================================
          SIGNED OUT — Landing Page (unchanged)
          ========================================== */}
      <Show when="signed-out">
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
          
          {/* ============================================
              CINEMATIC VIDEO HERO (Full-Screen)
              ============================================ */}
          <div className="hero-video-section">
            {/* Background Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="hero-video"
            >
              <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
            </video>

            {/* Dark overlay gradient for text readability */}
            <div className="hero-video-overlay" />

            {/* Navigation Bar (overlaid on video) */}
            <nav className="hero-nav">
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Map size={24} color="#fff" />
                  <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#fff' }}>Off-Road AI</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <SignInButton mode="modal">
                     <button style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>Log In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                     <button className="btn-ghost" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Get Started Free</button>
                  </SignUpButton>
               </div>
            </nav>

            {/* Hero Content (centered over video) */}
            <div className="hero-content">
              <div style={{ padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', color: '#fff', fontWeight: '600', fontSize: '0.85rem', marginBottom: '28px', display: 'inline-block' }}>
                 🚀 V2.0 — NVIDIA SegFormer Architecture
              </div>
              <h1 className="hero-title">
                Next-Gen Terrain<br/>Intelligence Platform
              </h1>
              <p className="hero-subtitle">
                Advanced semantic segmentation for autonomous off-road vehicles.<br/>
                Detect drivable paths, mud, water, and obstacles with pinpoint accuracy.
              </p>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <SignUpButton mode="modal">
                  <button className="btn-ghost" style={{ padding: '18px 48px', fontSize: '1.15rem' }}>
                    Access Dashboard
                  </button>
                </SignUpButton>
                <button className="btn-ghost" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>
                  View Documentation
                </button>
              </div>

              {/* Scroll indicator */}
              <div className="scroll-indicator">
                <div className="scroll-dot" />
              </div>
            </div>
          </div>

          {/* ============================================
              SECTION 1: FEATURES
              ============================================ */}
          <div id="features" className="landing-section scroll-reveal">
             <div className="section-header">
                <span className="section-tag">Core Capabilities</span>
                <h2 className="section-title">Powerful Inference Engine</h2>
                <p className="section-subtitle">Built for autonomous navigation across the harshest environments on Earth.</p>
             </div>
             
             <div className="features-grid">
                <div className="feature-card">
                   <div className="feature-icon"><Map color="var(--primary)" size={24} /></div>
                   <h3>10-Class Terrain Mapping</h3>
                   <p>Identifies distinct off-road terrains including dirt patches, deep mud, static pools, dense vegetation, rock formations, and asphalt transitions.</p>
                </div>
                <div className="feature-card">
                   <div className="feature-icon"><Activity color="var(--primary)" size={24} /></div>
                   <h3>Sub-150ms Latency</h3>
                   <p>Optimized Vision Transformer architectures deliver real-time inference perfectly suited for live video feeds on edge devices and embedded GPUs.</p>
                </div>
                <div className="feature-card">
                   <div className="feature-icon"><History color="var(--primary)" size={24} /></div>
                   <h3>Vector Memory Ledger</h3>
                   <p>Every prediction is embedded into a 768-dimensional vector space stored in Qdrant, enabling semantic similarity search across historical data.</p>
                </div>
                <div className="feature-card">
                   <div className="feature-icon"><Camera color="var(--primary)" size={24} /></div>
                   <h3>Multi-Input Support</h3>
                   <p>Upload images, extract frames from videos at 1 FPS, or capture directly from your device camera — all with a preview-first workflow.</p>
                </div>
                <div className="feature-card">
                   <div className="feature-icon"><Film color="var(--primary)" size={24} /></div>
                   <h3>Video Frame Analysis</h3>
                   <p>Upload videos up to 5 seconds. The system automatically extracts frames, processes each independently, and returns a composite terrain report.</p>
                </div>
                <div className="feature-card">
                   <div className="feature-icon"><Settings color="var(--primary)" size={24} /></div>
                   <h3>Secure Auth & History</h3>
                   <p>Clerk-powered authentication with complete prediction history, user-scoped data isolation, and exportable segmentation masks.</p>
                </div>
             </div>
          </div>

          {/* ============================================
              SECTION 2: HOW IT WORKS
              ============================================ */}
          <div id="how-it-works" className="landing-section scroll-reveal" style={{ borderTop: '1px solid var(--border-color)' }}>
             <div className="section-header">
                <span className="section-tag">Workflow</span>
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">From raw imagery to actionable terrain intelligence in four steps.</p>
             </div>

             <div className="steps-grid">
                <div className="step-card">
                   <div className="step-number">01</div>
                   <h3>Upload or Capture</h3>
                   <p>Choose your input method — drag-and-drop an image, upload a short video clip, or capture directly from your camera feed.</p>
                </div>
                <div className="step-card">
                   <div className="step-number">02</div>
                   <h3>Preview & Confirm</h3>
                   <p>Review your selection before processing. For videos, inspect each extracted frame individually. Nothing is sent to the server until you approve.</p>
                </div>
                <div className="step-card">
                   <div className="step-number">03</div>
                   <h3>AI Segmentation</h3>
                   <p>The NVIDIA SegFormer-B2 model processes your input through 768 transformer channels, producing a dense pixel-level terrain classification mask.</p>
                </div>
                <div className="step-card">
                   <div className="step-number">04</div>
                   <h3>Analyze & Export</h3>
                   <p>Inspect results with an interactive before/after slider, review the terrain composition legend, and download masks as high-resolution PNGs.</p>
                </div>
             </div>
          </div>

          {/* ============================================
              SECTION 3: TECH STACK
              ============================================ */}
          <div id="tech-stack" className="landing-section scroll-reveal" style={{ borderTop: '1px solid var(--border-color)' }}>
             <div className="section-header">
                <span className="section-tag">Architecture</span>
                <h2 className="section-title">Built on Proven Technology</h2>
                <p className="section-subtitle">Enterprise-grade infrastructure from model to deployment.</p>
             </div>

             <div className="tech-grid">
                <div className="tech-card">
                   <h4>SegFormer-B2</h4>
                   <p>NVIDIA's pre-trained Vision Transformer with hierarchical feature extraction</p>
                </div>
                <div className="tech-card">
                   <h4>PyTorch</h4>
                   <p>Dynamic computation graphs with CUDA, MPS, and CPU runtime support</p>
                </div>
                <div className="tech-card">
                   <h4>FastAPI</h4>
                   <p>Async Python backend with automatic OpenAPI documentation and validation</p>
                </div>
                <div className="tech-card">
                   <h4>Qdrant</h4>
                   <p>High-performance vector database for semantic similarity search</p>
                </div>
                <div className="tech-card">
                   <h4>React + Vite</h4>
                   <p>Lightning-fast frontend with hot module replacement and optimized builds</p>
                </div>
                <div className="tech-card">
                   <h4>Clerk Auth</h4>
                   <p>Enterprise authentication with SSO, MFA, and session management</p>
                </div>
             </div>
          </div>

          {/* ============================================
              SECTION 4: STATS BANNER
              ============================================ */}
          <div className="stats-banner scroll-reveal">
             <div className="stat-item">
                <span className="stat-value">98.4%</span>
                <span className="stat-label">Model Accuracy</span>
             </div>
             <div className="stat-item">
                <span className="stat-value">&lt;150ms</span>
                <span className="stat-label">Inference Latency</span>
             </div>
             <div className="stat-item">
                <span className="stat-value">10</span>
                <span className="stat-label">Terrain Classes</span>
             </div>
             <div className="stat-item">
                <span className="stat-value">768</span>
                <span className="stat-label">Embedding Dims</span>
             </div>
          </div>

          {/* ============================================
              SECTION 5: CTA
              ============================================ */}
          <div className="cta-section scroll-reveal">
             <h2>Ready to Navigate the Unknown?</h2>
             <p>Start segmenting off-road terrain in minutes. Free to use, no credit card required.</p>
             <SignUpButton mode="modal">
                <button className="btn-primary" style={{ padding: '18px 48px', fontSize: '1.15rem', boxShadow: '0 8px 30px rgba(59, 130, 246, 0.35)' }}>
                  Create Free Account
                </button>
             </SignUpButton>
          </div>

          {/* ============================================
              FOOTER
              ============================================ */}
          <footer className="site-footer scroll-reveal">
             <div className="footer-grid">
                {/* Brand Column */}
                <div className="footer-brand">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <Map size={22} color="var(--primary)" />
                      <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>Off-Road AI</span>
                   </div>
                   <p>Advanced terrain segmentation powered by NVIDIA SegFormer. Built for autonomous vehicular navigation and off-road research applications.</p>
                </div>

                {/* Product Column */}
                <div className="footer-col">
                   <h4>Product</h4>
                   <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Dashboard</a>
                   <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Image Analysis</a>
                   <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Video Processing</a>
                   <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Camera Capture</a>
                   <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">API Documentation ↗</a>
                </div>

                {/* Resources Column */}
                <div className="footer-col">
                   <h4>Resources</h4>
                   <a href="https://arxiv.org/abs/2105.15203" target="_blank" rel="noopener noreferrer">Research Paper ↗</a>
                   <a href="https://huggingface.co/docs/transformers/model_doc/segformer" target="_blank" rel="noopener noreferrer">SegFormer Docs ↗</a>
                   <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>Training Guide</a>
                   <a href="https://huggingface.co/nvidia/segformer-b2-finetuned-ade-512-512" target="_blank" rel="noopener noreferrer">Model Weights ↗</a>
                   <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Changelog</a>
                </div>

                {/* Contact Column */}
                <div className="footer-col">
                   <h4>Contact</h4>
                   <a href="mailto:mriganksingh792005@gmail.com">mriganksingh792005@gmail.com</a>
                   <a href="https://github.com/Rishi-shut/offroad-segmentation" target="_blank" rel="noopener noreferrer">GitHub Repository ↗</a>
                   <a href="https://github.com/Rishi-shut/offroad-segmentation/issues" target="_blank" rel="noopener noreferrer">Report an Issue ↗</a>
                   <a href="https://github.com/Rishi-shut/offroad-segmentation/issues/new" target="_blank" rel="noopener noreferrer">Feature Request ↗</a>
                </div>
             </div>

             <div className="footer-bottom">
                <p>&copy; 2026 Off-Road AI. All rights reserved.</p>
                <div className="footer-links">
                   <a href="#" onClick={e => { e.preventDefault(); setLegalPage('privacy'); }}>Privacy Policy</a>
                   <a href="#" onClick={e => { e.preventDefault(); setLegalPage('terms'); }}>Terms of Service</a>
                   <a href="#" onClick={e => { e.preventDefault(); setLegalPage('cookies'); }}>Cookie Policy</a>
                </div>
             </div>
          </footer>

          {/* Legal Page Overlay */}
          {legalPage && <LegalPage page={legalPage} onClose={() => setLegalPage(null)} />}

        </div>
      </Show>

      {/* ==========================================
          SIGNED IN — Dashboard
          ========================================== */}
      <Show when="signed-in">
        <div className="dashboard-layout">

          {/* ------ Sidebar ------ */}
          <aside className="sidebar">
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>
                <Map size={24} color="#fff" />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Off-Road AI</h2>
            </div>

            <nav style={{ flex: 1 }}>
              <div className="nav-item active">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </div>
              <div className="nav-item">
                <History size={20} />
                <span>History</span>
              </div>
              <div className="nav-item">
                <Activity size={20} />
                <span>System Stats</span>
              </div>
            </nav>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}></div>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>System Online</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SegFormer B2 • Auth Active</p>
            </div>
          </aside>

          {/* ------ Main Content ------ */}
          <main className="main-content">
            <header className="header">
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Terrain Intelligence</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Upload visuals for dense predictive segmentation</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="btn-primary" style={{ padding: '8px 16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <Settings size={18} />
                </button>
                <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 40, height: 40 } } }} />
              </div>
            </header>

            <div className="content-body">

              {/* Error Banner */}
              {error && (
                <div className="glass-panel animate-fade-in" style={{ padding: '16px 20px', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <AlertCircle color="#ef4444" size={20} />
                  <p style={{ color: '#fca5a5', flex: 1 }}>{error}</p>
                  <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              {/* ---- PHASE: IDLE (Input Selection) ---- */}
              {phase === 'idle' && (
                <div className="animate-fade-in">

                  {/* Quick Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}><Activity color="#fff" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Engine Status</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>Online</p>
                        </div>
                     </div>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}><Map color="#fff" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Model</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>SegFormer-B2</p>
                        </div>
                     </div>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}><History color="#fff" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quota</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>Unlimited</p>
                        </div>
                     </div>
                  </div>

                  {/* Input Area */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: '600' }}>New Analysis</h3>

                    {/* Tab Bar */}
                    <div className="tab-bar">
                      <button className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                        <ImageIcon size={18} /> Image
                      </button>
                      <button className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
                        <Film size={18} /> Video
                      </button>
                      <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
                        <Camera size={18} /> Camera
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'image' && <Uploader onFileChosen={handleFileChosen} />}
                    {activeTab === 'video' && <VideoUploader onFramesExtracted={handleFramesExtracted} />}
                    {activeTab === 'camera' && <CameraCapture onCapture={handleFileChosen} />}
                  </div>
                </div>
              )}

              {/* ---- PHASE: PREVIEW ---- */}
              {phase === 'preview' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <PreviewPanel
                    files={pendingFiles}
                    mode={activeTab}
                    onConfirm={handleAnalyze}
                    onCancel={handleReset}
                  />
                </div>
              )}

              {/* ---- PHASE: PROCESSING ---- */}
              {phase === 'processing' && (
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                   <div className="spinner" style={{ marginBottom: '24px' }}></div>
                   <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Processing {pendingFiles.length > 1 ? `${pendingFiles.length} frames` : 'image'}</h3>
                   <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Running inference via SegFormer model...</p>
                </div>
              )}

              {/* ---- PHASE: RESULTS ---- */}
              {phase === 'results' && (
                <ResultsPanel results={results} onReset={handleReset} />
              )}

            </div>
          </main>
        </div>
      </Show>
    </>
  );
}

export default App;

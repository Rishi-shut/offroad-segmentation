import React, { useState } from 'react';
import Uploader from './components/Uploader';
import ImageComparator from './components/ImageComparator';
import Legend from './components/Legend';
import { LayoutDashboard, Map, Settings, History, Activity, AlertCircle } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');

  const handlePredict = async (file) => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const objectUrl = URL.createObjectURL(file);
    setOriginalUrl(objectUrl);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${apiUrl}/predict/`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`API Connection Failed (Status: ${response.status})`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Cannot reach the backend. Ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Show when="signed-out">
        {/* Professional Landing Page */}
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
          
          {/* Navigation Bar */}
          <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Map size={24} color="var(--primary)" />
                <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#fff' }}>Off-Road AI</span>
             </div>
             <div>
                <SignInButton mode="modal">
                   <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginRight: '20px', cursor: 'pointer', fontWeight: '500' }}>Log In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                   <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Get Started</button>
                </SignUpButton>
             </div>
          </nav>

          {/* Hero Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '100px 20px', borderBottom: '1px solid var(--border-color)', background: 'radial-gradient(circle at top, rgba(59, 130, 246, 0.05), transparent 600px)' }}>
            <div style={{ padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '24px' }}>
               V2.0 Now Available: NVIDIA SegFormer Architecture
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '800', marginBottom: '24px', letterSpacing: '-1.5px', color: '#fff' }}>
              Next-Gen Terrain <br/> Intelligence Platform
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', marginBottom: '40px', lineHeight: '1.6' }}>
              Advanced semantic segmentation for autonomous off-road vehicles. Detect drivable paths, mud, water, and obstacles with pinpoint accuracy in real-time.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <SignUpButton mode="modal">
                <button className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
                  Access Dashboard
                </button>
              </SignUpButton>
              <button style={{ padding: '16px 40px', fontSize: '1.1rem', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                View Documentation
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
             <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '16px' }}>Powerful Inference Capabilities</h2>
                <p style={{ color: 'var(--text-muted)' }}>Built for edge devices and cloud analytics.</p>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                <div className="glass-panel" style={{ padding: '30px', margin: 0 }}>
                   <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                      <Map color="var(--primary)" size={24} />
                   </div>
                   <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '1.2rem' }}>10-Class Classification</h3>
                   <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Identifies distinct off-road terrains including dirt patches, deep mud, static pools, dense vegetation, and rock formations.</p>
                </div>
                
                <div className="glass-panel" style={{ padding: '30px', margin: 0 }}>
                   <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                      <Activity color="var(--primary)" size={24} />
                   </div>
                   <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '1.2rem' }}>Low Latency Pipeline</h3>
                   <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Optimized Transformer architectures deliver sub-150ms inference times perfectly suited for live video feed processing on the edge.</p>
                </div>

                <div className="glass-panel" style={{ padding: '30px', margin: 0 }}>
                   <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                      <History color="var(--primary)" size={24} />
                   </div>
                   <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '1.2rem' }}>Data Ledger</h3>
                   <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Automatically syncs inferences to a secure Postgres ledger and enables similarity search against Qdrant vector databases.</p>
                </div>
             </div>
          </div>
          
          {/* Footer */}
          <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
             &copy; 2026 Off-Road AI. All rights reserved.
          </footer>
        </div>
      </Show>

      <Show when="signed-in">
        {/* Main Dashboard (Signed In UI) */}
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '8px', borderRadius: '8px' }}>
                <Map size={24} color="#fff" />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Off-Road AI</h2>
            </div>

            <nav style={{ flex: 1 }}>
              <div className="nav-item active">
                <LayoutDashboard size={20} />
                <span>Analysis Dashboard</span>
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
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>System Online</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SegFormer B2 • Auth Active</p>
            </div>
          </aside>

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
                {/* User Profile Hook */}
                <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 40, height: 40 } } }} />
              </div>
            </header>

            <div className="content-body">
              {error && (
                <div className="glass-panel animate-fade-in" style={{ padding: '20px', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AlertCircle color="#ef4444" />
                  <div>
                    <h3 style={{ color: '#ef4444', marginBottom: '4px' }}>Processing Failed</h3>
                    <p style={{ color: '#fca5a5' }}>{error}</p>
                  </div>
                </div>
              )}

              {!result && !loading && (
                <div className="animate-fade-in">
                  {/* Dashboard Quick Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}><Activity color="var(--primary)" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Engine Status</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>Online / Syncing</p>
                        </div>
                     </div>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)' }}><Map color="var(--accent)" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Model</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>SegFormer-B2 Opt</p>
                        </div>
                     </div>
                     <div className="glass-panel" style={{ padding: '20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}><History color="#10b981" size={24}/></div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Quota</p>
                          <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#10b981' }}>Unlimited</p>
                        </div>
                     </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '40px' }}>
                    <h3 style={{ marginBottom: '24px', fontSize: '1.3rem', fontWeight: '600' }}>Upload Imagery</h3>
                    <Uploader onFileSelected={handlePredict} />
                  </div>
                </div>
              )}

              {loading && (
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                   <div className="spinner" style={{ marginBottom: '24px' }}></div>
                   <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Extracting Terrain Features</h3>
                   <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Running inference via SegFormer model...</p>
                </div>
              )}

              {result && !loading && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                     <h2 style={{ fontSize: '1.4rem' }}>Segmentation Results</h2>
                     <button className="btn-primary" onClick={() => { setResult(null); setOriginalUrl(''); }}>
                       Analyze New Image
                     </button>
                  </div>

                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <ImageComparator 
                      originalSrc={originalUrl} 
                      maskSrc={`data:image/png;base64,${result.mask_base64}`} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                     <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                           Telemetry
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                           <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary)' }}>
                             {result.classes.length}
                           </span>
                           <span style={{ color: 'var(--text-muted)' }}>Unique Terrains</span>
                        </div>
                     </div>

                     <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                           Detected Composition
                        </h3>
                        <Legend classes={result.classes} />
                     </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </Show>
    </>
  );
}

export default App;

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
        {/* Landing Page (Signed Out UI) */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
            <Map size={48} color="#fff" />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '16px' }} className="text-gradient">Off-Road AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6' }}>
            Military-grade terrain segmentation and predictive analytics for autonomous vehicular navigation. Sign in to access your intelligence dashboard.
          </p>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <SignInButton mode="modal">
              <button className="btn-primary" style={{ padding: '14px 28px', fontSize: '1.1rem', background: 'var(--bg-panel)', border: '1px solid var(--primary)', color: '#fff' }}>
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary" style={{ padding: '14px 36px', fontSize: '1.1rem' }}>
                Get Started
              </button>
            </SignUpButton>
          </div>
        </div>
      </Show>

      <Show when="signed-in">
        {/* Main Dashboard (Signed In UI) */}
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '8px', borderRadius: '8px' }}>
                <Map size={24} color="#fff" />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '1.2rem' }}>Off-Road AI</h2>
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
                <div className="glass-panel animate-fade-in">
                  <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: '500' }}>New Analysis</h3>
                  <Uploader onFileSelected={handlePredict} />
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

import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Zap, BarChart3 } from 'lucide-react';

/**
 * SystemHUD Component
 * -------------------
 * Futuristic "Ghost" HUD for real-time model telemetry.
 */
const SystemHUD = ({ stats = {} }) => {
  const [wave, setWave] = useState([]);

  // Simulate a live neural waveform
  useEffect(() => {
    const interval = setInterval(() => {
      setWave(prev => {
        const next = [...prev, Math.random() * 40 + 10];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="system-hud glass-panel animate-slide-in-right" style={{ 
      padding: '24px', 
      background: 'rgba(5, 5, 5, 0.6)', 
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Zap size={18} color="var(--primary)" />
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
          Neural HUD
        </h3>
      </div>

      {/* Neural Waveform Trace */}
      <div style={{ 
        height: '60px', 
        width: '100%', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '2px',
        padding: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.03)'
      }}>
        {wave.map((h, i) => (
          <div key={i} style={{ 
            flex: 1, 
            height: `${h}%`, 
            background: 'var(--primary)', 
            opacity: (i + 1) / wave.length,
            borderRadius: '2px',
            transition: 'height 0.2s ease'
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Device Stat */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Cpu size={14} />
            <span style={{ fontSize: '0.8rem' }}>Processor</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
            {stats.device?.toUpperCase() || 'CPU'}
          </span>
        </div>

        {/* Latency Stat */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Activity size={14} />
            <span style={{ fontSize: '0.8rem' }}>Latency</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: stats.avg_latency > 300 ? '#ffb948' : 'var(--primary)' }}>
            {Math.round(stats.avg_latency)}ms
          </span>
        </div>

        {/* Model Stat */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <BarChart3 size={14} />
            <span style={{ fontSize: '0.8rem' }}>Architecture</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
            {stats.model || 'SegFormer-B2'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
          Engine Status: Stable
        </p>
      </div>
    </div>
  );
};

export default SystemHUD;

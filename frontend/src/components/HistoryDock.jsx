import React from 'react';
import { History, Calendar, Layers } from 'lucide-react';

/**
 * HistoryDock Component
 * --------------------
 * A "Ghost" themed footer dock showing previous analysis sessions.
 */
const HistoryDock = ({ history = [] }) => {
  if (history.length === 0) return null;

  return (
    <div className="history-dock animate-slide-in-bottom" style={{ 
      marginTop: '40px',
      padding: '24px', 
      background: 'rgba(5, 5, 5, 0.4)', 
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '20px',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <History size={18} color="var(--primary)" />
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
          Session Memory
        </h3>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        overflowX: 'auto', 
        paddingBottom: '8px', 
        scrollbarWidth: 'thin', 
        scrollbarColor: 'rgba(255,255,255,0.1) transparent'
      }}>
        {history.map((item, idx) => (
          <div key={idx} className="history-ghost-card" style={{ 
            minWidth: '200px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>#{item.id || idx + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                <Calendar size={12} />
                <span style={{ fontSize: '0.7rem' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>
            
            <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.image_name}
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={12} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {item.predicted_classes?.length || 0} Terrains Detected
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryDock;

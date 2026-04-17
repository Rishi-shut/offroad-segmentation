import React from 'react';

const CLASS_NAMES = ['Background', 'Road', 'Vegetation', 'Gravel', 'Sand', 'Rock', 'Obstacle', 'Trail', 'Water', 'Other'];
const CLASS_COLORS = ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#808080', '#400000', '#C00000'];

const Legend = ({ classes = [] }) => {
  if (classes.length === 0) return null;

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '15px' }}>Detected Terrains</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        {classes.map(clsIndex => (
          <div 
            key={clsIndex} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: '#2a2a4e', padding: '8px 12px', borderRadius: '8px'
            }}
          >
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: CLASS_COLORS[clsIndex] }}></div>
            <span>{CLASS_NAMES[clsIndex]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;

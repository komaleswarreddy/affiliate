import React, { useState, useEffect } from 'react';
import { isDevelopment, enableMockApiMode, disableMockApiMode, isMockApiModeEnabled } from '../lib/utils';

/**
 * Development Tools Component
 * 
 * This component is only shown in development mode and provides tools to help with development
 * such as enabling/disabling mock API mode.
 */
const DevelopmentTools: React.FC = () => {
  const [mockMode, setMockMode] = useState(false);
  
  // Check if mock mode is enabled on initial render
  useEffect(() => {
    setMockMode(isMockApiModeEnabled());
  }, []);
  
  if (!isDevelopment) {
    return null;
  }
  
  const toggleMockMode = () => {
    if (mockMode) {
      disableMockApiMode();
    } else {
      enableMockApiMode();
    }
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Development Tools</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input 
          type="checkbox" 
          id="mock-mode" 
          checked={mockMode} 
          onChange={toggleMockMode} 
          style={{ marginRight: '5px' }} 
        />
        <label htmlFor="mock-mode">Mock API Mode</label>
      </div>
      <div style={{ marginTop: '5px', fontSize: '10px' }}>
        {mockMode ? (
          <span style={{ color: '#ffcc00' }}>Mock mode enabled - using fake data</span>
        ) : (
          <span>Using real API endpoints</span>
        )}
      </div>
      <div style={{ marginTop: '5px', fontSize: '10px' }}>
        <strong>Demo User:</strong> demo@example.com / Demo123!
      </div>
    </div>
  );
};

export default DevelopmentTools; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isDevelopment } from './lib/utils';

// Import debug tools in development
if (isDevelopment) {
  // Import auth test helpers
  import('./lib/auth-console-test');
  
  // Import auth debugging utilities
  import('./lib/auth-debug-utils');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

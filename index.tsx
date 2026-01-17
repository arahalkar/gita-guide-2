
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Resilient Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Determine the correct script URL relative to the current origin
    // This helps avoid origin mismatch errors in preview environments.
    const swUrl = new URL('./sw.js', window.location.href).href;
    
    // Only attempt registration if the script is on the same origin
    if (new URL(swUrl).origin === window.location.origin) {
      navigator.serviceWorker.register(swUrl).then(registration => {
        console.log('SW registered successfully');
      }).catch(err => {
        console.warn('SW registration skipped or failed:', err.message);
      });
    } else {
      console.warn('SW registration skipped: Script origin mismatch');
    }
  });
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`).catch((error) => {
      console.error('No se pudo registrar el service worker:', error);
    });
  });
}

const root = createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

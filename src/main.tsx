<<<<<<< HEAD
// v3.6.2-ALIGNED-FINAL: Root mount
=======
// v3.5.8-RECOVERY: Root mount
>>>>>>> sovereign-elite-v3-6
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Force unregister any leftover service workers from old builds
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('[Nova] Unregistered stale service worker:', registration.scope);
    });
  });
}

// Clear any leftover SW caches
if ('caches' in window) {
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
    if (keys.length > 0) console.log('[Nova] Cleared', keys.length, 'stale caches');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

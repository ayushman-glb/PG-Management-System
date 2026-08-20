import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../index.css'
import { authService } from '../services/auth.service'

// Dynamic Chunk Recovery: If Vite fails to fetch a chunk due to a new production deployment, auto-reload.
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Chunk preload error detected (new deployment). Reloading page...', event);
  const key = 'vite_preload_retry';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, 'true');
    window.location.reload();
  }
});

window.addEventListener('error', (event) => {
  const isChunkError =
    event?.message?.includes('Failed to fetch dynamically imported module') ||
    event?.message?.includes('Importing a module script failed');
  if (isChunkError) {
    const key = 'chunk_reload_attempted';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'true');
      console.warn('[App] Dynamic chunk fetch failed. Automatically reloading latest bundle...');
      window.location.reload();
    }
  }
});

// Clear reload flags on successful load
setTimeout(() => {
  sessionStorage.removeItem('vite_preload_retry');
  sessionStorage.removeItem('chunk_reload_attempted');
  sessionStorage.removeItem('lazy_chunk_reload_once');
}, 5000);

// Bootstrap CSRF token on first load so anonymous visitors can call
// /register, /login, and /refresh-token without a CSRF 403.
// Fire-and-forget: non-blocking, does not delay render.
authService.bootstrapCsrf().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

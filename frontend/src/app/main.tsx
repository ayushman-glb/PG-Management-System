import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../index.css'
import { authService } from '../services/auth.service'

// Bootstrap CSRF token on first load so anonymous visitors can call
// /register, /login, and /refresh-token without a CSRF 403.
// Fire-and-forget: non-blocking, does not delay render.
authService.bootstrapCsrf().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

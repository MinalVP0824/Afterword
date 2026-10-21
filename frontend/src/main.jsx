import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { api } from './api'

// The free backend sleeps when idle. Ping it straight away so it is awake
// by the time the visitor reaches the login screen.
api.health().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
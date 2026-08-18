import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { PrivacyPolicy } from './PrivacyPolicy.tsx'

const page = window.location.pathname === '/privacy' ? <PrivacyPolicy /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>{page}</ErrorBoundary>
  </StrictMode>,
)

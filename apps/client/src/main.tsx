import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { PrivacyPolicy } from './PrivacyPolicy.tsx'
import { Terms } from './Terms.tsx'

const path = window.location.pathname
const page = path === '/privacy' ? <PrivacyPolicy /> : path === '/terms' ? <Terms /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>{page}</ErrorBoundary>
  </StrictMode>,
)

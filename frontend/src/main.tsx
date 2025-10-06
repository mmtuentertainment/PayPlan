import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallbackTitle="Application Error"
      fallbackMessage="The application encountered an unexpected error. Please refresh the page to try again."
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

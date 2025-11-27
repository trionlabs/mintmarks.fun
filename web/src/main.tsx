import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CDPReactProvider } from '@coinbase/cdp-react'
import './index.css'
import App from './App.tsx'

// CDP Configuration for Base chain with EOA wallet
const cdpConfig = {
  projectId: import.meta.env.VITE_CDP_PROJECT_ID || '',
  appName: import.meta.env.VITE_CDP_APP_NAME || 'mintmarks',
  ethereum: {
    createOnLogin: 'eoa' as const, // EOA wallet on Base
  },
}

// Error component when CDP Project ID is missing
function CDPConfigError() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#f0f0f0',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ff6b6b' }}>
        CDP Configuration Missing
      </h1>
      <p style={{ marginBottom: '1rem', color: '#a0a0a0' }}>
        VITE_CDP_PROJECT_ID is not set in your .env file.
      </p>
      <code
        style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          fontSize: '0.875rem',
        }}
      >
        VITE_CDP_PROJECT_ID=your-project-id
      </code>
    </div>
  )
}

// Check if CDP is configured
const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCDPConfigured ? (
      <CDPReactProvider config={cdpConfig}>
        <App />
      </CDPReactProvider>
    ) : (
      <CDPConfigError />
    )}
  </StrictMode>,
)

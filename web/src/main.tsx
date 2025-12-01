import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { CDPReactProvider } from '@coinbase/cdp-react'
import { CDPHooksProvider } from '@coinbase/cdp-hooks'
import { WalletProvider } from './wallet'
import { wagmiConfig } from './config/wagmi'
import App from './App.tsx'
import './index.css'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

/**
 * Clear stale CDP auth tokens on 401 errors.
 * This prevents the "stuck" state where isSignedIn=true but tokens are invalid.
 */
function clearStaleCdpTokens() {
  const keysToRemove = Object.keys(localStorage).filter(
    (k) => k.includes('cdp') || k.includes('coinbase') || k.includes('embedded-wallet')
  )
  if (keysToRemove.length > 0) {
    console.warn('[Auth] Clearing stale CDP tokens:', keysToRemove.length, 'keys')
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  }
}

// Global fetch interceptor to detect CDP 401 errors
// Only intercept CDP API calls to avoid TrustedScript/CSP issues
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const input = args[0]
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : ''
  
  // Only intercept CDP API calls
  const isCdpApiCall = url.includes('api.cdp.coinbase.com')
  
  const response = await originalFetch(...args)
  
  // If CDP API returns 401, clear stale tokens
  if (isCdpApiCall && response.status === 401) {
    console.warn('[Auth] CDP auth failed with 401, clearing stale tokens')
    clearStaleCdpTokens()
    // Don't reload automatically - let user manually reconnect
  }
  
  return response
}

// QueryClient with recommended defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - prevents refetch on mount
      gcTime: 1000 * 60 * 60, // 1 hour garbage collection
      retry: 1, // Only retry failed queries once
    },
  },
})

// CDP Configuration (existing)
const cdpConfig = {
  projectId: import.meta.env.VITE_CDP_PROJECT_ID || '',
  appName: import.meta.env.VITE_CDP_APP_NAME || 'mintmarks',
  ethereum: {
    createOnLogin: 'eoa' as const,
  },
}

// Check if CDP is configured
const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID

/**
 * Provider hierarchy (outer to inner):
 * 1. QueryClientProvider - TanStack Query (shared by wagmi)
 * 2. WagmiProvider - External wallet state
 * 3. RainbowKitProvider - Wallet connection UI
 * 4. CDPReactProvider - CDP embedded wallet UI components (optional)
 * 5. CDPHooksProvider - CDP hooks context (required for @coinbase/cdp-hooks)
 * 6. WalletProvider - Unified wallet abstraction
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider initialChain={baseSepolia}>
          {isCDPConfigured ? (
            <CDPReactProvider config={cdpConfig}>
              <CDPHooksProvider config={cdpConfig}>
                <WalletProvider>
                  <App />
                </WalletProvider>
              </CDPHooksProvider>
            </CDPReactProvider>
          ) : (
            <WalletProvider>
              <App />
            </WalletProvider>
          )}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>
)

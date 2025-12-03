import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { CDPReactProvider } from '@coinbase/cdp-react'
import { CDPHooksProvider } from '@coinbase/cdp-hooks'
import { WalletProvider, CdpNetworkProvider } from './wallet'
import { wagmiConfig } from './config/wagmi'
import App from './App.tsx'
import './index.css'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

// Wallet auth state utilities
import { shouldWagmiReconnect, logAuthState } from './wallet/utils/walletAuthState'

// Global network interceptor for CDP 401 handling (fetch + XHR)
import { initNetworkInterceptor } from './utils/fetchInterceptor'

// ============================================
// Initialization (runs before React renders)
// ============================================

// Initialize network interceptor for CDP 401 error handling
initNetworkInterceptor()

// Determine wagmi reconnect behavior based on CDP auth state
// SECURITY: Prevents auto-connect bug when CDP user has MetaMask installed
const reconnectOnMount = shouldWagmiReconnect()

// Debug logging (dev only)
if (import.meta.env.DEV) {
  console.log('[main] wagmi reconnectOnMount:', reconnectOnMount)
  logAuthState()
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
 *    - reconnectOnMount: false when CDP is signed in (prevents auto-connect bug)
 * 3. RainbowKitProvider - Wallet connection UI
 * 4. CDPReactProvider - CDP embedded wallet UI components (optional)
 * 5. CDPHooksProvider - CDP hooks context (required for @coinbase/cdp-hooks)
 * 6. CdpNetworkProvider - CDP network selection state (multichain)
 * 7. WalletProvider - Unified wallet abstraction
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={reconnectOnMount}>
        <RainbowKitProvider initialChain={sepolia}>
          {isCDPConfigured ? (
            <CDPReactProvider config={cdpConfig}>
              <CDPHooksProvider config={cdpConfig}>
                <CdpNetworkProvider>
                  <WalletProvider>
                    <App />
                  </WalletProvider>
                </CdpNetworkProvider>
              </CDPHooksProvider>
            </CDPReactProvider>
          ) : (
            <CdpNetworkProvider>
              <WalletProvider>
                <App />
              </WalletProvider>
            </CdpNetworkProvider>
          )}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>
)

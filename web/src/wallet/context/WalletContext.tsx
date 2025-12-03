/**
 * @fileoverview Wallet context provider.
 * Makes useWallet() available throughout the app.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useUnifiedWallet } from '../hooks/useUnifiedWallet'
import type { UnifiedWallet } from '../types'

const WalletContext = createContext<UnifiedWallet | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useUnifiedWallet()
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  )
}

/**
 * Default wallet state for when context is not available.
 * Used to prevent crashes during provider initialization.
 */
const DEFAULT_WALLET: UnifiedWallet = {
  address: null,
  isConnected: false,
  source: null,
  chainId: null,
  isLoading: false,
  error: null,
  isMultichain: false,
  sendTransaction: async (_tx) => {
    throw new Error('Wallet not connected')
  },
  disconnect: async () => {},
  switchChain: undefined,
  canSwitchChain: false,
}

/**
 * Hook to access unified wallet.
 * Returns safe defaults if used outside WalletProvider (prevents crashes during initialization).
 */
export function useWallet(): UnifiedWallet {
  const context = useContext(WalletContext)
  
  // Return safe defaults if context is not available
  // This prevents crashes during provider initialization or error recovery
  return useMemo(() => {
    if (!context) {
      if (import.meta.env.DEV) {
        console.warn(
          '[useWallet] Context not available - returning defaults. ' +
          'This may indicate WalletProvider is not in the component tree.'
        )
      }
      return DEFAULT_WALLET
    }
    return context
  }, [context])
}

/**
 * @fileoverview Wallet context provider.
 * Makes useWallet() available throughout the app.
 */

import { createContext, useContext, type ReactNode } from 'react'
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
 * Hook to access unified wallet.
 * @throws Error if used outside WalletProvider
 */
export function useWallet(): UnifiedWallet {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

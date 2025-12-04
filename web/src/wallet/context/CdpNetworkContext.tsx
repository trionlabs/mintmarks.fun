/**
 * @fileoverview CDP Network Context
 * 
 * Manages selected network state for CDP embedded wallets.
 * CDP wallets are multichain native - this tracks user's network preference.
 * 
 * WHY SEPARATE CONTEXT?
 * 1. Single Responsibility: Wallet state vs network selection are different concerns
 * 2. CDP-specific: External wallets use wagmi's chain state instead
 * 3. Testability: Easy to mock in tests without mocking entire wallet
 * 4. Future-proof: Can add CDP-specific features (gas sponsorship, network health)
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { ACTIVE_NETWORK, NETWORKS } from '@/config/contracts'
import { isActiveNetwork } from '@/config/chains'

// ============================================
// Types
// ============================================

type NetworkConfig = typeof NETWORKS[keyof typeof NETWORKS]

interface CdpNetworkContextValue {
  /** Selected network chainId for CDP wallets */
  selectedChainId: number
  /** Update selected network (validates before setting) */
  setSelectedChainId: (chainId: number) => void
  /** Full network config for selected chain */
  selectedNetwork: NetworkConfig
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'mintmarks_selected_network'

// ============================================
// Context
// ============================================

const CdpNetworkContext = createContext<CdpNetworkContextValue | null>(null)

// ============================================
// Provider
// ============================================

export function CdpNetworkProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage with validation
  const [selectedChainId, setSelectedChainIdState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && isActiveNetwork(parsed)) {
          return parsed
        }
      }
    } catch {
      // localStorage not available (SSR or privacy mode)
    }
    return ACTIVE_NETWORK.chainId
  })

  // Setter with validation and persistence
  const setSelectedChainId = useCallback((chainId: number) => {
    if (!isActiveNetwork(chainId)) {
      if (import.meta.env.DEV) {
        console.warn('[CdpNetworkContext] Attempted to set inactive chainId:', chainId)
      }
      return
    }
    
    setSelectedChainIdState(chainId)
    
    try {
      localStorage.setItem(STORAGE_KEY, chainId.toString())
    } catch {
      // localStorage not available
    }
    
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        const network = Object.values(NETWORKS).find(n => n.chainId === chainId)
        console.log('[CdpNetworkContext] Selected network:', network?.name ?? chainId)
      }
    }
  }, [])

  // Derive full network config
  const selectedNetwork = useMemo(() => {
    return Object.values(NETWORKS).find(n => n.chainId === selectedChainId) ?? ACTIVE_NETWORK
  }, [selectedChainId])

  const value = useMemo(() => ({
    selectedChainId,
    setSelectedChainId,
    selectedNetwork,
  }), [selectedChainId, setSelectedChainId, selectedNetwork])

  return (
    <CdpNetworkContext.Provider value={value}>
      {children}
    </CdpNetworkContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

/**
 * Hook to access CDP network selection.
 * 
 * @throws Error in production if used outside CdpNetworkProvider
 * @returns Fallback values in development for easier debugging
 */
export function useCdpNetwork(): CdpNetworkContextValue {
  const context = useContext(CdpNetworkContext)
  
  if (!context) {
    // In production, fail fast to catch misconfigurations early
    if (import.meta.env.PROD) {
      throw new Error(
        '[useCdpNetwork] Must be used within CdpNetworkProvider. ' +
        'Ensure CdpNetworkProvider is wrapping your app in main.tsx.'
      )
    }
    
    // In development, return fallback with warning for easier debugging
    console.warn(
      '[useCdpNetwork] Used outside CdpNetworkProvider. ' +
      'Returning defaults. This will throw in production!'
    )
    return {
      selectedChainId: ACTIVE_NETWORK.chainId,
      setSelectedChainId: () => {
        console.warn('[useCdpNetwork] setSelectedChainId called outside provider - no-op')
      },
      selectedNetwork: ACTIVE_NETWORK,
    }
  }
  
  return context
}


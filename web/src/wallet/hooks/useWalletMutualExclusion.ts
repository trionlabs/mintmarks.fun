/**
 * @fileoverview Wallet Mutual Exclusion Hook
 * 
 * Ensures only one wallet type (CDP or External) is active at a time.
 * Priority: CDP > External (if both connected, external will be disconnected)
 * 
 * EXTRACTED FROM: useUnifiedWallet.ts for better separation of concerns.
 */

import { useEffect, useRef } from 'react'

interface UseWalletMutualExclusionParams {
  cdpConnected: boolean
  externalConnected: boolean
  externalDisconnect: () => Promise<void>
}

/**
 * Enforce mutual exclusion between CDP and external wallets.
 * CDP always takes priority - if both are connected, external is disconnected.
 */
export function useWalletMutualExclusion({
  cdpConnected,
  externalConnected,
  externalDisconnect,
}: UseWalletMutualExclusionParams): void {
  // Ref to prevent infinite loops (disconnect triggers re-render)
  const hasDisconnectedExternalRef = useRef(false)

  useEffect(() => {
    // Both connected - disconnect external (CDP priority)
    if (cdpConnected && externalConnected && !hasDisconnectedExternalRef.current) {
      hasDisconnectedExternalRef.current = true
      externalDisconnect()
      
      if (import.meta.env.DEV) {
        console.log('[useWalletMutualExclusion] Both connected, disconnecting external (CDP priority)')
      }
    }

    // Reset flag when CDP disconnects (allow external to connect again)
    if (!cdpConnected) {
      hasDisconnectedExternalRef.current = false
    }
  }, [cdpConnected, externalConnected, externalDisconnect])
}


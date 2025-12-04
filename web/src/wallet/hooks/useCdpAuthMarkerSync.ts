/**
 * @fileoverview CDP Auth Marker Sync Hook
 * 
 * Keeps the explicit CDP auth marker in sync with CDP connection state.
 * This marker is checked BEFORE React renders on page load to determine
 * wagmi's reconnectOnMount behavior.
 * 
 * EXTRACTED FROM: useUnifiedWallet.ts for better separation of concerns.
 */

import { useEffect, useRef } from 'react'
import { setCdpActive, clearCdpActive } from '../utils/walletAuthState'

/**
 * Sync CDP auth marker with connection state.
 * 
 * @param cdpConnected - Current CDP connection state
 */
export function useCdpAuthMarkerSync(cdpConnected: boolean): void {
  // Track previous state to detect changes
  const prevCdpConnectedRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Initial render - set marker if already connected
    if (prevCdpConnectedRef.current === null) {
      if (cdpConnected) {
        setCdpActive()
      }
      prevCdpConnectedRef.current = cdpConnected
      return
    }
    
    // State changed: connected
    if (cdpConnected && !prevCdpConnectedRef.current) {
      setCdpActive()
    }
    
    // State changed: disconnected
    if (!cdpConnected && prevCdpConnectedRef.current) {
      clearCdpActive()
    }
    
    prevCdpConnectedRef.current = cdpConnected
  }, [cdpConnected])
}


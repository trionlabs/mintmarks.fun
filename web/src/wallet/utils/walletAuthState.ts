/**
 * @fileoverview Wallet Auth State Management Utilities
 * 
 * Provides explicit control over wallet authentication state markers.
 * Used to coordinate between CDP (email) auth and wagmi (external wallet) auth.
 * 
 * PROBLEM SOLVED:
 * When user signs in with CDP (email), we don't want wagmi to auto-reconnect
 * external wallets (MetaMask, etc.) on page refresh. This would cause:
 * 1. Flash of wrong wallet
 * 2. Confusing UX (user chose email, not browser wallet)
 * 3. Unnecessary disconnect/reconnect cycle
 * 
 * SOLUTION:
 * We maintain explicit markers in localStorage that indicate which auth method
 * is active. These markers are checked BEFORE React renders to determine
 * wagmi's reconnectOnMount behavior.
 * 
 * KEY PATTERNS:
 * - MINTMARKS_CDP_ACTIVE: Set when CDP login succeeds, cleared on logout
 * - wagmi.* keys: Managed by wagmi SDK (we don't touch these directly)
 * - CDP SDK keys: Various coinbase/cdp/privy patterns (read-only check)
 */

// ============================================
// Constants
// ============================================

/**
 * Our explicit marker for CDP auth state.
 * This is the SOURCE OF TRUTH for "is CDP active?"
 */
export const CDP_ACTIVE_KEY = 'mintmarks_cdp_active'

/**
 * wagmi's default storage key prefix.
 * Used to identify wagmi-managed localStorage keys.
 */
export const WAGMI_KEY_PREFIX = 'wagmi'

/**
 * Patterns that indicate CDP SDK localStorage keys.
 * These are heuristic - CDP SDK doesn't document exact keys.
 */
const CDP_KEY_PATTERNS = [
  'coinbase',
  'cdp',
  'embedded-wallet',
  'privy', // Some CDP versions use Privy under the hood
] as const

// ============================================
// CDP Auth State Management
// ============================================

/**
 * Mark CDP as active (call after successful CDP login).
 * This prevents wagmi from auto-reconnecting external wallets.
 */
export function setCdpActive(): void {
  try {
    localStorage.setItem(CDP_ACTIVE_KEY, 'true')
    if (import.meta.env.DEV) {
      console.log('[walletAuthState] CDP marked as active')
    }
  } catch (error) {
    console.error('[walletAuthState] Failed to set CDP active:', error)
  }
}

/**
 * Clear CDP active marker (call on CDP logout).
 * This allows wagmi to auto-reconnect external wallets on next page load.
 */
export function clearCdpActive(): void {
  try {
    localStorage.removeItem(CDP_ACTIVE_KEY)
    if (import.meta.env.DEV) {
      console.log('[walletAuthState] CDP active marker cleared')
    }
  } catch (error) {
    console.error('[walletAuthState] Failed to clear CDP active:', error)
  }
}

/**
 * Check if our explicit CDP marker is set.
 * This is the primary check - fast and reliable.
 */
export function isCdpMarkerSet(): boolean {
  try {
    return localStorage.getItem(CDP_ACTIVE_KEY) === 'true'
  } catch {
    return false
  }
}

// ============================================
// CDP SDK State Detection (Heuristic)
// ============================================

/**
 * Check if CDP SDK has any auth-related state in localStorage.
 * This is a FALLBACK heuristic for cases where our marker wasn't set
 * (e.g., user logged in before we added the marker system).
 * 
 * WARNING: This is not 100% reliable as CDP SDK key patterns may change.
 */
export function hasCdpSdkState(): boolean {
  try {
    const allKeys = Object.keys(localStorage)
    
    // Find keys matching CDP patterns
    const cdpKeys = allKeys.filter(key => {
      const lowerKey = key.toLowerCase()
      return CDP_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern))
    })
    
    // Exclude wagmi keys that might match (e.g., wagmi.coinbaseWallet.*)
    const nonWagmiCdpKeys = cdpKeys.filter(key => 
      !key.toLowerCase().startsWith(WAGMI_KEY_PREFIX)
    )
    
    // Check if any non-wagmi CDP key has a value
    return nonWagmiCdpKeys.some(key => {
      const value = localStorage.getItem(key)
      return value && value.length > 0
    })
  } catch {
    return false
  }
}

/**
 * Get all CDP-related localStorage keys (for debugging).
 */
export function getCdpRelatedKeys(): string[] {
  try {
    return Object.keys(localStorage).filter(key => {
      const lowerKey = key.toLowerCase()
      return CDP_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern))
    })
  } catch {
    return []
  }
}

// ============================================
// Combined Auth State Check
// ============================================

/**
 * Determine if CDP auth is active.
 * Uses our explicit marker as primary, falls back to SDK state detection.
 * 
 * CALL TIMING: This should be called BEFORE React renders to determine
 * wagmi's reconnectOnMount behavior.
 * 
 * @returns true if CDP is likely active (don't auto-reconnect external wallets)
 */
export function isCdpAuthActive(): boolean {
  // Primary: Check our explicit marker
  if (isCdpMarkerSet()) {
    return true
  }
  
  // Fallback: Check CDP SDK state (for backwards compatibility)
  return hasCdpSdkState()
}

/**
 * Determine if wagmi should auto-reconnect external wallets on mount.
 * 
 * LOGIC:
 * - If CDP is active → Don't reconnect (user chose email auth)
 * - If CDP is not active → Allow reconnect (might be external wallet user)
 */
export function shouldWagmiReconnect(): boolean {
  return !isCdpAuthActive()
}

// ============================================
// Cleanup Utilities
// ============================================

/**
 * Clear all CDP-related localStorage keys.
 * Use this for complete logout or when CDP auth becomes stale.
 * 
 * WARNING: This is aggressive - only use when you're sure CDP session is invalid.
 */
export function clearAllCdpState(): void {
  try {
    // Clear our marker
    clearCdpActive()
    
    // Clear CDP SDK keys (excluding wagmi keys)
    const cdpKeys = getCdpRelatedKeys().filter(key => 
      !key.toLowerCase().startsWith(WAGMI_KEY_PREFIX)
    )
    
    if (cdpKeys.length > 0) {
      if (import.meta.env.DEV) {
        console.log('[walletAuthState] Clearing CDP keys:', cdpKeys)
      }
      cdpKeys.forEach(key => localStorage.removeItem(key))
    }
  } catch (error) {
    console.error('[walletAuthState] Failed to clear CDP state:', error)
  }
}

/**
 * Clear wagmi's external wallet connection state.
 * Use this when you want to force disconnect external wallets.
 * 
 * NOTE: This clears wagmi's persisted state, not the actual wallet connection.
 * The wallet will disconnect on next page load.
 */
export function clearWagmiState(): void {
  try {
    const wagmiKeys = Object.keys(localStorage).filter(key => 
      key.toLowerCase().startsWith(WAGMI_KEY_PREFIX)
    )
    
    if (wagmiKeys.length > 0) {
      if (import.meta.env.DEV) {
        console.log('[walletAuthState] Clearing wagmi keys:', wagmiKeys)
      }
      wagmiKeys.forEach(key => localStorage.removeItem(key))
    }
  } catch (error) {
    console.error('[walletAuthState] Failed to clear wagmi state:', error)
  }
}

// ============================================
// Debug Utilities
// ============================================

/**
 * Get a summary of current auth state (for debugging).
 */
export function getAuthStateSummary(): {
  cdpMarkerSet: boolean
  cdpSdkState: boolean
  cdpActive: boolean
  shouldReconnect: boolean
  cdpKeys: string[]
  wagmiKeys: string[]
} {
  const cdpKeys = getCdpRelatedKeys()
  const wagmiKeys = Object.keys(localStorage).filter(key => 
    key.toLowerCase().startsWith(WAGMI_KEY_PREFIX)
  )
  
  return {
    cdpMarkerSet: isCdpMarkerSet(),
    cdpSdkState: hasCdpSdkState(),
    cdpActive: isCdpAuthActive(),
    shouldReconnect: shouldWagmiReconnect(),
    cdpKeys,
    wagmiKeys,
  }
}

/**
 * Log auth state summary to console (dev only).
 */
export function logAuthState(): void {
  if (!import.meta.env.DEV) return
  
  const summary = getAuthStateSummary()
  console.group('[walletAuthState] Auth State Summary')
  console.log('CDP marker set:', summary.cdpMarkerSet)
  console.log('CDP SDK state detected:', summary.cdpSdkState)
  console.log('CDP active (combined):', summary.cdpActive)
  console.log('Should wagmi reconnect:', summary.shouldReconnect)
  console.log('CDP-related keys:', summary.cdpKeys)
  console.log('wagmi keys:', summary.wagmiKeys)
  console.groupEnd()
}


/**
 * @fileoverview Unified wallet hook.
 * Combines CDP and external wallet adapters into single interface.
 *
 * ARCHITECTURE:
 * - useCdpWallet: CDP embedded wallet (multichain native)
 * - useExternalWallet: Browser wallets via wagmi (single chain)
 * - useCdpAuthMarkerSync: Syncs CDP state to localStorage marker
 * - useWalletMutualExclusion: Ensures only one wallet active
 * - useCdpNetwork: CDP network selection (global state)
 *
 * CRITICAL PATTERNS:
 * 1. Dependency arrays use PRIMITIVE VALUES only (not objects)
 * 2. Stable function references via useCallback
 * 3. Extracted hooks for separation of concerns
 */

import { useCallback, useMemo } from 'react'
import { useCdpWallet } from '../adapters/cdp'
import { useExternalWallet } from '../adapters/external'
import { useCdpAuthMarkerSync } from './useCdpAuthMarkerSync'
import { useWalletMutualExclusion } from './useWalletMutualExclusion'
import { useCdpNetwork } from '../context/CdpNetworkContext'
import type {
  UnifiedWallet,
  TransactionRequest,
  TransactionResult,
  WalletAdapter,
} from '../types'
import { normalizeError } from '../utils/errorUtils'

/**
 * Main unified wallet hook.
 * Use this in components instead of provider-specific hooks.
 *
 * Priority: CDP > External (if both connected, external will be disconnected)
 * 
 * @returns UnifiedWallet interface with address, connection state, and actions
 */
export function useUnifiedWallet(): UnifiedWallet {
  const cdp = useCdpWallet()
  const external = useExternalWallet()
  
  // CDP network selection from global context
  // This is the user-selected network for CDP multichain wallets
  const { selectedChainId: cdpSelectedChainId } = useCdpNetwork()

  // Extract primitive values for stable dependencies
  const cdpConnected = cdp.state.isConnected
  const externalConnected = external.state.isConnected
  const cdpAddress = cdp.state.address
  const externalAddress = external.state.address
  // Note: cdp.state.chainId is static (ACTIVE_NETWORK), we use cdpSelectedChainId instead
  const externalChainId = external.state.chainId

  // Stable function references
  const externalDisconnect = external.disconnect

  // ============================================
  // Extracted Hooks (Separation of Concerns)
  // ============================================

  // Sync CDP auth marker to localStorage for reconnect logic
  useCdpAuthMarkerSync(cdpConnected)

  // Enforce mutual exclusion: CDP > External priority
  useWalletMutualExclusion({
    cdpConnected,
    externalConnected,
    externalDisconnect,
  })

  // ============================================
  // Active Adapter Selection
  // ============================================

  // CRITICAL: Determine active wallet using PRIMITIVE dependencies only
  // Using [cdp, external] would cause infinite re-renders!
  const activeAdapter: WalletAdapter | null = useMemo(() => {
    if (cdpConnected) return cdp
    if (externalConnected) return external
    return null
  }, [cdpConnected, externalConnected, cdp, external])

  // ============================================
  // Unified Actions
  // ============================================

  // Stable sendTransaction reference
  const activeAdapterSendTransaction = activeAdapter?.sendTransaction

  /**
   * Send a transaction using the active wallet.
   * @throws WalletError if no wallet connected or transaction fails
   */
  const sendTransaction = useCallback(
    async (tx: TransactionRequest): Promise<TransactionResult> => {
      if (!activeAdapterSendTransaction) {
        throw normalizeError(new Error('No wallet connected'))
      }
      return activeAdapterSendTransaction(tx)
    },
    [activeAdapterSendTransaction]
  )

  // Stable disconnect references
  const cdpDisconnect = cdp.disconnect

  /**
   * Disconnect all connected wallets.
   * Uses Promise.allSettled to ensure one failure doesn't block others.
   */
  const disconnect = useCallback(async () => {
    const disconnectPromises: Promise<void>[] = []

    if (cdpConnected) {
      disconnectPromises.push(cdpDisconnect())
    }
    if (externalConnected) {
      disconnectPromises.push(externalDisconnect())
    }

    if (disconnectPromises.length > 0) {
      const results = await Promise.allSettled(disconnectPromises)
      // Log any failures for debugging
      results.forEach((result) => {
        if (result.status === 'rejected' && import.meta.env.DEV) {
          console.error('[useUnifiedWallet] Disconnect failed:', result.reason)
        }
      })
    }
  }, [cdpConnected, externalConnected, cdpDisconnect, externalDisconnect])

  // ============================================
  // Derived State
  // ============================================

  // Combined loading state
  const isLoading = cdp.state.isLoading || external.state.isLoading

  // Combined error (prefer active adapter's error)
  const error =
    activeAdapter?.state.error ??
    cdp.state.error ??
    external.state.error ??
    null

  // Stable switchChain reference from external wallet
  const externalSwitchChain = external.switchChain

  /**
   * Switch to a different chain (external wallets only).
   * CDP wallets are multichain native - no switch needed.
   * @throws WalletError if chain switching not supported
   */
  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      if (!externalSwitchChain) {
        throw normalizeError(new Error('Chain switching not supported for this wallet'))
      }
      return externalSwitchChain(chainId)
    },
    [externalSwitchChain]
  )

  // Can switch chain? Only if external wallet is connected
  const canSwitchChain = externalConnected && !!externalSwitchChain

  // Is multichain? CDP wallets are multichain native (same address on all EVM chains)
  const isMultichain = cdpConnected

  // Active chainId:
  // - CDP wallets: Use user-selected network from CdpNetworkContext (dynamic)
  // - External wallets: Use actual connected chain from wagmi (dynamic)
  const activeChainId = cdpConnected 
    ? cdpSelectedChainId  // User's selected network for CDP
    : externalConnected 
      ? externalChainId   // Actual connected chain for external
      : null

  // ============================================
  // Return Value
  // ============================================

  // CRITICAL: Final memo with PRIMITIVE dependencies only
  return useMemo(
    () => ({
      // State
      address: cdpConnected
        ? cdpAddress
        : externalConnected
          ? externalAddress
          : null,
      isConnected: cdpConnected || externalConnected,
      source: cdpConnected ? 'cdp' : externalConnected ? 'external' : null,
      chainId: activeChainId,
      isLoading,
      error,
      isMultichain,
      // Actions
      sendTransaction,
      disconnect,
      switchChain: canSwitchChain ? switchChain : undefined,
      canSwitchChain,
    }),
    [
      cdpConnected,
      externalConnected,
      cdpAddress,
      externalAddress,
      activeChainId,
      cdpSelectedChainId, // Include in deps for CDP network changes
      isLoading,
      error,
      isMultichain,
      sendTransaction,
      disconnect,
      switchChain,
      canSwitchChain,
    ]
  )
}

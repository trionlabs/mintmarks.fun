/**
 * @fileoverview Unified wallet hook.
 * Combines CDP and external wallet adapters into single interface.
 *
 * CRITICAL PATTERNS:
 * 1. useRef prevents infinite loops in mutual exclusion
 * 2. Dependency arrays use PRIMITIVE VALUES only (not objects)
 * 3. Stable function references via useCallback
 */

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useCdpWallet } from '../adapters/cdp'
import { useExternalWallet } from '../adapters/external'
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
 */
export function useUnifiedWallet(): UnifiedWallet {
  const cdp = useCdpWallet()
  const external = useExternalWallet()

  // Ref to prevent infinite loops in mutual exclusion
  const hasDisconnectedExternalRef = useRef(false)

  // Extract primitive values for stable dependencies
  const cdpConnected = cdp.state.isConnected
  const externalConnected = external.state.isConnected
  const cdpAddress = cdp.state.address
  const externalAddress = external.state.address

  // CRITICAL: Determine active wallet using PRIMITIVE dependencies only
  // Using [cdp, external] would cause infinite re-renders!
  const activeAdapter: WalletAdapter | null = useMemo(() => {
    if (cdpConnected) return cdp
    if (externalConnected) return external
    return null
  }, [cdpConnected, externalConnected, cdp, external])

  // Stable disconnect reference for effect
  const externalDisconnect = external.disconnect

  // CRITICAL: Mutual exclusion with PRIMITIVE dependencies
  // DO NOT use [external] - it's a new object every render!
  useEffect(() => {
    if (
      cdpConnected &&
      externalConnected &&
      !hasDisconnectedExternalRef.current
    ) {
      hasDisconnectedExternalRef.current = true
      externalDisconnect()
    }

    // Reset flag when CDP disconnects (allow external to connect again)
    if (!cdpConnected) {
      hasDisconnectedExternalRef.current = false
    }
  }, [cdpConnected, externalConnected, externalDisconnect])

  // Stable sendTransaction reference
  const activeAdapterSendTransaction = activeAdapter?.sendTransaction

  // Unified send transaction
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

  // Unified disconnect (disconnects all connected wallets)
  // Uses Promise.allSettled to ensure one failure doesn't block others
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
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[useUnifiedWallet] Disconnect ${index} failed:`, result.reason)
        }
      })
    }
  }, [cdpConnected, externalConnected, cdpDisconnect, externalDisconnect])

  // Combined loading state
  const isLoading = cdp.state.isLoading || external.state.isLoading

  // Combined error (prefer active adapter's error, includes WRONG_NETWORK)
  const error =
    activeAdapter?.state.error ??
    cdp.state.error ??
    external.state.error ??
    null

  // CRITICAL: Final memo with PRIMITIVE dependencies
  return useMemo(
    () => ({
      address: cdpConnected
        ? cdpAddress
        : externalConnected
          ? externalAddress
          : null,
      isConnected: cdpConnected || externalConnected,
      source: cdpConnected ? 'cdp' : externalConnected ? 'external' : null,
      chainId: activeAdapter?.state.chainId ?? null,
      isLoading,
      error,
      sendTransaction,
      disconnect,
    }),
    [
      cdpConnected,
      externalConnected,
      cdpAddress,
      externalAddress,
      activeAdapter?.state.chainId,
      isLoading,
      error,
      sendTransaction,
      disconnect,
    ]
  )
}

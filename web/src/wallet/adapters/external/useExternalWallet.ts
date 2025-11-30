/**
 * @fileoverview External wallet adapter using wagmi.
 * Supports MetaMask, Rabby, Coinbase Extension.
 *
 * Supports multichain transactions - will switch chain if needed.
 */

import { useCallback, useMemo } from 'react'
import { useAccount, useDisconnect, useSendTransaction, useSwitchChain } from 'wagmi'
import { isAddress } from 'viem'
import type {
  WalletAdapter,
  TransactionRequest,
  TransactionResult,
  WalletError,
} from '../../types'
import { normalizeError } from '../../utils/errorUtils'
import { ACTIVE_NETWORK, NETWORKS } from '@/config/contracts'

/**
 * Get network config by chainId
 */
function getNetworkByChainId(chainId: number) {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId)
}

/**
 * External wallet adapter hook.
 * Wraps wagmi hooks for browser extension wallets.
 */
export function useExternalWallet(): WalletAdapter {
  const { address, isConnected, chain } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { sendTransactionAsync, isPending } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()

  // Get connected chain ID
  const connectedChainId = chain?.id

  // For backwards compatibility, still report wrong network if not on ACTIVE_NETWORK
  const isWrongNetwork =
    isConnected &&
    typeof connectedChainId === 'number' &&
    connectedChainId !== ACTIVE_NETWORK.chainId

  // Create wrong network error if applicable
  const wrongNetworkError: WalletError | null = isWrongNetwork
    ? {
        type: 'WRONG_NETWORK',
        message: `Please switch to ${ACTIVE_NETWORK.name}`,
      }
    : null

  const sendTransaction = useCallback(
    async (tx: TransactionRequest): Promise<TransactionResult> => {
      if (!address) {
        throw normalizeError(new Error('External wallet not connected'))
      }

      // CRITICAL: Validate recipient address before sending
      if (!isAddress(tx.to)) {
        throw normalizeError(new Error('Invalid recipient address'))
      }

      // If chainId specified, check if we need to switch
      const targetChainId = tx.chainId ?? ACTIVE_NETWORK.chainId
      const targetNetwork = getNetworkByChainId(targetChainId)

      if (!targetNetwork) {
        throw normalizeError(new Error(`Unsupported chain ID: ${targetChainId}`))
      }

      // Switch chain if needed
      if (connectedChainId !== targetChainId) {
        try {
          await switchChainAsync({ chainId: targetChainId })
        } catch (error) {
          throw normalizeError(
            new Error(`Failed to switch to ${targetNetwork.name}. Please switch manually.`)
          )
        }
      }

      try {
        const hash = await sendTransactionAsync({
          to: tx.to,
          value: tx.value,
          data: tx.data,
          chainId: targetChainId,
        })
        return { hash }
      } catch (error) {
        throw normalizeError(error)
      }
    },
    [address, sendTransactionAsync, connectedChainId, switchChainAsync]
  )

  const disconnect = useCallback(async () => {
    wagmiDisconnect()
  }, [wagmiDisconnect])

  /**
   * Switch to a different chain.
   * External wallets support chain switching via wagmi.
   */
  const switchChain = useCallback(async (chainId: number) => {
    const targetNetwork = getNetworkByChainId(chainId)
    if (!targetNetwork) {
      throw normalizeError(new Error(`Unsupported chain ID: ${chainId}`))
    }
    
    try {
      await switchChainAsync({ chainId })
    } catch (error) {
      throw normalizeError(
        new Error(`Failed to switch to ${targetNetwork.name}. Please try again.`)
      )
    }
  }, [switchChainAsync])

  const state = useMemo(
    () => ({
      address: address ?? null,
      // Connected if wallet is connected (we can switch chains as needed)
      isConnected: isConnected,
      source: isConnected ? ('external' as const) : null,
      chainId: isConnected && typeof connectedChainId === 'number' ? connectedChainId : null,
      isLoading: isPending,
      // Surface wrong network error for UI display (informational)
      error: wrongNetworkError,
      // External wallets are NOT multichain - they have a "connected chain"
      isMultichain: false,
    }),
    [
      address,
      isConnected,
      connectedChainId,
      isPending,
      wrongNetworkError,
    ]
  )

  return {
    state,
    // Always provide sendTransaction if connected (we can switch chains)
    sendTransaction: isConnected ? sendTransaction : undefined,
    disconnect,
    // Provide switchChain for external wallets
    switchChain: isConnected ? switchChain : undefined,
  }
}



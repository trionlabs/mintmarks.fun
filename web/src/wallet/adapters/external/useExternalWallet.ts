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

  // Check if connected chain is a supported network
  const isSupportedNetwork =
    isConnected &&
    typeof connectedChainId === 'number' &&
    Object.values(NETWORKS).some((n) => n.chainId === connectedChainId)

  // Only show error if on an unsupported network (not just different from ACTIVE_NETWORK)
  // External wallets can switch chains, so being on a different supported network is OK
  const unsupportedNetworkError: WalletError | null = 
    isConnected && !isSupportedNetwork
      ? {
          type: 'WRONG_NETWORK',
          message: `Unsupported network. Please switch to a supported network.`,
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
      // Only surface error if on an unsupported network
      error: unsupportedNetworkError,
      // External wallets are NOT multichain - they have a "connected chain"
      isMultichain: false,
    }),
    [
      address,
      isConnected,
      connectedChainId,
      isPending,
      unsupportedNetworkError,
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



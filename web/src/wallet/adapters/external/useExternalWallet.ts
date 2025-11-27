/**
 * @fileoverview External wallet adapter using wagmi.
 * Supports MetaMask, Rabby, Coinbase Extension.
 *
 * CRITICAL: Includes wrong network detection at the adapter level.
 * This ensures useWallet() consumers can block actions on wrong chains.
 */

import { useCallback, useMemo } from 'react'
import { useAccount, useDisconnect, useSendTransaction } from 'wagmi'
import type {
  WalletAdapter,
  TransactionRequest,
  TransactionResult,
  WalletError,
} from '../../types'
import { normalizeError } from '../../utils/errorUtils'
import { ACTIVE_NETWORK } from '@/config/contracts'

/**
 * External wallet adapter hook.
 * Wraps wagmi hooks for browser extension wallets.
 */
export function useExternalWallet(): WalletAdapter {
  const { address, isConnected, chain } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { sendTransactionAsync, isPending } = useSendTransaction()

  // CRITICAL: Detect wrong network at adapter level
  const connectedChainId = chain?.id
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

      // CRITICAL: Block transactions on wrong network
      if (isWrongNetwork) {
        throw normalizeError(
          new Error(`Wrong network. Please switch to ${ACTIVE_NETWORK.name}`)
        )
      }

      try {
        const hash = await sendTransactionAsync({
          to: tx.to,
          value: tx.value,
          data: tx.data,
        })
        return { hash }
      } catch (error) {
        throw normalizeError(error)
      }
    },
    [address, sendTransactionAsync, isWrongNetwork]
  )

  const disconnect = useCallback(async () => {
    wagmiDisconnect()
  }, [wagmiDisconnect])

  const state = useMemo(
    () => ({
      address: address ?? null,
      // CRITICAL: Report as "not properly connected" if wrong network
      // This allows UI to show connect button or wrong network warning
      isConnected: isConnected && !isWrongNetwork,
      source: isConnected ? ('external' as const) : null,
      chainId: isConnected && typeof connectedChainId === 'number' ? connectedChainId : null,
      isLoading: isPending,
      // CRITICAL: Surface wrong network error to useWallet() consumers
      error: wrongNetworkError,
    }),
    [
      address,
      isConnected,
      isWrongNetwork,
      connectedChainId,
      isPending,
      wrongNetworkError,
    ]
  )

  return {
    state,
    // Only provide sendTransaction if properly connected (correct network)
    sendTransaction: isConnected && !isWrongNetwork ? sendTransaction : undefined,
    disconnect,
  }
}



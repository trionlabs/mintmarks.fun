/**
 * @fileoverview CDP wallet adapter.
 * Wraps CDP SDK hooks to provide consistent WalletAdapter interface.
 */

import { useCallback, useMemo } from 'react'
import {
  useIsSignedIn,
  useEvmAddress,
  useSendEvmTransaction,
  useSignOut,
} from '@coinbase/cdp-hooks'
import { isAddress } from 'viem'
import type { WalletAdapter, TransactionRequest, TransactionResult } from '../../types'
import { ACTIVE_NETWORK } from '@/config/contracts'
import { normalizeError } from '../../utils/errorUtils'

/**
 * CDP wallet adapter hook.
 * Provides EOA wallet functionality via CDP embedded wallet.
 */
export function useCdpWallet(): WalletAdapter {
  // CDP hooks return objects, not primitive values
  const { isSignedIn } = useIsSignedIn()
  const { evmAddress } = useEvmAddress()
  const { sendEvmTransaction, data: txData } = useSendEvmTransaction()
  const { signOut } = useSignOut()

  // Determine loading state from transaction data
  const isLoading = txData?.status === 'pending'

  const sendTransaction = useCallback(
    async (tx: TransactionRequest): Promise<TransactionResult> => {
      if (!evmAddress) {
        throw normalizeError(new Error('CDP wallet not connected'))
      }

      // CRITICAL: Validate recipient address before sending
      if (!isAddress(tx.to)) {
        throw normalizeError(new Error('Invalid recipient address'))
      }

      try {
        const result = await sendEvmTransaction({
          evmAccount: evmAddress,
          network: ACTIVE_NETWORK.network,
          transaction: {
            to: tx.to,
            value: tx.value ?? 0n,
            data: tx.data ?? '0x',
            chainId: ACTIVE_NETWORK.chainId,
            type: 'eip1559',
          },
        })
        return { hash: result.transactionHash as `0x${string}` }
      } catch (error) {
        throw normalizeError(error)
      }
    },
    [evmAddress, sendEvmTransaction]
  )

  const disconnect = useCallback(async () => {
    await signOut()
  }, [signOut])

  const state = useMemo(
    () => ({
      address: (evmAddress as `0x${string}`) ?? null,
      isConnected: isSignedIn,
      source: isSignedIn ? ('cdp' as const) : null,
      chainId: isSignedIn ? ACTIVE_NETWORK.chainId : null,
      isLoading,
      error: null,
    }),
    [evmAddress, isSignedIn, isLoading]
  )

  return {
    state,
    sendTransaction: isSignedIn ? sendTransaction : undefined,
    disconnect,
  }
}

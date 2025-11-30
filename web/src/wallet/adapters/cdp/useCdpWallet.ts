/**
 * @fileoverview CDP wallet adapter.
 * Wraps CDP SDK hooks to provide consistent WalletAdapter interface.
 * 
 * IMPORTANT: CDP embedded wallets are MULTICHAIN NATIVE.
 * - Same EOA address works on all EVM chains
 * - No "chain switching" needed - specify network per transaction
 * - isMultichain: true indicates this behavior
 */

import { useCallback, useMemo } from 'react'
import {
  useIsSignedIn,
  useEvmAddress,
  useSendEvmTransaction,
  useSignOut,
} from '@coinbase/cdp-hooks'
import { isAddress, createPublicClient, http } from 'viem'
import type { WalletAdapter, TransactionRequest, TransactionResult } from '../../types'
import { ACTIVE_NETWORK, NETWORKS } from '@/config/contracts'
import { getViemChain } from '@/config/chains'
import { normalizeError } from '../../utils/errorUtils'

/**
 * Get network config by chainId
 */
function getNetworkByChainId(chainId: number) {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId)
}

// Note: getViemChain imported from @/config/chains

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

      // Use provided chainId or fall back to ACTIVE_NETWORK
      const targetNetwork = tx.chainId
        ? getNetworkByChainId(tx.chainId)
        : ACTIVE_NETWORK

      if (!targetNetwork) {
        throw normalizeError(new Error(`Unsupported chain ID: ${tx.chainId}`))
      }

      try {
        // Create public client for gas estimation
        const viemChain = getViemChain(targetNetwork.chainId)
        const publicClient = createPublicClient({
          chain: viemChain,
          transport: http(targetNetwork.rpcUrl),
        })

        if (import.meta.env.DEV) {
          console.log('[CDP] Estimating gas for transaction on', targetNetwork.name)
        }

        // Get nonce
        const nonce = await publicClient.getTransactionCount({
          address: evmAddress as `0x${string}`,
        })

        // Estimate gas
        const gasEstimate = await publicClient.estimateGas({
          account: evmAddress as `0x${string}`,
          to: tx.to,
          value: tx.value ?? 0n,
          data: tx.data ?? '0x',
        })

        // Get current gas prices
        const feeData = await publicClient.estimateFeesPerGas()

        // Add 20% buffer to gas estimate for complex transactions
        const GAS_BUFFER_PERCENT = 120n
        const gasWithBuffer = (gasEstimate * GAS_BUFFER_PERCENT) / 100n

        if (import.meta.env.DEV) {
          console.log('[CDP] Gas estimate:', gasEstimate.toString())
          console.log('[CDP] Gas with buffer:', gasWithBuffer.toString())
          console.log('[CDP] Max fee per gas:', feeData.maxFeePerGas?.toString())
          console.log('[CDP] Nonce:', nonce)
        }

        const result = await sendEvmTransaction({
          evmAccount: evmAddress,
          network: targetNetwork.network,
          transaction: {
            to: tx.to,
            value: tx.value ?? 0n,
            data: tx.data ?? '0x',
            nonce,
            gas: gasWithBuffer,
            maxFeePerGas: feeData.maxFeePerGas ?? 30000000000n,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 1000000000n,
            chainId: targetNetwork.chainId,
            type: 'eip1559',
          },
        })

        if (import.meta.env.DEV) {
          console.log('[CDP] Transaction sent:', result.transactionHash)
        }
        return { hash: result.transactionHash as `0x${string}` }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[CDP] Transaction failed:', error)
        }
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
      // CDP wallets are multichain - this is the "default" network for display purposes
      // Actual transactions can target any supported chain via the network param
      chainId: isSignedIn ? ACTIVE_NETWORK.chainId : null,
      isLoading,
      error: null,
      // CDP embedded wallets are multichain native - same address on all EVM chains
      // No chain switching needed - specify network per transaction
      isMultichain: true,
    }),
    [evmAddress, isSignedIn, isLoading]
  )

  return {
    state,
    sendTransaction: isSignedIn ? sendTransaction : undefined,
    disconnect,
    // CDP wallets don't need switchChain - they're multichain native
    // Transactions specify the target network directly
    switchChain: undefined,
  }
}

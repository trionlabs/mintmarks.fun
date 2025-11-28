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
import { isAddress, createPublicClient, http } from 'viem'
import {
  baseSepolia,
  base,
  sepolia,
  mainnet,
  arbitrum,
  optimism,
  polygon,
} from 'viem/chains'
import type { WalletAdapter, TransactionRequest, TransactionResult } from '../../types'
import { ACTIVE_NETWORK, NETWORKS } from '@/config/contracts'
import { normalizeError } from '../../utils/errorUtils'

/**
 * Get network config by chainId
 */
function getNetworkByChainId(chainId: number) {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId)
}

/**
 * Get viem chain by chainId
 * Supports all CDP-compatible EVM chains
 * @throws Error if chainId is not supported
 */
function getViemChain(chainId: number) {
  switch (chainId) {
    // Testnets
    case 84532:
      return baseSepolia
    case 11155111:
      return sepolia
    // Mainnets
    case 8453:
      return base
    case 1:
      return mainnet
    case 42161:
      return arbitrum
    case 10:
      return optimism
    case 137:
      return polygon
    default:
      throw new Error(
        `Unsupported chain ID: ${chainId}. Supported: Base (84532, 8453), Ethereum (11155111, 1), Arbitrum (42161), Optimism (10), Polygon (137)`
      )
  }
}

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

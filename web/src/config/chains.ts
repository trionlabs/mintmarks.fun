/**
 * Viem Chain Configuration
 * 
 * Centralized chain utilities for viem integration.
 * Used by wallet adapters and balance fetching.
 */

import {
  baseSepolia,
  base,
  sepolia,
  mainnet,
  arbitrum,
  optimism,
  polygon,
} from 'viem/chains'
import type { Chain } from 'viem'
import { NETWORKS } from './contracts'

// ============================================
// Active Networks (currently enabled in UI)
// ============================================

/**
 * Network chain IDs that are currently active/enabled in the app.
 * Used for network selector UI and validation.
 * 
 * To add a new network:
 * 1. Add to NETWORKS in contracts.ts
 * 2. Add chainId here
 * 3. Add case in getViemChain below
 */
export const ACTIVE_NETWORK_IDS = [
  NETWORKS.ethereumSepolia.chainId,  // 11155111 - Ethereum Sepolia (testnet) - DEFAULT
  // NETWORKS.baseSepolia.chainId,   // 84532 - Base Sepolia (coming soon)
] as const

export type ActiveNetworkId = typeof ACTIVE_NETWORK_IDS[number]

// ============================================
// Viem Chain Mapping
// ============================================

/**
 * Get viem chain config by chainId.
 * Supports all CDP-compatible EVM chains.
 * 
 * @throws Error if chainId is not supported
 */
export function getViemChain(chainId: number): Chain {
  switch (chainId) {
    // Testnets
    case NETWORKS.baseSepolia.chainId:
      return baseSepolia
    case NETWORKS.ethereumSepolia.chainId:
      return sepolia
    // Mainnets
    case NETWORKS.base.chainId:
      return base
    case NETWORKS.ethereum.chainId:
      return mainnet
    case NETWORKS.arbitrum.chainId:
      return arbitrum
    case NETWORKS.optimism.chainId:
      return optimism
    case NETWORKS.polygon.chainId:
      return polygon
    default:
      throw new Error(
        `Unsupported chain ID: ${chainId}. Supported: Base (${NETWORKS.baseSepolia.chainId}, ${NETWORKS.base.chainId}), Ethereum (${NETWORKS.ethereumSepolia.chainId}, ${NETWORKS.ethereum.chainId}), Arbitrum (${NETWORKS.arbitrum.chainId}), Optimism (${NETWORKS.optimism.chainId}), Polygon (${NETWORKS.polygon.chainId})`
      )
  }
}

/**
 * Get native currency symbol for a chain
 */
export function getNativeSymbol(chainId: number): string {
  switch (chainId) {
    case NETWORKS.polygon.chainId:
      return 'MATIC'
    default:
      return 'ETH'
  }
}

/**
 * Check if a chainId is a testnet
 */
export function isTestnet(chainId: number): boolean {
  return chainId === NETWORKS.baseSepolia.chainId || 
         chainId === NETWORKS.ethereumSepolia.chainId
}

/**
 * Check if a chainId is currently active/enabled.
 * Type-safe helper to avoid TypeScript literal type issues with .includes()
 */
export function isActiveNetwork(chainId: number): chainId is ActiveNetworkId {
  return (ACTIVE_NETWORK_IDS as readonly number[]).includes(chainId)
}

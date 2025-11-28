/**
 * Network Configuration for My Marks Page
 * 
 * Supports: Ethereum, Ethereum Sepolia, Base, Base Sepolia
 * Type-safe configuration using viem chains.
 */

import { createPublicClient, http, type Chain } from 'viem'
import { mainnet, sepolia, base, baseSepolia } from 'viem/chains'
import type { NetworkId, NetworkFilter, ChainId, CHAIN_IDS } from '@/types/nft'

// ============================================
// Network Filters for UI
// ============================================

/**
 * Network filter options for UI display
 */
export const NETWORK_FILTERS: readonly NetworkFilter[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    chainId: 1,
    isTestnet: false,
    enabled: false, // Enable when mainnet contract deployed
  },
  {
    id: 'ethereumSepolia',
    name: 'Ethereum Sepolia',
    shortName: 'ETH Sepolia',
    chainId: 11155111,
    isTestnet: true,
    enabled: true,
  },
  {
    id: 'base',
    name: 'Base',
    shortName: 'Base',
    chainId: 8453,
    isTestnet: false,
    enabled: false, // Enable when mainnet contract deployed
  },
  {
    id: 'baseSepolia',
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    chainId: 84532,
    isTestnet: true,
    enabled: true,
  },
] as const

/**
 * Get enabled networks only
 */
export function getEnabledNetworks(): readonly NetworkFilter[] {
  return NETWORK_FILTERS.filter(n => n.enabled)
}

// ============================================
// Network Configuration
// ============================================

/**
 * Chain mapping for viem
 */
const CHAINS: Record<NetworkId, Chain> = {
  ethereum: mainnet,
  ethereumSepolia: sepolia,
  base: base,
  baseSepolia: baseSepolia,
} as const

/**
 * Network-specific configuration
 */
interface NetworkConfig {
  readonly chain: Chain
  readonly rpcUrl: string
  readonly blockExplorer: string
  readonly mintmarksAddress: `0x${string}` | null
}

export const NETWORK_CONFIG: Record<NetworkId, NetworkConfig> = {
  ethereum: {
    chain: CHAINS.ethereum,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    mintmarksAddress: null,
  },
  ethereumSepolia: {
    chain: CHAINS.ethereumSepolia,
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    mintmarksAddress: (import.meta.env.VITE_MINTMARKS_ADDRESS as `0x${string}` | undefined) ?? null,
  },
  base: {
    chain: CHAINS.base,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    mintmarksAddress: null,
  },
  baseSepolia: {
    chain: CHAINS.baseSepolia,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    mintmarksAddress: (import.meta.env.VITE_TEST_MINTMARKS_ADDRESS as `0x${string}` | undefined) ?? null,
  },
} as const

// ============================================
// Client & Helper Functions
// ============================================

/**
 * Create a public client for a specific network
 */
export function createNetworkClient(networkId: NetworkId) {
  const config = NETWORK_CONFIG[networkId]
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  })
}

/**
 * Get block explorer URL for a transaction
 */
export function getTransactionUrl(networkId: NetworkId, txHash: string): string {
  return `${NETWORK_CONFIG[networkId].blockExplorer}/tx/${txHash}`
}

/**
 * Get block explorer URL for an NFT
 */
export function getNftUrl(networkId: NetworkId, contractAddress: string, tokenId: string): string {
  return `${NETWORK_CONFIG[networkId].blockExplorer}/token/${contractAddress}?a=${tokenId}`
}

/**
 * Get chain ID from network ID
 */
export function getChainId(networkId: NetworkId): ChainId {
  return NETWORK_CONFIG[networkId].chain.id as ChainId
}

/**
 * Get network ID from chain ID
 */
export function getNetworkIdFromChainId(chainId: number): NetworkId | null {
  const entry = Object.entries(NETWORK_CONFIG).find(
    ([, config]) => config.chain.id === chainId
  )
  return entry ? (entry[0] as NetworkId) : null
}

/**
 * Check if a network has a configured contract
 */
export function hasContract(networkId: NetworkId): boolean {
  return NETWORK_CONFIG[networkId].mintmarksAddress !== null
}

/**
 * Get contract address for a network (throws if not configured)
 */
export function getContractAddress(networkId: NetworkId): `0x${string}` {
  const address = NETWORK_CONFIG[networkId].mintmarksAddress
  if (!address) {
    throw new Error(`Contract not configured for network: ${networkId}`)
  }
  return address
}

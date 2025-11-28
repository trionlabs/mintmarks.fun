/**
 * NFT Types for My Marks Page
 * 
 * Type-safe definitions for NFT gallery functionality.
 */

import type { Address, Hash } from 'viem'

// ============================================
// Network Types
// ============================================

/**
 * Supported network identifiers
 */
export type NetworkId = 'ethereum' | 'ethereumSepolia' | 'base' | 'baseSepolia'

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  ethereum: 1,
  ethereumSepolia: 11155111,
  base: 8453,
  baseSepolia: 84532,
} as const satisfies Record<NetworkId, number>

export type ChainId = typeof CHAIN_IDS[NetworkId]

/**
 * Network filter option for UI
 */
export interface NetworkFilter {
  readonly id: NetworkId
  readonly name: string
  readonly shortName: string
  readonly chainId: ChainId
  readonly isTestnet: boolean
  readonly enabled: boolean
}

// ============================================
// NFT Types
// ============================================

/**
 * Mintmark NFT data structure
 */
export interface MintmarkNFT {
  /** Unique identifier: `${chainId}-${tokenId}-${owner}` */
  readonly id: string
  /** Token ID from contract */
  readonly tokenId: string
  /** Event name from the minted email */
  readonly eventName: string
  /** NFT owner address */
  readonly owner: Address
  /** Network the NFT was minted on */
  readonly network: NetworkId
  /** Chain ID */
  readonly chainId: ChainId
  /** Image URI (data:image/svg+xml or IPFS URL) */
  readonly imageUri: string | null
  /** Transaction hash of the mint */
  readonly txHash: Hash
  /** Block number when minted */
  readonly blockNumber: bigint | null
  /** Mint timestamp (if available) */
  readonly timestamp: Date | null
}

/**
 * Gallery statistics
 */
export interface GalleryStats {
  /** Total number of NFTs across selected networks */
  readonly totalMinted: number
  /** Number of unique events */
  readonly uniqueEvents: number
  /** Number of unique holders */
  readonly uniqueHolders: number
  /** Number of NFTs owned by current user */
  readonly userNfts: number
}

/**
 * View filter type
 */
export type ViewFilter = 'all' | 'mine'

// ============================================
// Contract Event Types
// ============================================

/**
 * Minted event args from Mintmarks contract
 */
export interface MintedEventArgs {
  readonly to: Address
  readonly tokenId: bigint
  readonly eventName: string
  readonly emailNullifier: Hash
  readonly passportId: Hash
}

/**
 * Parsed NFT metadata from on-chain data URI
 */
export interface NFTMetadata {
  readonly name: string
  readonly description: string
  readonly image: string
  readonly attributes?: ReadonlyArray<{
    readonly trait_type: string
    readonly value: string
  }>
}

// ============================================
// Hook Types
// ============================================

/**
 * Options for useMyMarks hook
 */
export interface UseMyMarksOptions {
  /** User's wallet address for "mine" filter */
  readonly userAddress: Address | undefined
  /** Networks to fetch from */
  readonly selectedNetworks: readonly NetworkId[]
  /** View filter */
  readonly viewFilter: ViewFilter
}

/**
 * Return type for useMyMarks hook
 */
export interface UseMyMarksResult {
  /** All fetched NFTs (filtered by view) */
  readonly nfts: readonly MintmarkNFT[]
  /** Gallery statistics */
  readonly stats: GalleryStats
  /** Loading state */
  readonly loading: boolean
  /** Error message */
  readonly error: string | null
  /** Refresh function */
  readonly refresh: () => void
}

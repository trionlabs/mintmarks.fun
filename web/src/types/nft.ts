/**
 * NFT Types for MyMarks Gallery
 */

/**
 * Network identifiers for all supported chains
 * Used for both minting and displaying NFTs
 */
export type NetworkId = 
  | 'ethereum-sepolia' 
  | 'base-sepolia' 
  | 'ethereum' 
  | 'base'

/** @deprecated Use NetworkId instead - kept for backwards compatibility */
export type LegacyNetworkId = 'base-sepolia' | 'base-mainnet'

export type ViewFilter = 'all' | 'mine'

export interface MintmarkNFT {
  id: string
  tokenId: string
  txHash: string
  eventName: string
  eventDate: string
  source: 'luma' | 'eventbrite' | 'substack' | 'other'
  imageUri?: string
  owner: string
  network: NetworkId
  mintedAt: string
}

export interface MyMarksStats {
  totalMinted: number
  uniqueHolders: number
  userNfts: number
  thisMonth: number
  mostActiveMonth: { month: string; count: number } | null
}



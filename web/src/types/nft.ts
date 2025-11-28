/**
 * NFT Types for MyMarks Gallery
 */

export type NetworkId = 'base-sepolia' | 'base-mainnet'

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
}


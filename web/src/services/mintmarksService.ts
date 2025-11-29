/**
 * Mintmarks Blockchain Service
 * 
 * Fetches NFT data from Mintmarks contracts across supported networks.
 * Uses Viem to query Minted events and token metadata.
 */

import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia, baseSepolia, mainnet, base } from 'viem/chains'
import { MINTMARKS_ABI } from '@/config/sepolia'
import { MINT_NETWORKS, type MintNetworkId } from '@/config/mintNetworks'
import type { MintmarkNFT, NetworkId } from '@/types/nft'

// ============================================
// Types
// ============================================

interface MintedEventLog {
  to: `0x${string}`
  tokenId: bigint
  eventName: string
  emailNullifier: `0x${string}`
  passportId: `0x${string}`
  transactionHash: `0x${string}`
  blockNumber: bigint
}

interface FetchNFTsResult {
  nfts: MintmarkNFT[]
  error: string | null
}

// ============================================
// Chain Mapping
// ============================================

const CHAIN_MAP = {
  'ethereum-sepolia': sepolia,
  'base-sepolia': baseSepolia,
  'ethereum': mainnet,
  'base': base,
} as const

// ============================================
// Public RPC URLs (for getLogs - avoid rate-limited APIs)
// ============================================

const PUBLIC_RPC_URLS: Record<MintNetworkId, string> = {
  'ethereum-sepolia': 'https://ethereum-sepolia-rpc.publicnode.com',
  'base-sepolia': 'https://sepolia.base.org',
  'ethereum': 'https://eth.llamarpc.com',
  'base': 'https://mainnet.base.org',
}

// ============================================
// Public Client Factory
// ============================================

function getPublicClient(networkId: MintNetworkId) {
  const chain = CHAIN_MAP[networkId]
  // Use public RPC for getLogs to avoid rate limits
  const rpcUrl = PUBLIC_RPC_URLS[networkId]
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  })
}

// ============================================
// Event Parsing
// ============================================

const MINTED_EVENT = parseAbiItem(
  'event Minted(address indexed to, uint256 indexed tokenId, string eventName, bytes32 emailNullifier, bytes32 passportId)'
)

// ============================================
// Constants
// ============================================

/** Blocks to fetch on testnets (~2 weeks on Sepolia at 12s/block) */
const TESTNET_BLOCKS_TO_FETCH = 100000n

/** Blocks to fetch on mainnet (~1 week at 12s/block) */
const MAINNET_BLOCKS_TO_FETCH = 50000n

/** Max blocks per getLogs RPC request (avoids rate limits) */
const RPC_CHUNK_SIZE = 10000n

// ============================================
// Main Service Functions
// ============================================

/**
 * Fetch all Minted events from a specific network
 * Uses chunked fetching to avoid RPC block range limits
 */
export async function fetchMintedEvents(
  networkId: MintNetworkId
): Promise<MintedEventLog[]> {
  const network = MINT_NETWORKS[networkId]
  
  // Skip if network not configured
  if (!network.contractAddress || network.contractAddress === '0x0000000000000000000000000000000000000000') {
    return []
  }

  const client = getPublicClient(networkId)

  try {
    // Get current block number
    const currentBlock = await client.getBlockNumber()
    
    const blocksToFetch = network.testnet ? TESTNET_BLOCKS_TO_FETCH : MAINNET_BLOCKS_TO_FETCH
    const fromBlock = currentBlock > blocksToFetch ? currentBlock - blocksToFetch : 0n
    const allLogs: MintedEventLog[] = []
    
    let startBlock = fromBlock
    while (startBlock <= currentBlock) {
      const endBlock = startBlock + RPC_CHUNK_SIZE > currentBlock 
        ? currentBlock 
        : startBlock + RPC_CHUNK_SIZE
      
      try {
        const logs = await client.getLogs({
          address: network.contractAddress,
          event: MINTED_EVENT,
          fromBlock: startBlock,
          toBlock: endBlock,
        })

        logs.forEach((log) => {
          allLogs.push({
            to: log.args.to as `0x${string}`,
            tokenId: log.args.tokenId as bigint,
            eventName: log.args.eventName as string,
            emailNullifier: log.args.emailNullifier as `0x${string}`,
            passportId: log.args.passportId as `0x${string}`,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        })
      } catch {
        // Chunk failed - continue with other chunks silently
        // Network issues are common, and partial data is better than none
      }
      
      startBlock = endBlock + 1n
    }

    return allLogs
  } catch {
    // Network-level failure - return empty array and let caller handle
    return []
  }
}

/**
 * Get block timestamp for a given block number
 */
async function getBlockTimestamp(
  networkId: MintNetworkId,
  blockNumber: bigint
): Promise<Date> {
  const client = getPublicClient(networkId)
  
  try {
    const block = await client.getBlock({ blockNumber })
    return new Date(Number(block.timestamp) * 1000)
  } catch {
    return new Date()
  }
}

/**
 * Fetch token URI (metadata) for a token
 */
export async function fetchTokenUri(
  networkId: MintNetworkId,
  tokenId: bigint
): Promise<string | null> {
  const network = MINT_NETWORKS[networkId]
  
  if (!network.contractAddress) return null

  const client = getPublicClient(networkId)

  try {
    const uri = await client.readContract({
      address: network.contractAddress,
      abi: MINTMARKS_ABI,
      functionName: 'uri',
      args: [tokenId],
    })
    return uri as string
  } catch {
    return null
  }
}

/**
 * Parse metadata from data URI
 */
function parseMetadataUri(uri: string): { name?: string; image?: string } {
  try {
    // Handle SVG data URI directly
    if (uri.startsWith('data:image/svg+xml')) {
      return { image: uri }
    }
    
    // Handle data:application/json;base64,... format
    if (uri.startsWith('data:application/json;base64,')) {
      const base64 = uri.replace('data:application/json;base64,', '')
      const json = atob(base64)
      const parsed = JSON.parse(json)
      // If image is also a data URI, return it directly
      if (parsed.image && parsed.image.startsWith('data:')) {
        return { image: parsed.image }
      }
      return parsed
    }
    
    // Handle data:application/json,... format
    if (uri.startsWith('data:application/json,')) {
      const json = decodeURIComponent(uri.replace('data:application/json,', ''))
      const parsed = JSON.parse(json)
      // If image is also a data URI, return it directly
      if (parsed.image && parsed.image.startsWith('data:')) {
        return { image: parsed.image }
      }
      return parsed
    }
    
    // If URI itself is an image URL, return it
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('ipfs://')) {
      return { image: uri }
    }
    
    return {}
  } catch {
    return {}
  }
}

/**
 * Fetch all NFTs from all configured networks
 */
export async function fetchAllMintmarks(
  networks: NetworkId[] = ['ethereum-sepolia', 'base-sepolia']
): Promise<FetchNFTsResult> {
  const allNfts: MintmarkNFT[] = []
  const errors: string[] = []

  // Fetch from each network in parallel
  const networkPromises = networks.map(async (networkId) => {
    const mintNetworkId = networkId as MintNetworkId
    const network = MINT_NETWORKS[mintNetworkId]
    
    // Skip unconfigured networks
    if (!network?.contractAddress || !network.enabled) {
      return []
    }

    try {
      const events = await fetchMintedEvents(mintNetworkId)
      
      // Convert events to NFT format with timestamps
      const nftPromises = events.map(async (event, index) => {
        // Get block timestamp
        const mintedAt = await getBlockTimestamp(mintNetworkId, event.blockNumber)
        
        // Try to get metadata for image
        let imageUri: string | undefined
        try {
          const uri = await fetchTokenUri(mintNetworkId, event.tokenId)
          if (uri) {
            const metadata = parseMetadataUri(uri)
            imageUri = metadata.image
          }
        } catch {
          // Silently fail - image is optional
        }

        const nft: MintmarkNFT = {
          id: `${networkId}-${event.transactionHash}-${index}`,
          tokenId: event.tokenId.toString(),
          txHash: event.transactionHash,
          eventName: event.eventName || 'Mintmark',
          eventDate: mintedAt.toISOString().split('T')[0],
          source: 'luma', // Default source - could be enhanced later
          imageUri,
          owner: event.to,
          network: networkId,
          mintedAt: mintedAt.toISOString(),
        }

        return nft
      })

      return Promise.all(nftPromises)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${networkId}: ${message}`)
      return []
    }
  })

  const results = await Promise.all(networkPromises)
  results.forEach((nfts) => allNfts.push(...nfts))

  // Sort by mintedAt (newest first)
  allNfts.sort((a, b) => 
    new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
  )

  return {
    nfts: allNfts,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}

/**
 * Fetch NFTs owned by a specific address
 */
export async function fetchUserMintmarks(
  userAddress: string,
  networks: NetworkId[] = ['ethereum-sepolia', 'base-sepolia']
): Promise<FetchNFTsResult> {
  const result = await fetchAllMintmarks(networks)
  
  const userNfts = result.nfts.filter(
    (nft) => nft.owner.toLowerCase() === userAddress.toLowerCase()
  )

  return {
    nfts: userNfts,
    error: result.error,
  }
}


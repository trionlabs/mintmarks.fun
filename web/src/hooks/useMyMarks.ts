/**
 * useMyMarks Hook
 * 
 * Fetches and manages Mintmark NFTs across multiple networks.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { parseAbiItem } from 'viem'
import type { NetworkId, MintmarkNFT, GalleryStats, ViewFilter } from '@/types/nft'
import { 
  createNetworkClient, 
  NETWORK_CONFIG, 
  getEnabledNetworks,
  getChainId
} from '@/config/networks'
import { MINTMARKS_ABI } from '@/config/sepolia'

/**
 * Generate a fallback SVG for NFTs without images
 */
function generateFallbackSVG(eventName: string): string {
  const escapedName = (eventName || 'Unknown Event')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f1b36"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#6396F4" stroke-width="2"/>
    <text x="200" y="80" text-anchor="middle" fill="#6396F4" font-family="system-ui,sans-serif" font-size="24" font-weight="bold">MINTMARKS</text>
    <line x1="60" y1="100" x2="340" y2="100" stroke="#6396F4" stroke-width="1" opacity="0.5"/>
    <text x="200" y="200" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="16">${escapedName}</text>
    <text x="200" y="330" text-anchor="middle" fill="#888888" font-family="system-ui,sans-serif" font-size="12">Verified Attendance</text>
    <text x="200" y="355" text-anchor="middle" fill="#6396F4" font-family="system-ui,sans-serif" font-size="10" font-weight="bold">SOULBOUND</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Parse on-chain metadata URI to extract image
 */
function parseMetadataUri(uri: string | undefined): string | null {
  if (!uri) return null
  
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const jsonBase64 = uri.replace('data:application/json;base64,', '')
      const json = JSON.parse(atob(jsonBase64))
      return json.image || null
    }
    return uri
  } catch {
    return null
  }
}

interface UseMyMarksOptions {
  /** User's wallet address for "mine" filter */
  userAddress?: string
  /** Networks to fetch from */
  selectedNetworks: NetworkId[]
  /** View filter */
  viewFilter: ViewFilter
}

interface UseMyMarksResult {
  /** All fetched NFTs (filtered by view) */
  nfts: MintmarkNFT[]
  /** Gallery statistics */
  stats: GalleryStats
  /** Loading state */
  loading: boolean
  /** Error message */
  error: string | null
  /** Refresh function */
  refresh: () => void
}

export function useMyMarks({
  userAddress,
  selectedNetworks,
  viewFilter,
}: UseMyMarksOptions): UseMyMarksResult {
  const [allNfts, setAllNfts] = useState<MintmarkNFT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch NFTs from a single network
  const fetchNetworkNfts = useCallback(async (networkId: NetworkId): Promise<MintmarkNFT[]> => {
    const config = NETWORK_CONFIG[networkId]
    if (!config.mintmarksAddress) {
      return []
    }

    const client = createNetworkClient(networkId)
    const chainId = getChainId(networkId)

    try {
      // Try to get logs from the Minted event
      const currentBlock = await client.getBlockNumber()
      const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n

      const logs = await client.getLogs({
        address: config.mintmarksAddress,
        event: parseAbiItem(
          'event Minted(address indexed to, uint256 indexed tokenId, string eventName, bytes32 emailNullifier, bytes32 passportId)'
        ),
        fromBlock,
        toBlock: 'latest',
      })

      // Parse logs and fetch metadata
      const nftData: MintmarkNFT[] = []

      for (const log of logs) {
        const { to, tokenId, eventName } = log.args as {
          to: string
          tokenId: bigint
          eventName: string
        }

        // Fetch token URI for image
        let imageUri: string | null = null
        try {
          const uri = await client.readContract({
            address: config.mintmarksAddress!,
            abi: MINTMARKS_ABI,
            functionName: 'uri',
            args: [tokenId],
          })
          imageUri = parseMetadataUri(uri as string)
        } catch {
          // Use fallback
          imageUri = generateFallbackSVG(eventName)
        }

        nftData.push({
          id: `${chainId}-${tokenId.toString()}-${to}`,
          tokenId: tokenId.toString(),
          eventName,
          owner: to,
          network: networkId,
          chainId,
          imageUri: imageUri || generateFallbackSVG(eventName),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber?.toString() || null,
          timestamp: null,
        })

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      return nftData
    } catch (err) {
      console.error(`Failed to fetch NFTs from ${networkId}:`, err)
      return []
    }
  }, [])

  // Fetch all NFTs from selected networks
  const fetchAllNfts = useCallback(async () => {
    if (selectedNetworks.length === 0) {
      setAllNfts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await Promise.all(
        selectedNetworks.map(network => fetchNetworkNfts(network))
      )
      
      const allFetched = results.flat()
      
      // Sort by block number (newest first)
      allFetched.sort((a, b) => {
        if (!a.blockNumber) return 1
        if (!b.blockNumber) return -1
        return Number(b.blockNumber) - Number(a.blockNumber)
      })

      setAllNfts(allFetched)
    } catch (err) {
      console.error('Failed to fetch NFTs:', err)
      setError('Failed to load NFTs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedNetworks, fetchNetworkNfts])

  // Initial fetch and on network change
  useEffect(() => {
    fetchAllNfts()
  }, [fetchAllNfts])

  // Filter NFTs based on viewFilter
  const filteredNfts = useMemo(() => {
    if (viewFilter === 'mine' && userAddress) {
      return allNfts.filter(
        nft => nft.owner.toLowerCase() === userAddress.toLowerCase()
      )
    }
    return allNfts
  }, [allNfts, viewFilter, userAddress])

  // Calculate stats
  const stats = useMemo<GalleryStats>(() => {
    const uniqueEvents = new Set(allNfts.map(n => n.eventName)).size
    const uniqueHolders = new Set(allNfts.map(n => n.owner.toLowerCase())).size
    const userNfts = userAddress
      ? allNfts.filter(n => n.owner.toLowerCase() === userAddress.toLowerCase()).length
      : 0

    return {
      totalMinted: allNfts.length,
      uniqueEvents,
      uniqueHolders,
      userNfts,
    }
  }, [allNfts, userAddress])

  return {
    nfts: filteredNfts,
    stats,
    loading,
    error,
    refresh: fetchAllNfts,
  }
}


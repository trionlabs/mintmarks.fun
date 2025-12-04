/**
 * useMyMarks Hook - Fetch and manage user's minted NFTs
 *
 * Fetches real NFT data from blockchain via Mintmarks service.
 * Supports demo mode with mock data via ?demo=true URL parameter.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchAllMintmarks } from '@/services/mintmarksService'
import type { NetworkId, ViewFilter, MintmarkNFT } from '@/types/nft'

// ============================================
// Mock Data for Demo Mode
// ============================================

const MOCK_NFTS: MintmarkNFT[] = [
  {
    id: '1',
    tokenId: '1001',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    eventName: 'ETHGlobal Istanbul 2024',
    eventDate: '2024-11-15',
    source: 'luma',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    network: 'ethereum-sepolia',
    mintedAt: '2024-11-16T10:30:00Z',
  },
  {
    id: '2',
    tokenId: '1002',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    eventName: 'Devconnect Argentina',
    eventDate: '2024-11-10',
    source: 'luma',
    owner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    network: 'ethereum-sepolia',
    mintedAt: '2024-11-11T14:20:00Z',
  },
  {
    id: '3',
    tokenId: '1003',
    txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    eventName: 'Base Builder Meetup',
    eventDate: '2024-10-28',
    source: 'eventbrite',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    network: 'ethereum-sepolia',
    mintedAt: '2024-10-29T09:15:00Z',
  },
  {
    id: '4',
    tokenId: '1004',
    txHash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    eventName: 'Coinbase Dev Workshop',
    eventDate: '2024-10-20',
    source: 'luma',
    owner: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    network: 'base-sepolia',
    mintedAt: '2024-10-21T16:45:00Z',
  },
  {
    id: '5',
    tokenId: '1005',
    txHash: '0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    eventName: 'Web3 Weekly Newsletter',
    eventDate: '2024-10-15',
    source: 'substack',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    network: 'ethereum-sepolia',
    mintedAt: '2024-10-15T08:00:00Z',
  },
  {
    id: '6',
    tokenId: '1006',
    txHash: '0xef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    eventName: 'ZK Summit Berlin',
    eventDate: '2024-09-25',
    source: 'luma',
    owner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    network: 'base-sepolia',
    mintedAt: '2024-09-26T11:00:00Z',
  },
  {
    id: '7',
    tokenId: '1007',
    txHash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    eventName: 'Onchain Summer Hackathon',
    eventDate: '2024-08-15',
    source: 'luma',
    owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21',
    network: 'ethereum-sepolia',
    mintedAt: '2024-08-16T14:30:00Z',
  },
]

// Demo user address (matches some mock NFTs)
const DEMO_USER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21'

// ============================================
// Timeline Helpers
// ============================================

export interface TimelineGroup {
  year: number
  month: number
  monthName: string
  nfts: MintmarkNFT[]
}

export interface TimelineStats {
  totalMinted: number
  uniqueHolders: number
  userNfts: number
  thisMonth: number
  mostActiveMonth: { month: string; count: number } | null
}

/**
 * Group NFTs by year and month for timeline display
 */
export function groupByTimeline(nfts: MintmarkNFT[]): TimelineGroup[] {
  const groups: Map<string, TimelineGroup> = new Map()
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  nfts.forEach((nft) => {
    const date = new Date(nft.mintedAt)
    const year = date.getFullYear()
    const month = date.getMonth()
    const key = `${year}-${month}`

    if (!groups.has(key)) {
      groups.set(key, {
        year,
        month,
        monthName: monthNames[month],
        nfts: [],
      })
    }
    const group = groups.get(key)
    if (group) {
      group.nfts.push(nft)
    }
  })

  // Sort by date (newest first)
  return Array.from(groups.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

// ============================================
// Hook Options
// ============================================

interface UseMyMarksOptions {
  userAddress?: string
  selectedNetworks: NetworkId[]
  viewFilter: ViewFilter
}

interface UseMyMarksReturn {
  nfts: MintmarkNFT[]
  timeline: TimelineGroup[]
  stats: TimelineStats
  loading: boolean
  error: string | null
  refresh: () => void
  isDemo: boolean
}

// ============================================
// Hook Implementation
// ============================================

export function useMyMarks({
  userAddress,
  selectedNetworks,
  viewFilter,
}: UseMyMarksOptions): UseMyMarksReturn {
  const [nfts, setNfts] = useState<MintmarkNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for demo mode
  const isDemo =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === 'true'

  // Effective user address (use demo address in demo mode)
  const effectiveAddress = isDemo ? DEMO_USER_ADDRESS : userAddress

  // Fetch NFTs from blockchain
  const fetchNfts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isDemo) {
        // Demo mode: use mock data with simulated delay
        await new Promise((r) => setTimeout(r, 500))
        setNfts(MOCK_NFTS)
      } else {
        // Real mode: fetch from blockchain
        const result = await fetchAllMintmarks(selectedNetworks)
        
        // Partial errors are stored in result.error but we continue with available data
        setNfts(result.nfts)
        
        // Also cache to localStorage for offline/quick access
        if (result.nfts.length > 0) {
          localStorage.setItem('mintmarks_nfts_cache', JSON.stringify({
            nfts: result.nfts,
            timestamp: Date.now(),
          }))
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch NFTs'
      setError(message)
      
      // Try to load from cache on error
      try {
        const cached = localStorage.getItem('mintmarks_nfts_cache')
        if (cached) {
          const { nfts: cachedNfts } = JSON.parse(cached)
          setNfts(cachedNfts)
        }
      } catch {
        // Ignore cache errors
      }
    } finally {
      setLoading(false)
    }
  }, [isDemo, selectedNetworks, userAddress])

  // Initial fetch
  useEffect(() => {
    fetchNfts()
  }, [fetchNfts])

  // Filter NFTs based on selected networks and view
  const filteredNfts = useMemo(() => {
    let result = nfts

    // Filter by network
    result = result.filter((nft) => selectedNetworks.includes(nft.network))

    // Filter by view
    if (viewFilter === 'mine' && effectiveAddress) {
      result = result.filter(
        (nft) => nft.owner.toLowerCase() === effectiveAddress.toLowerCase()
      )
    }

    // Sort by mintedAt (newest first)
    result = [...result].sort(
      (a, b) =>
        new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
    )

    return result
  }, [nfts, selectedNetworks, viewFilter, effectiveAddress])

  // Group by timeline
  const timeline = useMemo(() => groupByTimeline(filteredNfts), [filteredNfts])

  // Calculate stats
  const stats = useMemo((): TimelineStats => {
    const uniqueOwners = new Set(nfts.map((nft) => nft.owner.toLowerCase()))
    const userNfts = effectiveAddress
      ? nfts.filter(
          (nft) => nft.owner.toLowerCase() === effectiveAddress.toLowerCase()
        ).length
      : 0

    // This month stats
    const now = new Date()
    const thisMonthNfts = filteredNfts.filter((nft) => {
      const date = new Date(nft.mintedAt)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })

    // Most active month
    const monthCounts: Record<string, { month: string; count: number }> = {}
    filteredNfts.forEach((nft) => {
      const date = new Date(nft.mintedAt)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' })
      
      if (!monthCounts[key]) {
        monthCounts[key] = { month: monthName, count: 0 }
      }
      monthCounts[key].count++
    })
    
    const mostActiveMonth = Object.values(monthCounts).sort((a, b) => b.count - a.count)[0] || null

    return {
      totalMinted: nfts.length,
      uniqueHolders: uniqueOwners.size,
      userNfts,
      thisMonth: thisMonthNfts.length,
      mostActiveMonth,
    }
  }, [nfts, filteredNfts, effectiveAddress])

  return {
    nfts: filteredNfts,
    timeline,
    stats,
    loading,
    error,
    refresh: fetchNfts,
    isDemo,
  }
}

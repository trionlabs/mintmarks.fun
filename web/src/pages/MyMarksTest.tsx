/**
 * MyMarks Test Page
 * 
 * Test page with mock NFT data to preview the gallery.
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  Loader2, 
  RefreshCcw, 
  Bookmark,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEnabledNetworks, getTransactionUrl } from '@/config/networks'
import type { NetworkId, ViewFilter, MintmarkNFT, GalleryStats } from '@/types/nft'

// ============================================
// Mock Data
// ============================================

const MOCK_OWNER = '0x4152E39a4A39b8E4d6F4c5Af9e8EB8e7F1C84d5E' as const
const MOCK_OTHER_OWNER = '0x7890AbCdEf1234567890AbCdEf1234567890AbCd' as const

function generateMockSVG(eventName: string, index: number): string {
  const colors = ['#6396F4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  const color = colors[index % colors.length]
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg${index}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f1b36"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg${index})"/>
    <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="${color}" stroke-width="3"/>
    <circle cx="200" cy="150" r="50" fill="${color}" opacity="0.3"/>
    <text x="200" y="80" text-anchor="middle" fill="${color}" font-family="system-ui,sans-serif" font-size="20" font-weight="bold">MINTMARKS</text>
    <text x="200" y="250" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="14">${eventName}</text>
    <text x="200" y="280" text-anchor="middle" fill="#888888" font-family="system-ui,sans-serif" font-size="11">Token #${index + 1}</text>
    <text x="200" y="355" text-anchor="middle" fill="${color}" font-family="system-ui,sans-serif" font-size="10" font-weight="bold">SOULBOUND</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const MOCK_NFTS: MintmarkNFT[] = [
  {
    id: '11155111-1-owner',
    tokenId: '1',
    eventName: 'ETHGlobal Istanbul 2024',
    owner: MOCK_OWNER,
    network: 'ethereumSepolia',
    chainId: 11155111,
    imageUri: generateMockSVG('ETHGlobal Istanbul 2024', 0),
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
    blockNumber: 1000000n,
    timestamp: new Date('2024-11-15'),
  },
  {
    id: '11155111-2-other',
    tokenId: '2',
    eventName: 'Devconnect 2024',
    owner: MOCK_OTHER_OWNER,
    network: 'ethereumSepolia',
    chainId: 11155111,
    imageUri: generateMockSVG('Devconnect 2024', 1),
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`,
    blockNumber: 1000100n,
    timestamp: new Date('2024-11-10'),
  },
  {
    id: '84532-3-owner',
    tokenId: '3',
    eventName: 'Base Buildathon',
    owner: MOCK_OWNER,
    network: 'baseSepolia',
    chainId: 84532,
    imageUri: generateMockSVG('Base Buildathon', 2),
    txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234' as `0x${string}`,
    blockNumber: 500000n,
    timestamp: new Date('2024-11-20'),
  },
  {
    id: '84532-4-other',
    tokenId: '4',
    eventName: 'Coinbase Developer Summit',
    owner: MOCK_OTHER_OWNER,
    network: 'baseSepolia',
    chainId: 84532,
    imageUri: generateMockSVG('Coinbase Developer Summit', 3),
    txHash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456' as `0x${string}`,
    blockNumber: 500100n,
    timestamp: new Date('2024-11-18'),
  },
  {
    id: '11155111-5-owner',
    tokenId: '5',
    eventName: 'ZK Proofs Workshop',
    owner: MOCK_OWNER,
    network: 'ethereumSepolia',
    chainId: 11155111,
    imageUri: generateMockSVG('ZK Proofs Workshop', 4),
    txHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`,
    blockNumber: 1000200n,
    timestamp: new Date('2024-11-22'),
  },
  {
    id: '84532-6-owner',
    tokenId: '6',
    eventName: 'Web3 Gaming Meetup',
    owner: MOCK_OWNER,
    network: 'baseSepolia',
    chainId: 84532,
    imageUri: generateMockSVG('Web3 Gaming Meetup', 5),
    txHash: '0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as `0x${string}`,
    blockNumber: 500200n,
    timestamp: new Date('2024-11-25'),
  },
]

// ============================================
// NFT Card
// ============================================

function NFTCard({ nft, isOwned }: { nft: MintmarkNFT; isOwned: boolean }) {
  const networks = getEnabledNetworks()
  const network = networks.find(n => n.id === nft.network)
  
  return (
    <a
      href={getTransactionUrl(nft.network, nft.txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div 
        className="aspect-square rounded-xl overflow-hidden mb-2 transition-transform duration-200 group-hover:scale-[0.98]"
        style={{ background: 'var(--muted)' }}
      >
        {nft.imageUri ? (
          <img
            src={nft.imageUri}
            alt={nft.eventName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Bookmark className="h-6 w-6 opacity-30" />
          </div>
        )}
      </div>
      
      <div className="px-0.5">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: 'var(--page-text-primary)' }}
        >
          {nft.eventName}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span 
            className="text-xs"
            style={{ color: 'var(--page-text-muted)' }}
          >
            {network?.shortName}
          </span>
          {isOwned && (
            <span 
              className="text-[10px] font-medium"
              style={{ color: 'var(--status-confirmed)' }}
            >
              yours
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

// ============================================
// Filter Dropdown
// ============================================

function NetworkDropdown({ 
  selected, 
  onChange 
}: { 
  selected: NetworkId[]
  onChange: (networks: NetworkId[]) => void 
}) {
  const [open, setOpen] = useState(false)
  const networks = getEnabledNetworks()
  
  const toggleNetwork = (id: NetworkId) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        onChange(selected.filter(n => n !== id))
      }
    } else {
      onChange([...selected, id])
    }
  }

  const label = selected.length === networks.length 
    ? 'All networks' 
    : selected.map(id => networks.find(n => n.id === id)?.shortName).join(', ')
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
        style={{ color: 'var(--page-text-secondary)' }}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div 
            className="absolute top-full right-0 mt-1 py-1 rounded-lg z-20 min-w-[140px]"
            style={{ 
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            {networks.map(network => (
              <button
                key={network.id}
                type="button"
                onClick={() => toggleNetwork(network.id)}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:opacity-70"
                style={{ color: 'var(--page-text-primary)' }}
              >
                {network.shortName}
                {selected.includes(network.id) && (
                  <span style={{ color: 'var(--primary)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Main Test Page
// ============================================

export function MyMarksTest() {
  const [networks, setNetworks] = useState<NetworkId[]>(() => 
    getEnabledNetworks().map(n => n.id)
  )
  const [view, setView] = useState<ViewFilter>('all')
  const [loading, setLoading] = useState(false)
  
  // Simulate current user
  const currentUser = MOCK_OWNER
  
  // Filter NFTs
  const filteredNfts = useMemo(() => {
    let result = MOCK_NFTS.filter(nft => networks.includes(nft.network))
    
    if (view === 'mine') {
      result = result.filter(nft => nft.owner.toLowerCase() === currentUser.toLowerCase())
    }
    
    return result
  }, [networks, view, currentUser])
  
  // Calculate stats
  const stats = useMemo<GalleryStats>(() => {
    const networkFiltered = MOCK_NFTS.filter(nft => networks.includes(nft.network))
    return {
      totalMinted: networkFiltered.length,
      uniqueEvents: new Set(networkFiltered.map(n => n.eventName)).size,
      uniqueHolders: new Set(networkFiltered.map(n => n.owner.toLowerCase())).size,
      userNfts: networkFiltered.filter(n => n.owner.toLowerCase() === currentUser.toLowerCase()).length,
    }
  }, [networks, currentUser])
  
  const isOwned = useCallback((nft: MintmarkNFT) => {
    return nft.owner.toLowerCase() === currentUser.toLowerCase()
  }, [currentUser])
  
  const handleRefresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Test Mode Banner */}
      <div 
        className="mb-6 px-4 py-2 rounded-lg text-center text-sm"
        style={{ 
          background: 'var(--status-pending-bg)',
          color: 'var(--status-pending)',
        }}
      >
        🧪 Test Mode - Mock Data
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 
          className="text-xl font-semibold"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Gallery
        </h1>
        
        <div className="flex items-center gap-4">
          <div 
            className="hidden sm:flex items-center gap-4 text-xs"
            style={{ color: 'var(--page-text-muted)' }}
          >
            <span>{stats.totalMinted} minted</span>
            <span>{stats.uniqueHolders} holders</span>
            <span style={{ color: 'var(--primary)' }}>{stats.userNfts} yours</span>
          </div>
          
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ color: 'var(--page-text-muted)' }}
            aria-label="Refresh"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div 
        className="flex items-center justify-between pb-4 mb-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView('all')}
            className={`text-sm font-medium transition-opacity ${view !== 'all' ? 'opacity-40 hover:opacity-70' : ''}`}
            style={{ color: 'var(--page-text-primary)' }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setView('mine')}
            className={`text-sm font-medium transition-opacity ${view !== 'mine' ? 'opacity-40 hover:opacity-70' : ''}`}
            style={{ color: 'var(--page-text-primary)' }}
          >
            Mine
          </button>
        </div>
        
        <NetworkDropdown selected={networks} onChange={setNetworks} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : filteredNfts.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark 
            className="h-8 w-8 mx-auto mb-3 opacity-20"
            style={{ color: 'var(--page-text-muted)' }}
          />
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--page-text-muted)' }}
          >
            No marks found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredNfts.map(nft => (
            <NFTCard key={nft.id} nft={nft} isOwned={isOwned(nft)} />
          ))}
        </div>
      )}
    </div>
  )
}


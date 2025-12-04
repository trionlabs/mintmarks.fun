/**
 * MyMarks Page - Visual Gallery
 *
 * User-focused gallery showing only the connected user's NFTs.
 * Features:
 * - Visual-first card design with circular images
 * - Hover to reveal details
 * - Minimal stats bar
 * - Demo mode via ?demo=true URL parameter
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  RefreshCcw,
  Bookmark,
  Sparkles,
  Share2,
  Wallet,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet, ConnectWalletModal } from '@/wallet'
import { useMyMarks, type TimelineGroup } from '@/hooks/useMyMarks'
import { getEnabledNetworks, getTransactionUrl } from '@/config/networks'
import type { NetworkId, MintmarkNFT } from '@/types/nft'
import { StatsCards, NFTCard } from '@/components/cards'

// ============================================
// NFT Card Wrapper - Uses reusable NFTCard
// ============================================

/** Format date nicely (full format like "Jan 15, 2024") */
function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/** Truncate token ID for display */
function shortenTokenId(tokenId: string): string {
  return tokenId.length > 8
    ? `${tokenId.slice(0, 4)}…${tokenId.slice(-4)}`
    : tokenId
}

/** NFT Card instance for MyMarks page */
function MarkCard({ nft }: { nft: MintmarkNFT }) {
  return (
    <NFTCard
      source={nft.source?.toUpperCase() || 'MARK'}
      title={nft.eventName}
      date={formatDate(nft.mintedAt)}
      tokenId={shortenTokenId(nft.tokenId)}
      imageUrl={nft.imageUri}
      isSvgImage={nft.imageUri?.startsWith('data:image/svg+xml')}
      href={getTransactionUrl(nft.network, nft.txHash)}
    >
      <ShareNFTButton nft={nft} />
    </NFTCard>
  )
}

// ============================================
// Timeline Section - Year and Month Groups
// ============================================

function TimelineYearSection({ year, months }: { year: number; months: TimelineGroup[] }) {
  const totalMarks = months.reduce((sum, month) => sum + month.nfts.length, 0)

  return (
    <div className="mb-12">
      {/* Year Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--page-text-primary)' }}
        >
          {year}
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--page-text-muted)' }}
        >
          {totalMarks} mark{totalMarks !== 1 ? 's' : ''} this year
        </p>
      </div>

      {/* Month Sections */}
      <div className="space-y-8">
        {months.map((monthGroup) => (
          <div key={`${year}-${monthGroup.month}`}>
            {/* Month Header */}
            <div className="mb-4">
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--page-text-primary)' }}
              >
                {monthGroup.monthName}
              </h3>
              <p
                className="text-xs"
                style={{ color: 'var(--page-text-muted)' }}
              >
                {monthGroup.nfts.length} mark{monthGroup.nfts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
              {monthGroup.nfts.map((nft) => (
                <MarkCard key={nft.id} nft={nft} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Empty State - Not Connected
// ============================================

function NotConnectedState() {
  return (
    <div className="text-center py-16">
      <div
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ background: 'var(--muted)' }}
      >
        <Wallet
          className="h-10 w-10"
          style={{ color: 'var(--page-text-muted)' }}
        />
      </div>
      <h3
        className="text-xl font-semibold mb-2"
        style={{ color: 'var(--page-text-primary)' }}
      >
        Connect Your Wallet
      </h3>
      <p
        className="text-sm mb-6 max-w-sm mx-auto"
        style={{ color: 'var(--page-text-muted)' }}
      >
        Connect your wallet to see your collection of verified digital commitments.
      </p>
      <ConnectWalletModal
        trigger={
          <Button>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        }
      />
    </div>
  )
}

// ============================================
// Empty State - No NFTs
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ background: 'var(--muted)' }}
      >
        <Bookmark
          className="h-10 w-10"
          style={{ color: 'var(--page-text-muted)' }}
        />
      </div>
      <h3
        className="text-xl font-semibold mb-2"
        style={{ color: 'var(--page-text-primary)' }}
      >
        No marks yet
      </h3>
      <p
        className="text-sm mb-6 max-w-sm mx-auto"
        style={{ color: 'var(--page-text-muted)' }}
      >
        Start collecting your digital commitments by minting your first mark.
      </p>
      <Button asChild>
        <Link to="/create">
          <Sparkles className="h-4 w-4 mr-2" />
          Create your first mark
        </Link>
      </Button>
    </div>
  )
}

// ============================================
// Share to X (Twitter) - Collection Share
// ============================================

function ShareButton({ count }: { count: number }) {
  const handleShare = () => {
    const text = `I've collected ${count} mark${count !== 1 ? 's' : ''} on @mintmarks_fun! 🎉\n\nVerified digital commitments, powered by ZK proofs.\n\n#mintmarks #web3 #NFT`
    const url = 'https://mintmarks.fun/marks'
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  if (count === 0) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share Collection
    </Button>
  )
}

// ============================================
// Share Single NFT to X (Twitter)
// ============================================

function ShareNFTButton({ nft }: { nft: MintmarkNFT }) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const text = `Check out my mark: "${nft.eventName}" 🎉\n\nVerified on @mintmarks_fun with ZK proofs.\n\n#mintmarks #web3 #NFT`
    const url = getTransactionUrl(nft.network, nft.txHash)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      title="Share on X (Twitter)"
      className="gap-1.5 py-1.5 px-3 text-xs"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>
  )
}

// StatsCards is now imported from @/components/cards

// ============================================
// Network Dropdown (Minimal, Hydration-safe)
// ============================================

function NetworkDropdown({
  selected,
  onChange,
}: {
  selected: NetworkId[]
  onChange: (networks: NetworkId[]) => void
}) {
  const [open, setOpen] = useState(false)
  const networks = getEnabledNetworks()

  // If only one network, don't show filter
  if (networks.length <= 1) return null

  const toggleNetwork = (id: NetworkId) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        onChange(selected.filter((n) => n !== id))
      }
    } else {
      onChange([...selected, id])
    }
  }

  const label =
    selected.length === networks.length
      ? 'All networks'
      : selected.length === 1
        ? networks.find((n) => n.id === selected[0])?.shortName || 'Networks'
        : `${selected.length} networks`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
        style={{ color: 'var(--page-text-secondary)' }}
        aria-label="Filter by network"
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 py-1 rounded-lg z-20 min-w-[140px]"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {networks.map((network) => (
              <button
                key={network.id}
                type="button"
                onClick={() => {
                  toggleNetwork(network.id)
                  setOpen(false)
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:opacity-70 transition-opacity"
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
// Main Page
// ============================================

export function MyMarks() {
  const { address, isConnected } = useWallet()

  const [networks, setNetworks] = useState<NetworkId[]>(() =>
    getEnabledNetworks().map((n) => n.id)
  )

  // Always fetch user's NFTs only (viewFilter: 'mine')
  const { nfts, timeline, stats, loading, error, refresh, isDemo } = useMyMarks({
    userAddress: address ?? undefined,
    selectedNetworks: networks,
    viewFilter: 'mine', // Only user's NFTs
  })

  // Show connect wallet state if not connected and not in demo mode
  const showConnectState = !isConnected && !isDemo

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 sm:px-6 sm:pt-12 md:pt-16 lg:pt-20">
      {/* Demo Badge */}
      {isDemo && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Sparkles className="h-3 w-3" />
            Demo Mode
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-16 sm:mb-20 md:mb-24">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8 sm:mb-10 md:mb-12 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--page-badge-bg)',
            borderColor: 'var(--page-badge-border)',
          }}
        >
          <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--page-text-primary)' }} aria-hidden="true" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--page-text-primary)', letterSpacing: '0.05em' }}>
            {isConnected || isDemo ? 'unlimited possibilities' : 'Community Collection'}
          </span>
        </div>

        {/* Main Title */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 sm:mb-8 md:mb-10"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Marks of Your Life.
          <span className="block mt-3 sm:mt-4 hero-gradient-text">
            Collected.
          </span>
        </h1>

        {/* Content with Stats */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-20 items-start lg:items-start">
          {/* Left Column - Text */}
          <div className="flex-1 space-y-5 sm:space-y-6 md:space-y-8">
            <p className="text-lg sm:text-xl md:text-2xl font-bold leading-tight" style={{ color: 'var(--page-text-primary)' }}>
              Be Seen. Unlock Doors.
            </p>
            <p className="text-base sm:text-lg md:text-xl leading-relaxed font-medium max-w-2xl" style={{ color: 'var(--page-text-secondary)' }}>
              Your digital commitments are more than just emails. Turn them into onchain{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>"marks"</span>{' '}
              to{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>build your reputation</span>
              ,{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>find your people</span>
              , and{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>unlock exclusive access</span>
              .
            </p>
          </div>

          {/* Stats Cards - Next to text */}
          <div className="flex-shrink-0 w-full lg:w-auto pt-4 lg:pt-0">
            <StatsCards
              showAll={Boolean(isConnected || isDemo)}
              stats={{
                total: isConnected || isDemo ? stats.userNfts : stats.totalMinted,
                thisMonth: stats.thisMonth,
                mostActiveMonth: stats.mostActiveMonth?.month || null,
                mostActiveCount: stats.mostActiveMonth?.count,
              }}
            />
          </div>
        </div>

        {/* Actions - Minimalist, inline with header */}
        <div className="flex flex-wrap items-center gap-3 mt-10 sm:mt-12">
          <ShareButton count={stats.userNfts} />
          <NetworkDropdown selected={networks} onChange={setNetworks} />
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{
              color: 'var(--page-text-muted)',
            }}
            aria-label="Refresh"
            title="Refresh marks"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg text-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--destructive)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: 'var(--primary)' }}
          />
          <p
            className="text-sm"
            style={{ color: 'var(--page-text-muted)' }}
          >
            Loading your marks...
          </p>
        </div>
      ) : showConnectState ? (
        <NotConnectedState />
      ) : nfts.length === 0 ? (
        <EmptyState />
      ) : (
        /* Timeline Layout - Grouped by Year then Month */
        <div className="space-y-8">
          {(() => {
            // Group timeline by year
            const yearGroups: Record<number, TimelineGroup[]> = {}
            timeline.forEach((group) => {
              if (!yearGroups[group.year]) {
                yearGroups[group.year] = []
              }
              yearGroups[group.year].push(group)
            })

            // Sort years descending
            const sortedYears = Object.keys(yearGroups)
              .map(Number)
              .sort((a, b) => b - a)

            return sortedYears.map((year) => (
              <TimelineYearSection
                key={year}
                year={year}
                months={yearGroups[year]}
              />
            ))
          })()}
        </div>
      )}


    </div>
  )
}

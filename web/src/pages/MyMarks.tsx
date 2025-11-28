/**
 * MyMarks Page - Gallery Design
 *
 * Clean, modern gallery with maximum whitespace and minimal UI.
 * Supports demo mode via ?demo=true URL parameter.
 */

import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  RefreshCcw,
  Bookmark,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/wallet'
import { useMyMarks } from '@/hooks/useMyMarks'
import { getEnabledNetworks, getTransactionUrl } from '@/config/networks'
import type { NetworkId, ViewFilter, MintmarkNFT } from '@/types/nft'

// ============================================
// NFT Card - Ultra Minimal
// ============================================

function NFTCard({ nft, isOwned }: { nft: MintmarkNFT; isOwned: boolean }) {
  return (
    <a
      href={getTransactionUrl(nft.network, nft.txHash)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      {/* Image */}
      <div
        className="aspect-square rounded-xl overflow-hidden mb-2 transition-transform duration-200 group-hover:scale-[0.98]"
        style={{ background: 'var(--muted)' }}
      >
        {nft.imageUri ? (
          <img
            src={nft.imageUri}
            alt={nft.eventName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--primary) 0%, var(--primary)/50 100%)`,
            }}
          >
            <Bookmark
              className="h-8 w-8"
              style={{ color: 'var(--primary-foreground)', opacity: 0.8 }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--page-text-primary)' }}
        >
          {nft.eventName}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--page-text-muted)' }}
          >
            {nft.owner.slice(0, 6)}…{nft.owner.slice(-4)}
          </span>
          {isOwned && (
            <span
              className="text-[10px] font-medium"
              style={{ color: 'var(--Controls-Selected)' }}
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
  onChange,
}: {
  selected: NetworkId[]
  onChange: (networks: NetworkId[]) => void
}) {
  const [open, setOpen] = useState(false)
  const networks = getEnabledNetworks()

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
      : selected
          .map((id) => networks.find((n) => n.id === id)?.shortName)
          .join(', ')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
        style={{ color: 'var(--page-text-secondary)' }}
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
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-20">
      <Bookmark
        className="h-8 w-8 mx-auto mb-3 opacity-20"
        style={{ color: 'var(--page-text-muted)' }}
      />
      <p className="text-sm mb-4" style={{ color: 'var(--page-text-muted)' }}>
        No marks yet
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link to="/create">Create your first</Link>
      </Button>
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
  const [view, setView] = useState<ViewFilter>('all')

  const { nfts, stats, loading, refresh, isDemo } = useMyMarks({
    userAddress: address ?? undefined,
    selectedNetworks: networks,
    viewFilter: view,
  })

  const isOwned = useCallback(
    (nft: MintmarkNFT) => {
      if (isDemo) {
        // In demo mode, check against demo user
        return nft.owner.toLowerCase() === '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD21'.toLowerCase()
      }
      return address ? nft.owner.toLowerCase() === address.toLowerCase() : false
    },
    [address, isDemo]
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Demo Badge */}
      {isDemo && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Sparkles className="h-3 w-3" />
            Demo Mode
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Gallery
        </h1>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div
            className="hidden sm:flex items-center gap-4 text-xs"
            style={{ color: 'var(--page-text-muted)' }}
          >
            <span>{stats.totalMinted} minted</span>
            <span>{stats.uniqueHolders} holders</span>
            {(isConnected || isDemo) && stats.userNfts > 0 && (
              <span style={{ color: 'var(--primary)' }}>
                {stats.userNfts} yours
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ color: 'var(--page-text-muted)' }}
            aria-label="Refresh"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
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
          {(isConnected || isDemo) && (
            <button
              type="button"
              onClick={() => setView('mine')}
              className={`text-sm font-medium transition-opacity ${view !== 'mine' ? 'opacity-40 hover:opacity-70' : ''}`}
              style={{ color: 'var(--page-text-primary)' }}
            >
              Mine
            </button>
          )}
        </div>

        <NetworkDropdown selected={networks} onChange={setNetworks} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: 'var(--primary)' }}
          />
        </div>
      ) : nfts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} isOwned={isOwned(nft)} />
          ))}
        </div>
      )}

      {/* Demo Hint */}
      {!isDemo && nfts.length === 0 && !loading && (
        <p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--page-text-muted)' }}
        >
          Tip: Add{' '}
          <code className="bg-black/10 dark:bg-white/10 px-1 rounded">
            ?demo=true
          </code>{' '}
          to see sample marks
        </p>
      )}
    </div>
  )
}

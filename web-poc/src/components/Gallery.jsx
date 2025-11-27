import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { CHAIN, CONTRACTS, MINTMARKS_ABI, RPC_URL } from '../config.js'

// Create client outside component to avoid recreation on every render
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
})

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    color: '#e94560',
    margin: 0,
  },
  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    background: 'transparent',
    border: '1px solid #e94560',
    color: '#e94560',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  filterButtonActive: {
    background: '#e94560',
    color: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#16213e',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #333',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  cardHover: {
    transform: 'translateY(-4px)',
    border: '1px solid #e94560',
  },
  imageContainer: {
    aspectRatio: '1',
    background: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardContent: {
    padding: '1rem',
  },
  eventName: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  owner: {
    fontSize: '0.75rem',
    color: '#888',
    fontFamily: 'monospace',
  },
  badge: {
    display: 'inline-block',
    background: '#e94560',
    color: '#fff',
    fontSize: '0.65rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    marginTop: '0.5rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
  },
  stats: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    padding: '1rem',
    background: '#0d1321',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#888',
  },
  refreshButton: {
    background: 'transparent',
    border: '1px solid #666',
    color: '#888',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
}

export function Gallery({ account }) {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'mine'
  const [hoveredCard, setHoveredCard] = useState(null)

  const fetchNFTs = useCallback(async () => {
    setLoading(true)
    try {
      // Use Alchemy's alchemy_getAssetTransfers API - much better for this use case
      // Falls back to sequential getLogs if that fails
      let logs = []

      try {
        // Try Alchemy's asset transfers API first (no block range limit)
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              contractAddresses: [CONTRACTS.mintmarks],
              category: ['erc1155'],
              withMetadata: true,
              order: 'desc',
              maxCount: '0x64', // 100 results
            }],
          }),
        })

        const data = await response.json()

        if (data.result?.transfers) {
          console.log(`Found ${data.result.transfers.length} transfers via Alchemy API`)

          // Convert to our format - need to get event names from contract
          for (const transfer of data.result.transfers) {
            if (transfer.from === '0x0000000000000000000000000000000000000000') {
              // This is a mint
              const tokenId = BigInt(transfer.erc1155Metadata?.[0]?.tokenId || '0')

              // Get event name from contract
              let eventName = 'Unknown Event'
              try {
                eventName = await publicClient.readContract({
                  address: CONTRACTS.mintmarks,
                  abi: MINTMARKS_ABI,
                  functionName: 'tokenNames',
                  args: [tokenId],
                })
              } catch {
                // Ignore
              }

              logs.push({
                args: {
                  to: transfer.to,
                  tokenId,
                  eventName,
                },
                blockNumber: BigInt(transfer.blockNum),
                transactionHash: transfer.hash,
              })
            }
          }
        }
      } catch (err) {
        console.warn('Alchemy API failed, falling back to getLogs:', err)

        // Fallback: single getLogs request for recent blocks only
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n

        logs = await publicClient.getLogs({
          address: CONTRACTS.mintmarks,
          event: parseAbiItem('event Minted(address indexed to, uint256 indexed tokenId, string eventName, bytes32 emailNullifier, bytes32 passportId)'),
          fromBlock,
          toBlock: 'latest',
        })
      }

      console.log(`Processing ${logs.length} mint events`)

      // Parse events and fetch metadata sequentially to avoid rate limits
      const nftData = []
      for (const log of logs) {
        const { to, tokenId, eventName } = log.args
        const blockNumber = log.blockNumber

        // Skip timestamp to reduce RPC calls - use block number instead
        const timestamp = null

        // Get token URI for the SVG - with delay to avoid rate limits
        let imageUri = null
        try {
          const uri = await publicClient.readContract({
            address: CONTRACTS.mintmarks,
            abi: MINTMARKS_ABI,
            functionName: 'uri',
            args: [tokenId],
          })

          if (uri) {
            // Parse the data URI to extract image
            const jsonBase64 = uri.replace('data:application/json;base64,', '')
            const json = JSON.parse(atob(jsonBase64))
            imageUri = json.image
          }
          // Small delay between calls
          await new Promise((r) => setTimeout(r, 100))
        } catch {
          // Generate fallback SVG
          imageUri = generateFallbackSVG(eventName)
        }

        nftData.push({
          tokenId: tokenId.toString(),
          eventName,
          owner: to,
          timestamp,
          blockNumber: blockNumber?.toString(),
          imageUri,
          txHash: log.transactionHash,
        })
      }

      // Sort by block number (newest first)
      nftData.sort((a, b) => {
        if (!a.blockNumber) return 1
        if (!b.blockNumber) return -1
        return Number(b.blockNumber) - Number(a.blockNumber)
      })

      setNfts(nftData)
    } catch (err) {
      console.error('Failed to fetch NFTs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNFTs()
  }, [fetchNFTs])

  // Filter NFTs based on selected filter
  const filteredNfts = filter === 'mine' && account
    ? nfts.filter((nft) => nft.owner.toLowerCase() === account.toLowerCase())
    : nfts

  // Calculate stats
  const uniqueEvents = new Set(nfts.map((n) => n.eventName)).size
  const uniqueHolders = new Set(nfts.map((n) => n.owner.toLowerCase())).size
  const myNfts = account
    ? nfts.filter((n) => n.owner.toLowerCase() === account.toLowerCase()).length
    : 0

  return (
    <div style={styles.container}>
      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statValue}>{nfts.length}</div>
          <div style={styles.statLabel}>Total Minted</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{uniqueEvents}</div>
          <div style={styles.statLabel}>Events</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{uniqueHolders}</div>
          <div style={styles.statLabel}>Holders</div>
        </div>
        {account && (
          <div style={styles.stat}>
            <div style={styles.statValue}>{myNfts}</div>
            <div style={styles.statLabel}>Your Marks</div>
          </div>
        )}
      </div>

      {/* Header with filters */}
      <div style={styles.header}>
        <h2 style={styles.title}>Mintmarks Gallery</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={styles.filterButtons}>
            <button
              style={{
                ...styles.filterButton,
                ...(filter === 'all' ? styles.filterButtonActive : {}),
              }}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              style={{
                ...styles.filterButton,
                ...(filter === 'mine' ? styles.filterButtonActive : {}),
              }}
              onClick={() => setFilter('mine')}
              disabled={!account}
            >
              My Marks
            </button>
          </div>
          <button style={styles.refreshButton} onClick={fetchNFTs}>
            Refresh
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={styles.loading}>
          Loading Mintmarks...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredNfts.length === 0 && (
        <div style={styles.empty}>
          {filter === 'mine'
            ? "You haven't minted any Mintmarks yet."
            : 'No Mintmarks have been minted yet. Be the first!'}
        </div>
      )}

      {/* NFT Grid */}
      {!loading && filteredNfts.length > 0 && (
        <div style={styles.grid}>
          {filteredNfts.map((nft, index) => (
            <div
              key={`${nft.tokenId}-${nft.owner}-${index}`}
              style={{
                ...styles.card,
                ...(hoveredCard === index ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.imageContainer}>
                {nft.imageUri ? (
                  <img
                    src={nft.imageUri}
                    alt={nft.eventName}
                    style={styles.image}
                  />
                ) : (
                  <div style={{ color: '#666' }}>No image</div>
                )}
              </div>
              <div style={styles.cardContent}>
                <div style={styles.eventName} title={nft.eventName}>
                  {nft.eventName}
                </div>
                <div style={styles.owner}>
                  {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                  {account && nft.owner.toLowerCase() === account.toLowerCase() && (
                    <span style={{ color: '#e94560', marginLeft: '0.5rem' }}>(you)</span>
                  )}
                </div>
                {nft.timestamp && (
                  <div style={{ ...styles.owner, marginTop: '0.25rem' }}>
                    {nft.timestamp.toLocaleDateString()}
                  </div>
                )}
                <div style={styles.badge}>SOULBOUND</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Generate fallback SVG when on-chain fetch fails
function generateFallbackSVG(eventName) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#e94560" stroke-width="2"/>
    <text x="200" y="80" text-anchor="middle" fill="#e94560" font-family="Arial,sans-serif" font-size="24" font-weight="bold">MINTMARKS</text>
    <line x1="60" y1="100" x2="340" y2="100" stroke="#e94560" stroke-width="1" opacity="0.5"/>
    <text x="200" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="16">${escapeXml(eventName)}</text>
    <text x="200" y="330" text-anchor="middle" fill="#888888" font-family="Arial,sans-serif" font-size="12">Verified Attendance</text>
    <text x="200" y="355" text-anchor="middle" fill="#e94560" font-family="Arial,sans-serif" font-size="10" font-weight="bold">SOULBOUND</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default Gallery

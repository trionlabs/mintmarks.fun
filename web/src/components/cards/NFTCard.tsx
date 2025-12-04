/**
 * NFTCard - Modern minimal NFT card
 * 
 * Design:
 * - Square image at top
 * - Title + Source/Date below
 * - Hover: Dark overlay + centered "Post on X" CTA
 * - Click only works on specific icons, not whole card
 * 
 * Used in: MyMarks.tsx, ComponentShowcase.tsx
 */

import { useState, useRef, useEffect } from 'react'
import { Bookmark, Fingerprint, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NFTCardProps {
  /** Source label (e.g., "LUMA", "SUBSTACK") */
  source: string
  /** NFT title */
  title: string
  /** Date string */
  date: string
  /** Token ID (shortened format, e.g., "…8397") */
  tokenId?: string
  /** Image URL (optional) */
  imageUrl?: string
  /** Image is SVG (use object-contain instead of cover) */
  isSvgImage?: boolean
  /** Click handler (used when no href) */
  onClick?: () => void
  /** External link URL (renders as anchor) */
  href?: string
  /** Additional className */
  className?: string
  /** Share handler - main CTA */
  onShare?: () => void
}

export function NFTCard({
  source,
  title,
  date,
  tokenId,
  imageUrl,
  isSvgImage,
  onClick,
  href,
  className,
  onShare,
}: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle extended hover for fingerprint
  useEffect(() => {
    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowDetails(true)
      }, 600)
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setShowDetails(false)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [isHovered])

  const handleExplorerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.()
  }

  return (
    <div 
      className={cn(
        'block',
        'transition-transform duration-300 ease-out',
        'hover:scale-[1.01]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex flex-col">
        {/* Image Container - Square */}
        <div className="relative aspect-square overflow-hidden rounded-xl">
          {/* Main Image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                'w-full h-full transition-all duration-500 ease-out',
                isSvgImage ? 'object-contain' : 'object-cover',
                isHovered && 'scale-[1.02]'
              )}
              loading="lazy"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'var(--muted)' }}
            >
              <Bookmark
                className="h-12 w-12"
                style={{ color: 'var(--page-text-muted)' }}
              />
            </div>
          )}

          {/* Hover Overlay - Dark + Centered Share CTA */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-all duration-400 ease-out",
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{
              background: 'rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Centered Share CTA */}
            {onShare && (
              <button
                onClick={handleShareClick}
                className="text-white text-sm font-medium tracking-wide hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
              >
                Post on 𝕏
              </button>
            )}

            {/* Bottom Right: Explorer icon */}
            {href && (
              <button
                onClick={handleExplorerClick}
                className="absolute bottom-4 right-4 cursor-pointer bg-transparent border-none p-0"
                title="View on Explorer"
              >
                <ExternalLink 
                  className="w-4 h-4 text-white/50 hover:text-white transition-colors duration-200" 
                  strokeWidth={1.5}
                />
              </button>
            )}

            {/* Bottom Left: Token fingerprint */}
            {tokenId && (
              <div 
                className={cn(
                  "absolute bottom-4 left-4 flex items-center gap-1.5 transition-all duration-500",
                  showDetails ? "opacity-60" : "opacity-0"
                )}
              >
                <Fingerprint className="w-3 h-3 text-white" strokeWidth={1.5} />
                <span className="text-[9px] font-mono text-white tracking-wider">
                  {tokenId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Text Content - Below Image */}
        <div className="px-2 pt-3 pb-1">
          {/* Title */}
          <h3 
            className="font-semibold text-[14px] leading-snug line-clamp-2"
            style={{ color: 'var(--page-text-primary)' }}
          >
            {title}
          </h3>

          {/* Source (left) + Date (right) */}
          <div className="flex items-center justify-between mt-2">
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--page-text-muted)' }}
            >
              {source}
            </span>

            <span 
              className="text-[11px]"
              style={{ color: 'var(--page-text-muted)' }}
            >
              {date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NFTCard

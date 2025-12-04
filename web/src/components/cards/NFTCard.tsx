/**
 * NFTCard - Reusable NFT gallery card component
 * 
 * Used in: MyMarks.tsx, ComponentShowcase.tsx
 * Styles from: glassmorphism.css (.nft-card)
 */

import { useState } from 'react'
import { Bookmark, Fingerprint } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NFTCardProps {
  /** Source label (e.g., "LUMA", "SUBSTACK") */
  source: string
  /** NFT title */
  title: string
  /** Date string */
  date: string
  /** Token ID (shortened format, e.g., "#9311…8397") */
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
  /** Children for additional content (e.g., Share button) - shown on hover */
  children?: React.ReactNode
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
  children,
}: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const cardContent = (
    <div className="nft-card p-4 h-full flex flex-col">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Image/Icon - Glassmorphic Circle */}
        <div className="nft-card-icon-circle w-28 h-28 rounded-full flex items-center justify-center mb-2 overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                'w-full h-full',
                isSvgImage ? 'object-contain p-1.5' : 'object-cover'
              )}
              loading="lazy"
            />
          ) : (
            <Bookmark
              className="h-10 w-10"
              style={{ color: 'var(--Controls-Selected)' }}
            />
          )}
        </div>

        {/* Source Label */}
        <p className="text-[9px] font-medium uppercase tracking-wider glass-text-muted">
          {source}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-center text-[13px] leading-tight line-clamp-2 glass-text-primary">
          {title}
        </h3>

        {/* Bottom Section - Date + Token ID / Hover content */}
        <div className="w-full mt-2 relative min-h-[28px] flex items-center justify-center">
          {/* Normal State - Date + Token ID */}
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200"
            style={{
              opacity: children && isHovered ? 0 : 1,
              pointerEvents: children && isHovered ? 'none' : 'auto',
            }}
          >
            <span className="text-xs glass-text-muted">{date}</span>
            {tokenId && (
              <>
                <span className="glass-text-muted">•</span>
                <div className="flex items-center gap-1 glass-text-muted">
                  <Fingerprint className="w-3 h-3" />
                  <span className="text-xs font-mono">#{tokenId}</span>
                </div>
              </>
            )}
          </div>

          {/* Hover State - Children (e.g., Share button) */}
          {children && (
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
              style={{
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? 'auto' : 'none',
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Common props for both wrapper types
  const wrapperProps = {
    className: cn('block h-full group cursor-pointer', className),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  // Render as anchor if href provided, otherwise div
  if (href) {
    return (
      <a
        {...wrapperProps}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {cardContent}
      </a>
    )
  }

  return (
    <div {...wrapperProps} onClick={onClick}>
      {cardContent}
    </div>
  )
}

export default NFTCard

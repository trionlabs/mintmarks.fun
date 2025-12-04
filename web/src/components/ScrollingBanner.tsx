/**
 * @fileoverview Scrolling Banner Component
 * 
 * Displays a disclaimer banner with horizontally scrolling text.
 * Uses CSS animation for smooth infinite scroll effect.
 * Positioned below the header, uses glassmorphic theme styling.
 */

import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

// ============================================
// Constants
// ============================================

const BANNER_TEXT = 'Unaudited Beta - Use at Your Own Risk • Email Wallet Recommended'
const SCROLL_DURATION = '50s' // Duration for one complete scroll cycle - slower for better readability

// ============================================
// Component
// ============================================

export function ScrollingBanner() {
  const { theme } = useTheme()

  // Create repeated content for seamless infinite scroll
  // We need at least 2 copies to create the illusion of infinite scroll
  const repeatedContent = Array(3).fill(null).map((_, i) => (
    <span key={i} className="inline-flex items-center whitespace-nowrap">
      <span className="mx-4 sm:mx-6">{BANNER_TEXT}</span>
      <span 
        className="mx-4 sm:mx-6 opacity-40"
        style={{ color: 'var(--page-text-muted)' }}
      >
        •
      </span>
    </span>
  ))

  return (
    <div
      className={cn(
        'sticky top-14 sm:top-16 z-40',
        'h-8 sm:h-9',
        'overflow-hidden',
        'transition-all duration-300 ease-out'
      )}
      aria-label="Disclaimer banner"
      role="marquee"
    >
      {/* Gradient overlay - matches header style */}
      <div
        className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.03) 20%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 20%, transparent 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      />

      {/* Left fade edge */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent)'
            : 'linear-gradient(to right, rgba(255, 255, 255, 0.8), transparent)',
        }}
      />

      {/* Right fade edge */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to left, rgba(0, 0, 0, 0.5), transparent)'
            : 'linear-gradient(to left, rgba(255, 255, 255, 0.8), transparent)',
        }}
      />

      {/* Scrolling content */}
      <div className="relative h-full flex items-center">
        <div 
          className="flex animate-scroll-banner"
          style={{
            animationDuration: SCROLL_DURATION,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          {/* First set - visible initially */}
          <div 
            className="flex text-xs sm:text-sm font-medium"
            style={{
              color: 'var(--page-text-primary)',
              opacity: 0.7,
              letterSpacing: '0.01em',
            }}
          >
            {repeatedContent}
          </div>
          {/* Second set - creates seamless loop */}
          <div 
            className="flex text-xs sm:text-sm font-medium"
            style={{
              color: 'var(--page-text-primary)',
              opacity: 0.7,
              letterSpacing: '0.01em',
            }}
          >
            {repeatedContent}
          </div>
        </div>
      </div>
    </div>
  )
}

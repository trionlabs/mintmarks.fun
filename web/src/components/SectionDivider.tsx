/**
 * @fileoverview Section Divider Component
 * 
 * Subtle visual separator between homepage sections.
 * Multiple variants for different visual styles.
 */

import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

type DividerVariant = 'gradient' | 'fade' | 'dots' | 'wave'

interface SectionDividerProps {
  variant?: DividerVariant
  className?: string
}

// ============================================
// Component
// ============================================

export function SectionDivider({ variant = 'gradient', className }: SectionDividerProps) {
  return (
    <div 
      className={cn(
        'relative w-full overflow-hidden',
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10',
        className
      )}
      aria-hidden="true"
    >
      {variant === 'gradient' && (
        <div 
          className="h-px w-full"
          style={{
            background: `linear-gradient(
              to right,
              transparent 0%,
              var(--glass-border) 20%,
              var(--glass-border-hover) 50%,
              var(--glass-border) 80%,
              transparent 100%
            )`,
          }}
        />
      )}

      {variant === 'fade' && (
        <div className="relative h-24 sm:h-32 w-full">
          {/* Top fade */}
          <div 
            className="absolute inset-x-0 top-0 h-1/2"
            style={{
              background: `linear-gradient(
                to bottom,
                var(--glass-bg-primary),
                transparent
              )`,
            }}
          />
          {/* Center line */}
          <div 
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px"
            style={{
              background: `linear-gradient(
                to right,
                transparent 0%,
                var(--glass-border-hover) 50%,
                transparent 100%
              )`,
            }}
          />
          {/* Bottom fade */}
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background: `linear-gradient(
                to top,
                var(--glass-bg-primary),
                transparent
              )`,
            }}
          />
        </div>
      )}

      {variant === 'dots' && (
        <div className="flex items-center justify-center gap-2 py-4">
          {[...Array(3)].map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: 'var(--glass-border-hover)',
                opacity: i === 1 ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      )}

      {variant === 'wave' && (
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-12"
          style={{ color: 'var(--glass-border)' }}
        >
          <path
            d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </svg>
      )}
    </div>
  )
}


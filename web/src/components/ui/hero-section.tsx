import React from 'react'
import { cn } from '@/lib/utils'
import { DashedGrid } from './dashed-grid'
import { MouseSpotlight } from './mouse-spotlight'

interface HeroSectionProps {
  children: React.ReactNode
  /** Additional CSS classes for the container */
  className?: string
  /** Show dashed grid overlay */
  showGrid?: boolean
  /** Show mouse spotlight effect */
  showSpotlight?: boolean
  /** Grid spacing in pixels */
  gridSpacing?: number
  /** Spotlight size in pixels */
  spotlightSize?: number
  /** Custom background gradient or color */
  background?: string
  /** Minimum height - defaults to 'min-h-screen' */
  minHeight?: string
  /** Whether to show decorative blur shapes */
  showDecorative?: boolean
}

/**
 * HeroSection - A complete hero section wrapper with glassmorphic styling
 * 
 * Combines DashedGrid, MouseSpotlight, and decorative elements
 * for a cohesive hero section design.
 * 
 * @example
 * ```tsx
 * <HeroSection showGrid showSpotlight>
 *   <div className="relative z-10">
 *     <h1 className="text-white">Hero Content</h1>
 *   </div>
 * </HeroSection>
 * ```
 */
export function HeroSection({
  children,
  className = '',
  showGrid = true,
  showSpotlight = true,
  gridSpacing = 60,
  spotlightSize = 800,
  background,
  minHeight = 'min-h-screen',
  showDecorative = true,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        minHeight,
        className
      )}
      style={{
        background: background || 'var(--hero-page-bg)',
      }}
    >
      {/* Dashed Grid Overlay */}
      {showGrid && (
        <DashedGrid
          spacing={gridSpacing}
          interactive={showSpotlight}
        />
      )}

      {/* Mouse Spotlight */}
      {showSpotlight && (
        <MouseSpotlight size={spotlightSize} />
      )}

      {/* Decorative Blur Shapes */}
      {showDecorative && (
        <>
          <div 
            className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse pointer-events-none"
            style={{ background: 'rgba(59, 130, 246, 0.25)' }}
          />
          <div 
            className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full blur-3xl mix-blend-overlay pointer-events-none"
            style={{ background: 'rgba(147, 51, 234, 0.15)' }}
          />
        </>
      )}

      {/* Content */}
      {children}
    </section>
  )
}

export default HeroSection





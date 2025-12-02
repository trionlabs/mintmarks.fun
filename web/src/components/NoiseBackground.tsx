/**
 * @fileoverview Noise Background Component
 * 
 * Inspired by zk.email's aesthetic - combines:
 * 1. Grid pattern overlay
 * 2. Noise/grain texture
 * 3. Optional gradient glow
 * 
 * Performance optimized with CSS-only animations.
 */

import { cn } from '@/lib/utils'

interface NoiseBackgroundProps {
  /** Show grid lines */
  showGrid?: boolean
  /** Grid line spacing in pixels */
  gridSize?: number
  /** Noise opacity (0-1) */
  noiseOpacity?: number
  /** Show center glow effect */
  showGlow?: boolean
  /** Additional CSS classes */
  className?: string
  /** Children to render on top */
  children?: React.ReactNode
}

/**
 * Noise Background with Grid Pattern
 * 
 * Usage:
 * ```tsx
 * <NoiseBackground showGrid showGlow>
 *   <YourContent />
 * </NoiseBackground>
 * ```
 */
export function NoiseBackground({
  showGrid = true,
  gridSize = 60,
  noiseOpacity = 0.03,
  showGlow = false,
  className,
  children,
}: NoiseBackgroundProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Grid Pattern */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.3,
            backgroundImage: `
              linear-gradient(var(--glass-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none noise-texture"
        style={{ opacity: noiseOpacity }}
        aria-hidden="true"
      />
      
      {/* Center Glow (optional) */}
      {showGlow && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ 
            backgroundColor: 'var(--page-text-primary)', 
            opacity: 0.03 
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default NoiseBackground

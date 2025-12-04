/**
 * @fileoverview Smooth Scroll Provider with Lenis
 * 
 * Optimized buttery-smooth scrolling:
 * - Uses official lenis/react package with native RAF
 * - Lightweight, no Framer Motion frame sync overhead
 * - Respects prefers-reduced-motion
 */

import { ReactLenis, useLenis } from 'lenis/react'
import { ReactNode, useMemo } from 'react'

// ============================================
// Types
// ============================================

interface SmoothScrollProps {
  children: ReactNode
  /** Enable smooth scrolling (default: true) */
  enabled?: boolean
}

// ============================================
// Component
// ============================================

export function SmoothScroll({ children, enabled = true }: SmoothScrollProps) {
  // Check for reduced motion preference (memoized for perf)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // If disabled or prefers reduced motion, just render children
  if (!enabled || prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis 
      root
      options={{
        // Use Lenis native RAF - more performant than manual sync
        autoRaf: true,
        // Smooth lerp interpolation (0.1 = smooth, 1 = instant)
        lerp: 0.1,
        // Natural scroll duration
        duration: 1.0,
        // Smooth wheel scrolling
        smoothWheel: true,
        // Natural multipliers for responsive feel
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        // Prevent infinite scroll
        infinite: false,
        // Sync touch scrolling for mobile
        syncTouch: true,
        // Sync touch lerp for consistent feel
        syncTouchLerp: 0.075,
      }}
    >
      {children}
    </ReactLenis>
  )
}

// ============================================
// Hook Export (for scroll control)
// ============================================

export { useLenis }


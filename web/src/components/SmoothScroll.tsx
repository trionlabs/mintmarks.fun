/**
 * @fileoverview Smooth Scroll Provider with Lenis + Framer Motion
 * 
 * Buttery-smooth scrolling integrated with Framer Motion:
 * - Uses official lenis/react package
 * - Synced with Framer Motion's frame system
 * - Works with CSS scroll-snap
 * - Respects prefers-reduced-motion
 */

import { ReactLenis, useLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { cancelFrame, frame } from 'framer-motion'
import { useEffect, useRef, ReactNode } from 'react'

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
  const lenisRef = useRef<LenisRef>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Integrate Lenis with Framer Motion's frame system
  useEffect(() => {
    // Skip if disabled or prefers reduced motion
    if (!enabled || prefersReducedMotion) return

    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp)
    }

    // Add to Framer Motion's frame loop
    frame.update(update, true)

    return () => cancelFrame(update)
  }, [enabled, prefersReducedMotion])

  // If disabled or prefers reduced motion, just render children
  if (!enabled || prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <ReactLenis 
      root 
      ref={lenisRef}
      options={{
        autoRaf: false, // We use Framer Motion's frame system
        duration: 0.8, // Faster scroll (was 1.2)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Ease out expo
        smoothWheel: true,
        touchMultiplier: 2,
        wheelMultiplier: 1.2, // Faster wheel response
        infinite: false,
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


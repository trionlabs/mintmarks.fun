import { useState, useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

type BlendMode = 'normal' | 'overlay' | 'soft-light' | 'screen' | 'multiply' | 'color-dodge' | 'plus-lighter'

interface DashedGridProps {
  /** Grid line spacing in pixels */
  spacing?: number
  /** Grid line color - uses CSS variable by default */
  color?: string
  /** Grid line stroke width */
  strokeWidth?: number
  /** Enable mouse-follow glow effect */
  interactive?: boolean
  /** Additional CSS classes */
  className?: string
  /** Mouse glow radius in pixels */
  glowRadius?: number
  /** Mouse glow color */
  glowColor?: string
  /** Blend mode for the glow effect */
  blendMode?: BlendMode
}

/**
 * DashedGrid - An animated dashed grid background with optional mouse-follow glow
 * 
 * Used for hero sections and decorative backgrounds.
 * Automatically adapts to light/dark mode via CSS variables.
 * 
 * @example
 * ```tsx
 * <DashedGrid spacing={60} interactive />
 * ```
 */
export function DashedGrid({
  spacing = 50,
  color = 'var(--hero-dashed-grid-color)',
  strokeWidth = 1,
  interactive = true,
  className = '',
  glowRadius = 300,
  glowColor = 'var(--hero-dashed-grid-glow)',
}: DashedGridProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!interactive) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [interactive, mouseX, mouseY])

  const distortion = useMotionTemplate`
    radial-gradient(
      ${glowRadius}px circle at ${mouseX}px ${mouseY}px,
      ${glowColor},
      transparent 50%
    )
  `

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      <svg
        className="absolute inset-0"
        width={dimensions.width}
        height={dimensions.height}
        style={{ opacity: 0.3 }}
      >
        <defs>
          <pattern
            id="dashedGrid"
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${spacing} 0 L 0 0 0 ${spacing}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="2 2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dashedGrid)" />
      </svg>

      {interactive && (
        <motion.div
          className="absolute inset-0 mix-blend-overlay"
          style={{ background: distortion }}
        />
      )}
    </div>
  )
}

export default DashedGrid


import { useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MouseSpotlightProps {
  /** Spotlight radius in pixels */
  size?: number
  /** Spotlight color - uses CSS variable by default */
  color?: string
  /** Opacity of the spotlight effect */
  opacity?: number
  /** Additional CSS classes */
  className?: string
  /** Whether the spotlight is active */
  active?: boolean
}

/**
 * MouseSpotlight - A cinematic spotlight effect that follows the mouse
 * 
 * Creates a radial gradient that follows the cursor position.
 * Perfect for hero sections and interactive backgrounds.
 * 
 * @example
 * ```tsx
 * <MouseSpotlight size={800} />
 * ```
 */
export function MouseSpotlight({
  size = 800,
  color = 'var(--hero-spotlight-color)',
  opacity = 1,
  className = '',
  active = true,
}: MouseSpotlightProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    if (!active) return

    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      mouseX.set(clientX)
      mouseY.set(clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [active, mouseX, mouseY])

  const background = useMotionTemplate`
    radial-gradient(
      ${size}px circle at ${mouseX}px ${mouseY}px,
      ${color},
      transparent 80%
    )
  `

  if (!active) return null

  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 transition-opacity duration-300',
        className
      )}
      style={{
        background,
        opacity,
      }}
    />
  )
}

export default MouseSpotlight






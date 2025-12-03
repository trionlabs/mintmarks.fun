/**
 * @fileoverview Scroll Down Indicator for Hero Section
 * 
 * Animated indicator showing users to scroll for more content.
 * Disappears after scrolling.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLenis } from 'lenis/react'
import { cn } from '@/lib/utils'

interface ScrollDownIndicatorProps {
  /** Target section ID to scroll to */
  targetId?: string
  /** Custom label text */
  label?: string
  /** Additional class names */
  className?: string
}

export function ScrollDownIndicator({ 
  targetId = 'how-it-works',
  label = 'Scroll to explore',
  className 
}: ScrollDownIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true)
  const lenis = useLenis()

  // Hide after scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsVisible(scrollY < 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    const element = document.getElementById(targetId)
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -64, duration: 0.8 })
      } else {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, delay: 1.5 }}
          onClick={handleClick}
          className={cn(
            'absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30',
            'flex flex-col items-center gap-2 cursor-pointer group',
            className
          )}
          aria-label={`Scroll down to ${targetId.replaceAll('-', ' ')}`}
        >
          {/* Label */}
          <span 
            className="text-xs font-medium tracking-wide opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--page-text-secondary)' }}
          >
            {label}
          </span>

          {/* Animated chevrons */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
            >
              <ChevronDown 
                className="w-5 h-5 opacity-40"
                style={{ color: 'var(--page-text-muted)' }}
              />
            </motion.div>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut',
                delay: 0.15
              }}
              className="-mt-2"
            >
              <ChevronDown 
                className="w-5 h-5 opacity-70"
                style={{ color: 'var(--page-text-secondary)' }}
              />
            </motion.div>
          </div>

          {/* Keyboard hint */}
          <span 
            className="text-[10px] font-mono opacity-40 group-hover:opacity-70 transition-opacity mt-1"
            style={{ color: 'var(--page-text-muted)' }}
          >
            ↓ or Space
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}


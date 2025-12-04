/**
 * @fileoverview Floating Scroll Indicator
 * 
 * Shows current section position and allows quick navigation
 * between homepage sections. Glassmorphic style.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

interface Section {
  id: string
  label: string
}

interface ScrollIndicatorProps {
  sections: Section[]
  className?: string
}

// ============================================
// Component
// ============================================

export function ScrollIndicator({ sections, className }: ScrollIndicatorProps) {
  const [activeSection, setActiveSection] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Get Lenis instance for smooth scrolling
  const lenis = useLenis()

  // Track scroll position and determine active section - throttled for performance
  useEffect(() => {
    let ticking = false
    
    const updateScrollState = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight

      // Show indicator after scrolling past hero (50% of viewport)
      setIsVisible(scrollY > viewportHeight * 0.5)

      // Find which section is currently in view
      for (let index = sections.length - 1; index >= 0; index--) {
        const element = document.getElementById(sections[index].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Section is active when its top is in the upper half of viewport
          if (rect.top <= viewportHeight * 0.4) {
            setActiveSection(index)
            break
          }
        }
      }
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollState()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateScrollState() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  // Scroll to section using Lenis
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -64, duration: 0.8 })
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [lenis])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40',
            'flex flex-col items-center gap-2',
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Section navigation"
        >
          {/* Glass container - only visible on hover */}
          <motion.div
            className={cn(
              'absolute inset-0 -inset-x-3 -inset-y-4 rounded-full',
              'backdrop-blur-xl border transition-opacity duration-300'
            )}
            style={{
              backgroundColor: 'var(--glass-bg-primary)',
              borderColor: 'var(--glass-border)',
              opacity: isHovered ? 1 : 0,
            }}
          />

          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="relative group flex items-center gap-3 p-1.5 z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Go to ${section.label}`}
              aria-current={index === activeSection ? 'true' : 'false'}
            >
              {/* Dot indicator */}
              <motion.span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: index === activeSection ? '12px' : '8px',
                  height: index === activeSection ? '12px' : '8px',
                  backgroundColor: index === activeSection 
                    ? 'var(--page-text-primary)' 
                    : 'var(--glass-border-hover)',
                  boxShadow: index === activeSection 
                    ? '0 0 8px var(--page-text-primary)' 
                    : 'none',
                }}
              />

              {/* Label tooltip - appears on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'absolute right-full mr-4 px-3 py-1.5 rounded-lg',
                      'text-xs font-medium whitespace-nowrap',
                      'backdrop-blur-xl border'
                    )}
                    style={{
                      backgroundColor: 'var(--glass-bg-hover)',
                      borderColor: 'var(--glass-border-hover)',
                      color: index === activeSection 
                        ? 'var(--page-text-primary)' 
                        : 'var(--page-text-secondary)',
                    }}
                  >
                    {section.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}

          {/* Progress line connecting dots */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-px h-full -z-10"
            style={{
              background: `linear-gradient(to bottom, 
                transparent 0%, 
                var(--glass-border) 10%, 
                var(--glass-border) 90%, 
                transparent 100%
              )`,
            }}
          />

          {/* Keyboard hint - shows on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <span 
                  className="text-[10px] font-mono px-2 py-1 rounded-md"
                  style={{ 
                    color: 'var(--page-text-muted)',
                    backgroundColor: 'var(--glass-bg-secondary)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  ↑↓ keys
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}


/**
 * @fileoverview Keyboard Navigation Hook
 * 
 * Enables keyboard navigation between homepage sections:
 * - Arrow Up/Down: Navigate between sections
 * - Space/Page Down: Next section
 * - Shift+Space/Page Up: Previous section
 * - Home: First section
 * - End: Last section
 * 
 * Integrates with Lenis smooth scroll when available.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useLenis } from 'lenis/react'

// ============================================
// Types
// ============================================

interface UseKeyboardNavigationOptions {
  sections: Array<{ id: string; label: string }>
  enabled?: boolean
  scrollOffset?: number // Offset from top (for sticky headers)
}

// ============================================
// Hook
// ============================================

export function useKeyboardNavigation({
  sections,
  enabled = true,
  scrollOffset = 64, // Default: 4rem header
}: UseKeyboardNavigationOptions) {
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get Lenis instance for smooth scrolling
  const lenis = useLenis()

  // Find current section index based on scroll position
  const getCurrentSectionIndex = useCallback((): number => {
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY
    const threshold = viewportHeight * 0.4 // Section is active when 40% visible

    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i].id)
      if (element) {
        const rect = element.getBoundingClientRect()
        const elementTop = scrollY + rect.top
        
        // Check if section is in the upper portion of viewport
        if (elementTop <= scrollY + threshold && elementTop + rect.height >= scrollY + threshold) {
          return i
        }
      }
    }
    
    // Default to first section if none found
    return 0
  }, [sections])

  // Scroll to section with Lenis smooth behavior
  const scrollToSection = useCallback((index: number) => {
    if (isScrollingRef.current) return
    
    const targetIndex = Math.max(0, Math.min(index, sections.length - 1))
    const targetSection = sections[targetIndex]
    const element = document.getElementById(targetSection.id)
    
    if (element) {
      isScrollingRef.current = true
      
      // Use Lenis if available, otherwise fallback to native
      if (lenis) {
        lenis.scrollTo(element, {
          offset: -scrollOffset,
          duration: 0.8, // Faster scroll
        })
      } else {
        const elementTop = element.getBoundingClientRect().top + window.scrollY
        const targetScroll = elementTop - scrollOffset
        
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        })
      }
      
      // Reset scrolling flag after animation completes
      // Lenis duration is 0.8s (800ms) + 100ms buffer = 900ms
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
      }, 900)
    }
  }, [sections, scrollOffset, lenis])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Ignore if modifier keys are pressed (except Shift for Shift+Space)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    const currentIndex = getCurrentSectionIndex()
    let targetIndex = currentIndex

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        targetIndex = Math.min(currentIndex + 1, sections.length - 1)
        break

      case 'ArrowUp':
        event.preventDefault()
        targetIndex = Math.max(currentIndex - 1, 0)
        break

      case ' ': // Space
        event.preventDefault()
        if (event.shiftKey) {
          // Shift+Space: Previous section
          targetIndex = Math.max(currentIndex - 1, 0)
        } else {
          // Space: Next section
          targetIndex = Math.min(currentIndex + 1, sections.length - 1)
        }
        break

      case 'PageDown':
        event.preventDefault()
        targetIndex = Math.min(currentIndex + 1, sections.length - 1)
        break

      case 'PageUp':
        event.preventDefault()
        targetIndex = Math.max(currentIndex - 1, 0)
        break

      case 'Home':
        event.preventDefault()
        targetIndex = 0
        break

      case 'End':
        event.preventDefault()
        targetIndex = sections.length - 1
        break

      default:
        return // Not a navigation key
    }

    if (targetIndex !== currentIndex) {
      scrollToSection(targetIndex)
    }
  }, [getCurrentSectionIndex, scrollToSection, sections.length])

  // Setup keyboard listeners
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [enabled, handleKeyDown])

  return {
    scrollToSection,
    getCurrentSectionIndex,
  }
}


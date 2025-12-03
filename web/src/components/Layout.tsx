/**
 * @fileoverview Main Layout Component
 * 
 * Provides the main layout structure with navigation header and footer.
 * Uses UnifiedAuthIndicator for combined Gmail + Wallet auth display.
 * 
 * NOTE: WalletOperationsModal has been removed.
 * All wallet operations are now handled via the dropdown in UnifiedAuthIndicator.
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Plus, Bookmark, FlaskConical } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { UnifiedAuthIndicator } from '@/components/UnifiedAuthIndicator'
import { SpiralCirclesBackground } from '@/components/SpiralCirclesBackground'
import { ScrollingBanner } from '@/components/ScrollingBanner'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

// ============================================
// Navigation Items
// ============================================

const navItems: NavItem[] = [
  { path: '/create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
  { path: '/marks', label: 'My Marks', icon: <Bookmark className="h-4 w-4" /> },
]

// ============================================
// Component
// ============================================

export function Layout({ children }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  // Scroll detection for header gradient
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const showGradient = isScrolled || isHovered
  
  // Home page uses wider layout (optimized for MacBook), other pages use narrower
  const isHomePage = location.pathname === '/'
  const containerClass = isHomePage 
    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' 
    : 'max-w-5xl mx-auto px-4 sm:px-6'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Linear Gradient Overlay - Brightens bottom */}
      <div 
        className="gradient-overlay"
        aria-hidden="true"
      />
      
      {/* Global Noise Texture Overlay - Modern High-Grain */}
      <div 
        className="noise-overlay"
        aria-hidden="true"
      />
      
      {/* Animated Background - Global */}
      <SpiralCirclesBackground 
        count={75} 
        speed={0.4}
      />
      
      {/* Navigation */}
      <header
        className={cn(
          'sticky top-0 z-50 h-14 sm:h-16',
          'transition-all duration-300 ease-out',
          'border-b border-transparent'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Minimal gradient overlay - no colors, just blur */}
        {/* Gradient: 0% → 20% vertical transition, then transparent */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            showGradient ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.03) 20%, transparent 100%)'
              : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 20%, transparent 100%)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
          }}
        />

        <nav className={cn("relative h-full flex items-center justify-between", containerClass)}>
          {/* Logo - Icon + Text */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo-icon.svg"
              alt="MintMarks"
              className="h-6 w-6 sm:h-7 sm:w-7 transition-opacity group-hover:opacity-90"
              style={{
                filter: theme === 'dark' 
                  ? 'brightness(0) invert(1)' 
                  : 'brightness(0)',
              }}
            />
            <span
              className="text-xl sm:text-2xl font-semibold"
              style={{
                color: 'var(--page-text-primary)',
                textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                fontFamily: "'Cute Font', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              MINTMARKS.FUN
            </span>
            <span
              className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded"
              style={{
                color: 'var(--page-text-muted)',
                opacity: 0.7,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg-secondary)',
              }}
            >
              [unaudited]
            </span>
          </Link>

          {/* Navigation Items + Auth */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Nav Links - Neutral colors */}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 sm:px-4 py-2',
                    'text-sm font-medium rounded-md',
                    'transition-all duration-300 backdrop-blur-sm',
                    'border border-transparent',
                    isActive
                      ? 'bg-[var(--glass-bg-hover)] opacity-100 border-[var(--glass-border)]/70'
                      : 'opacity-70 hover:opacity-100 hover:bg-[var(--glass-bg-primary)] hover:border-[var(--glass-border-hover)]/60 hover:shadow-sm'
                  )}
                  style={{ 
                    color: 'var(--page-text-primary)',
                    transform: 'none',
                    translate: 'none',
                  }}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* Theme Toggle - Minimal */}
            <button
              onClick={toggleTheme}
              className="p-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" style={{ color: 'var(--page-text-primary)' }} />
              ) : (
                <Moon className="h-4 w-4" style={{ color: 'var(--page-text-primary)' }} />
              )}
            </button>

            {/* Unified Auth Indicator - All wallet operations via dropdown */}
            <UnifiedAuthIndicator />
          </div>
        </nav>
      </header>

      {/* Scrolling Banner */}
      <ScrollingBanner />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--glass-border)] py-6 sm:py-8">
        <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4", containerClass)}>
          {/* Left: Main Message */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span
              className="text-xs sm:text-sm font-medium"
              style={{ color: 'var(--page-text-primary)' }}
            >
              mint emails as marks.
            </span>
            <span
              className="text-xs opacity-60"
              style={{ color: 'var(--page-text-muted)' }}
            >
              private. composable. verifiable.
            </span>
          </div>
          
          {/* Right: Built With & Copyright */}
          <div className="flex items-center gap-3 text-xs flex-wrap justify-center sm:justify-end">
            <div className="flex items-center gap-1.5">
              <span
                className="opacity-50"
                style={{ color: 'var(--page-text-muted)' }}
              >
                built with
              </span>
              <a
                href="https://zk.email/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-opacity hover:opacity-80 underline underline-offset-2"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                zk-email
              </a>
              <span
                className="opacity-40"
                style={{ color: 'var(--page-text-muted)' }}
              >
                &
              </span>
              <a
                href="https://zkpassport.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-opacity hover:opacity-80 underline underline-offset-2"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                zk-passport
              </a>
              <span
                className="opacity-40"
                style={{ color: 'var(--page-text-muted)' }}
              >
                &
              </span>
              <a
                href="https://noir-lang.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-opacity hover:opacity-80 underline underline-offset-2"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                noir
              </a>
            </div>
            <span
              className="opacity-40"
              style={{ color: 'var(--page-text-muted)' }}
            >
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Test Button - Development Only */}
      {import.meta.env.DEV && (
        <Link
          to="/marks/test"
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'flex items-center gap-2 px-4 py-3',
            'rounded-full shadow-lg border',
            'backdrop-blur-[32px]',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95'
          )}
          style={{
            background: 'var(--glass-bg-primary)',
            borderColor: location.pathname === '/marks/test' 
              ? 'var(--glass-border-hover)' 
              : 'var(--glass-border)',
            color: 'var(--page-text-primary)',
          }}
          aria-label="Test Page"
        >
          <FlaskConical className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Test</span>
        </Link>
      )}
    </div>
  )
}

/**
 * @fileoverview Main Layout Component
 * 
 * Provides the main layout structure with navigation header and footer.
 * Uses UnifiedAuthIndicator for combined Gmail + Wallet auth display.
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Moon, Sun, Plus, Bookmark, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { UnifiedAuthIndicator } from '@/components/UnifiedAuthIndicator'
import { WalletOperationsModal } from '@/components/WalletOperationsModal'
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
  { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { path: '/create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
  { path: '/marks', label: 'My Marks', icon: <Bookmark className="h-4 w-4" /> },
  // Development only: Test mint page
  ...(import.meta.env.DEV ? [{ path: '/marks/test', label: 'Test', icon: <FlaskConical className="h-4 w-4" /> }] : []),
]

// ============================================
// Component
// ============================================

export function Layout({ children }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
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

  return (
    <div className="min-h-screen flex flex-col">
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
        {/* Gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            showGradient ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(to bottom, rgba(9, 66, 223, 0.2), rgba(4, 54, 224, 0.15))'
              : 'linear-gradient(to bottom, rgba(240, 244, 249, 0.4), rgba(247, 249, 252, 0.3))',
            backdropFilter: 'blur(12px)',
          }}
        />

        <nav className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Sparkles
              className="h-5 w-5 sm:h-6 sm:w-6 transition-colors"
              style={{ color: 'var(--page-text-primary)' }}
            />
            <span
              className="font-black text-xl sm:text-2xl"
              style={{
                color: 'var(--primary)',
                textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                fontFamily: "'Cute Font', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              MINTMARKS.FUN
            </span>
          </Link>

          {/* Navigation Items + Auth */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Nav Links */}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 sm:px-4 py-2',
                    'text-sm sm:text-base font-medium rounded-md',
                    'transition-all',
                    isActive
                      ? 'bg-primary/10 backdrop-blur-md'
                      : 'opacity-70 hover:opacity-100 hover:bg-primary/5'
                  )}
                  style={{ color: 'var(--page-text-primary)' }}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="ml-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Unified Auth Indicator */}
            <UnifiedAuthIndicator 
              onWalletClick={() => setIsWalletModalOpen(true)}
            />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-transparent py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-xs sm:text-sm opacity-70"
            style={{ color: 'var(--page-text-secondary)' }}
          >
            © {new Date().getFullYear()} mintmarks. Own Your Commitments.
          </p>
        </div>
      </footer>

      {/* Wallet Operations Modal */}
      <WalletOperationsModal
        open={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
      />
    </div>
  )
}

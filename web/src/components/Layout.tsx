import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Moon, Sun, Mail, LogOut, Home, Plus, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { path: '/create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
  { path: '/marks', label: 'My Marks', icon: <Bookmark className="h-4 w-4" /> },
]

export function Layout({ children }: LayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

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
              className={cn(
                'h-5 w-5 sm:h-6 sm:w-6 transition-colors',
                theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
              )}
            />
            <span
              className={cn(
                'font-bold text-lg sm:text-xl',
                theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
              )}
              style={{
                textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              mintmarks
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 sm:px-4 py-2',
                    'text-xs sm:text-sm font-medium rounded-md',
                    'transition-all',
                    isActive
                      ? theme === 'dark'
                        ? 'bg-white/10 text-white backdrop-blur-md'
                        : 'bg-black/5 text-[#1A1A1A] backdrop-blur-md'
                      : theme === 'dark'
                        ? 'text-white/70 hover:bg-white/10 hover:text-white'
                        : 'text-[#1A1A1A]/70 hover:bg-black/5 hover:text-[#1A1A1A]'
                  )}
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
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Auth Button (placeholder) */}
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Sign In</span>
            </Button>
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
    </div>
  )
}


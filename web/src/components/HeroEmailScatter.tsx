/**
 * @fileoverview Hero Email Scatter Animation (Optimized)
 * 
 * Performance optimizations:
 * - CSS animations for floating (instead of framer-motion)
 * - Intersection Observer to pause when not visible
 * - Throttled mouse tracking
 * - Reduced re-renders with refs
 * - Lazy initial render
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Sparkles } from 'lucide-react'

// ============================================
// Types
// ============================================

interface EmailData {
  id: number
  sender: string
  subject: string
  x: number
  startY: number
}

interface ActiveEmail extends EmailData {
  createdAt: number
  isMinted: boolean
}

// ============================================
// Constants (moved outside component)
// ============================================

const EMAIL_TEMPLATES = [
  // Achievements & Milestones
  { sender: "Substack", subject: "You hit 1K subscribers! 🎉" },
  { sender: "Spotify", subject: "Top 0.01% listener" },
  { sender: "Stripe", subject: "You earned $10K!" },
  { sender: "Airbnb", subject: "You're now a Superhost ⭐" },
  { sender: "GitHub", subject: "100 stars on your repo" },
  { sender: "LinkedIn", subject: "Profile views: 1,000" },
  { sender: "YouTube", subject: "Silver Play Button 🥈" },
  { sender: "X", subject: "10K followers!" },
  
  // Events & Tickets
  { sender: "Luma", subject: "You're approved!" },
  { sender: "Devcon", subject: "Ticket confirmed ✓" },
  { sender: "ETH Denver", subject: "Speaker Invitation!" },
  { sender: "Apple", subject: "WWDC Invitation" },
  
  // Transactions & Finance
  { sender: "Coinbase", subject: "You purchased BTC (2014)!" },
  { sender: "Binance", subject: "Position liquidated 💀" },
  { sender: "PayPal", subject: "Money received" },
  { sender: "Venmo", subject: "Payment complete" },
  
  // Services & Subscriptions
  { sender: "Netflix", subject: "LOTR: 100 rewatches! 👀" },
  { sender: "Uber", subject: "Your ride is arriving" },
  { sender: "Amazon", subject: "Order shipped 📦" },
  { sender: "Tesla", subject: "You're a Tesla owner!" },
  { sender: "Figma", subject: "You're a Figma Pro!" },
  { sender: "Cursor", subject: "You're a Cursor Pro!" },
] as const

const MAX_VISIBLE_EMAILS_DESKTOP = 9 // 3x3 grid
const MAX_VISIBLE_EMAILS_TABLET = 6 // 2x3 grid (iPad)
const MAX_VISIBLE_EMAILS_MOBILE = 4 // 2x2 grid
const SPARKLE_COUNT = 5
const EMAIL_LIFETIME = 16000 // Good rotation speed
const SPAWN_INTERVAL = 2000 // 2s between spawns
// Generate random initial spawn delays for more organic feel
const generateRandomDelays = (count: number, baseInterval: number, variance: number = 0.3) => {
  const delays: number[] = []
  for (let i = 0; i < count; i++) {
    const randomVariance = (Math.random() - 0.5) * variance
    const delay = i * baseInterval * (1 + randomVariance)
    delays.push(Math.max(0, Math.round(delay)))
  }
  return delays.sort((a, b) => a - b) // Sort to ensure order
}

const INITIAL_SPAWN_DELAYS_DESKTOP = generateRandomDelays(9, 250, 0.4) // Random delays for 9 slots
const INITIAL_SPAWN_DELAYS_TABLET = generateRandomDelays(6, 200, 0.4) // Random delays for 6 slots
const INITIAL_SPAWN_DELAYS_MOBILE = generateRandomDelays(4, 300, 0.4) // Random delays for 4 slots

// Desktop grid positions - 3x3 matrix with good spacing
// Cards are ~210px wide, container is ~600px = 35% per card
const GRID_SLOTS_DESKTOP = [
  // Top row - staggered heights for natural feel
  { x: 0, y: 2 },
  { x: 33, y: 6 },
  { x: 66, y: 3 },
  // Middle row
  { x: 2, y: 36 },
  { x: 35, y: 40 },
  { x: 64, y: 38 },
  // Bottom row
  { x: 0, y: 68 },
  { x: 33, y: 72 },
  { x: 64, y: 70 },
] as const

// Tablet (iPad) grid positions - 2x3 grid
// Cards are ~200px wide (iPad için daha geniş), container is ~600px
const GRID_SLOTS_TABLET = [
  // Top row - daha geniş spacing
  { x: 3, y: 8 },
  { x: 52, y: 10 },
  // Middle row
  { x: 1, y: 45 },
  { x: 50, y: 47 },
  // Bottom row
  { x: 3, y: 82 },
  { x: 52, y: 84 },
] as const

// Mobile grid positions - 2x2 grid with larger cards
// Cards are ~180px wide, container is ~380px
// Optimized for mobile screens with bigger cards and better readability
const GRID_SLOTS_MOBILE = [
  // Top row - daha geniş spacing için ayarlandı
  { x: 3, y: 8 },
  { x: 52, y: 10 },
  // Bottom row
  { x: 5, y: 55 },
  { x: 54, y: 58 },
] as const

// Add small random offset for natural look (±2%)
const getRandomizedSlot = (baseSlot: { x: number; y: number }) => ({
  x: baseSlot.x + (Math.random() * 4 - 2),
  y: baseSlot.y + (Math.random() * 4 - 2),
})

// Screen size type
type ScreenSize = 'mobile' | 'tablet' | 'desktop'

// Get screen size based on width
const getScreenSize = (width: number): ScreenSize => {
  if (width < 640) return 'mobile'      // < sm breakpoint
  if (width < 1024) return 'tablet'     // sm to lg breakpoint (iPad)
  return 'desktop'                      // >= lg breakpoint
}

// Get grid slots based on screen size
const getGridSlots = (screenSize: ScreenSize) => {
  switch (screenSize) {
    case 'mobile':
      return GRID_SLOTS_MOBILE
    case 'tablet':
      return GRID_SLOTS_TABLET
    case 'desktop':
      return GRID_SLOTS_DESKTOP
  }
}

// Get max emails based on screen size
const getMaxEmails = (screenSize: ScreenSize) => {
  switch (screenSize) {
    case 'mobile':
      return MAX_VISIBLE_EMAILS_MOBILE
    case 'tablet':
      return MAX_VISIBLE_EMAILS_TABLET
    case 'desktop':
      return MAX_VISIBLE_EMAILS_DESKTOP
  }
}

// Get initial spawn delays based on screen size
const getInitialSpawnDelays = (screenSize: ScreenSize) => {
  switch (screenSize) {
    case 'mobile':
      return INITIAL_SPAWN_DELAYS_MOBILE
    case 'tablet':
      return INITIAL_SPAWN_DELAYS_TABLET
    case 'desktop':
      return INITIAL_SPAWN_DELAYS_DESKTOP
  }
}

// Animation variants - optimized for hardware acceleration
// Only using opacity + transform (GPU accelerated properties)
const emailVariants = {
  enter: { 
    opacity: 0, 
    y: -15,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
}

const mintBadgeVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 12 }
  }
}

// ============================================
// Utility Functions
// ============================================

const generateMintAddress = (id: number): string => {
  const hex = id.toString(16).padStart(8, '0')
  return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`
}

const getNextAvailableSlot = (existingEmails: ActiveEmail[], screenSize: ScreenSize) => {
  const occupiedSlots = new Set<number>()
  const gridSlots = getGridSlots(screenSize)
  
  existingEmails.forEach(email => {
    gridSlots.forEach((slot, idx) => {
      // Check if this slot area is already taken (with some tolerance for random offset)
      const tolerance = screenSize === 'mobile' ? 15 : screenSize === 'tablet' ? 18 : 20
      if (Math.abs(slot.x - email.x) < tolerance && Math.abs(slot.y - email.startY) < tolerance) {
        occupiedSlots.add(idx)
      }
    })
  })
  
  // Get all available slots
  const availableSlots: number[] = []
  for (let i = 0; i < gridSlots.length; i++) {
    if (!occupiedSlots.has(i)) {
      availableSlots.push(i)
    }
  }
  
  // Random selection from available slots
  if (availableSlots.length === 0) return null
  
  const randomIndex = availableSlots[Math.floor(Math.random() * availableSlots.length)]
  return getRandomizedSlot(gridSlots[randomIndex])
}

// Throttle function for mouse move
function throttle<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let lastCall = 0
  return (...args: T) => {
    const now = Date.now()
    if (now - lastCall >= ms) {
      lastCall = now
      fn(...args)
    }
  }
}

// ============================================
// Email Card Component (Optimized)
// ============================================

interface EmailCardProps {
  email: ActiveEmail
  onMint: (id: number) => void
}

const EmailCard = React.memo(function EmailCard({ email, onMint }: EmailCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const mintAddress = useMemo(() => generateMintAddress(email.id), [email.id])

  const handleClick = useCallback(() => {
    if (!email.isMinted) onMint(email.id)
  }, [email.id, email.isMinted, onMint])

  return (
    <motion.div
      variants={emailVariants}
      initial="enter"
      animate="visible"
      exit="exit"
      className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[210px]"
      style={{ 
        position: 'absolute', 
        left: `${email.x}%`, 
        top: `${email.startY}%`,
        pointerEvents: 'auto',
        willChange: 'transform, opacity', // GPU layer promotion
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Minted Badge */}
      <AnimatePresence>
        {email.isMinted && (
          <motion.div
            variants={mintBadgeVariants}
            initial="hidden"
            animate="visible"
            className="absolute -top-9 sm:-top-11 left-1/2 -translate-x-1/2 z-20"
          >
            {/* Sparkles - CSS animation instead of framer-motion */}
            <div className="sparkle-container">
              {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="sparkle"
                  style={{ 
                    '--angle': `${(i / SPARKLE_COUNT) * 360}deg`,
                    '--delay': `${i * 50}ms`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
            
            <div 
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-3 md:py-1.5 lg:px-3 lg:py-1.5 rounded-full flex items-center gap-1.5 sm:gap-1.5"
              style={{
                background: 'var(--mint-success-gradient)',
                boxShadow: 'var(--mint-success-glow)',
              }}
            >
              <Sparkles className="w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-3 lg:h-3 text-white" />
              <span className="text-[10px] sm:text-[10px] md:text-[10px] lg:text-[10px] font-bold text-white uppercase tracking-wide">
                Minted
              </span>
            </div>
            <div 
              className="text-[8px] sm:text-[8px] md:text-[8px] lg:text-[8px] font-mono text-center mt-1 sm:mt-1"
              style={{ color: 'var(--page-text-secondary)' }}
            >
              {mintAddress}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <div 
        onClick={handleClick}
        className="relative p-4 sm:p-4 md:p-4 lg:p-3.5 rounded-lg sm:rounded-xl backdrop-blur-md transition-all duration-200"
        style={{
          background: 'var(--hero-card-bg)',
          border: `1px solid var(${
            email.isMinted 
              ? '--mint-success-border' 
              : isHovered 
                ? '--hero-card-border-hover' 
                : '--hero-card-border'
          })`,
          boxShadow: email.isMinted 
            ? 'var(--mint-success-shadow)' 
            : 'var(--hero-card-shadow)',
          cursor: email.isMinted ? 'default' : 'pointer',
        }}
      >
        {/* Glow effect */}
        {email.isMinted && (
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--mint-success-bg), transparent 70%)' }}
          />
        )}

        {/* Content */}
        <div className="flex items-start gap-3 sm:gap-3 md:gap-3 lg:gap-2.5 relative z-10">
          <div 
            className="p-2.5 sm:p-2 md:p-2 lg:p-1.5 rounded-md sm:rounded-lg shrink-0 transition-colors duration-200 mt-0.5 sm:mt-0"
            style={{ 
              backgroundColor: email.isMinted 
                ? 'var(--mint-success-bg)'
                : isHovered
                  ? 'var(--Controls-Idle)'
                  : 'var(--hero-card-icon-bg)'
            }}
          >
            <Mail 
              className="h-5 w-5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-3.5 lg:w-3.5 transition-colors duration-200"
              style={{ 
                color: email.isMinted 
                  ? 'var(--mint-success)'
                  : isHovered
                    ? 'var(--Controls-Selected)'
                    : 'var(--page-text-secondary)' 
              }} 
            />
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <div 
              className="text-[11px] sm:text-[10px] md:text-[10px] lg:text-[9px] font-medium uppercase tracking-wider mb-2 sm:mb-1 md:mb-1 lg:mb-0.5 transition-colors duration-200 break-words"
              style={{ 
                color: email.isMinted 
                  ? 'var(--mint-success)'
                  : isHovered
                    ? 'var(--Controls-Selected)'
                    : 'var(--page-text-secondary)' 
              }}
            >
              {email.sender}
            </div>
            <div 
              className="text-[15px] sm:text-[15px] md:text-[15px] lg:text-[13px] font-medium leading-relaxed sm:leading-relaxed md:leading-relaxed lg:leading-tight break-words"
              style={{ color: 'var(--page-text-primary)' }}
            >
              {email.subject}
            </div>
          </div>

          {/* Mark It hint */}
          {isHovered && !email.isMinted && (
            <div className="shrink-0 flex items-center gap-1 sm:gap-1 pl-1.5 sm:pl-2 animate-fade-in">
              <Sparkles className="w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-3 lg:h-3" style={{ color: 'var(--Controls-Selected)' }} />
              <span 
                className="text-[9px] sm:text-[9px] md:text-[9px] lg:text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                style={{ color: 'var(--Controls-Selected)' }}
              >
                Mark It
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ============================================
// Main Component
// ============================================

export const HeroEmailScatter: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [emails, setEmails] = useState<ActiveEmail[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop')
  
  const emailIdRef = useRef(0)
  const intervalsRef = useRef<{ spawn?: NodeJS.Timeout; cleanup?: NodeJS.Timeout }>({})

  // Detect screen size (mobile, tablet, desktop)
  useEffect(() => {
    const checkScreenSize = () => {
      setScreenSize(getScreenSize(window.innerWidth))
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Intersection Observer - pause when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  // Spawn email function - random slot and template selection
  const spawnEmail = useCallback(() => {
    setEmails(prev => {
      const activeEmails = prev.filter(e => Date.now() - e.createdAt < EMAIL_LIFETIME)
      const maxEmails = getMaxEmails(screenSize)
      if (activeEmails.length >= maxEmails) return activeEmails
      
      const position = getNextAvailableSlot(activeEmails, screenSize)
      if (!position) return activeEmails

      // Random template selection instead of sequential
      const randomTemplateIndex = Math.floor(Math.random() * EMAIL_TEMPLATES.length)
      const template = EMAIL_TEMPLATES[randomTemplateIndex]
      
      return [...activeEmails, {
        id: emailIdRef.current++,
        sender: template.sender,
        subject: template.subject,
        x: position.x,
        startY: position.y,
        createdAt: Date.now(),
        isMinted: false,
      }]
    })
  }, [screenSize])

  // Handle mint
  const handleMint = useCallback((id: number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isMinted: true } : e))
  }, [])

  // Spawn and cleanup intervals - only when visible
  useEffect(() => {
    if (!isVisible) {
      // Clear intervals when not visible
      if (intervalsRef.current.spawn) clearInterval(intervalsRef.current.spawn)
      if (intervalsRef.current.cleanup) clearInterval(intervalsRef.current.cleanup)
      return
    }

    // Initial spawn with random staggered delays based on screen size
    const initialDelays = getInitialSpawnDelays(screenSize)
    const timers = initialDelays.map(delay => setTimeout(spawnEmail, delay))
    
    // Continue spawning with random intervals (1.5s - 2.5s) for more organic feel
    const scheduleNextSpawn = () => {
      const randomDelay = SPAWN_INTERVAL + (Math.random() - 0.5) * 1000 // 1500-2500ms
      intervalsRef.current.spawn = setTimeout(() => {
        spawnEmail()
        scheduleNextSpawn() // Schedule next spawn recursively
      }, randomDelay) as unknown as NodeJS.Timeout
    }
    scheduleNextSpawn()
    
    // Cleanup old emails
    intervalsRef.current.cleanup = setInterval(() => {
      setEmails(prev => prev.filter(e => Date.now() - e.createdAt < EMAIL_LIFETIME))
    }, 2000) // Less frequent cleanup
    
    return () => {
      timers.forEach(clearTimeout)
      if (intervalsRef.current.spawn) clearTimeout(intervalsRef.current.spawn)
      if (intervalsRef.current.cleanup) clearInterval(intervalsRef.current.cleanup)
    }
  }, [isVisible, screenSize, spawnEmail])

  // Throttled mouse tracking - only when visible and desktop
  useEffect(() => {
    if (!isVisible || screenSize !== 'desktop') return

    const handleMouseMove = throttle((e: MouseEvent) => {
      setMousePos({
        x: 30 + (e.clientX / window.innerWidth) * 40,
        y: 30 + (e.clientY / window.innerHeight) * 40,
      })
    }, 50) // Throttle to 20fps

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isVisible, screenSize])

  const isMobile = screenSize === 'mobile'
  const isTablet = screenSize === 'tablet'
  const isDesktop = screenSize === 'desktop'

  return (
    <div 
      ref={containerRef}
      className={`relative h-full ${
        isMobile 
          ? 'min-h-[360px] overflow-hidden' 
          : isTablet
            ? 'min-h-[500px] overflow-hidden'
            : 'min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden'
      }`}
      style={{ background: 'var(--hero-container-bg)' }}
    >
      {/* Grid Background - pure CSS */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--hero-grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--hero-grid-color) 1px, transparent 1px)
          `,
          backgroundSize: isMobile ? '40px 40px' : isTablet ? '50px 50px' : '60px 60px',
        }}
      />
      
      {/* Mouse-following gradient - CSS transition instead of motion value (desktop only) */}
      {isDesktop && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, var(--hero-grid-color), transparent 60%)`,
          }}
        />
      )}
      
      {/* Ambient glow - responsive sizes */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none z-0 ${
          isMobile 
            ? 'w-[200px] h-[200px]' 
            : isTablet
              ? 'w-[300px] h-[300px]'
              : 'w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px]'
        }`}
        style={{ 
          backgroundColor: 'var(--Controls-Selected)', 
          opacity: 'var(--hero-ambient-opacity)' 
        }}
      />

      {/* Email Cards */}
      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="popLayout">
          {emails.map(email => (
            <EmailCard 
              key={email.id}
              email={email} 
              onMint={handleMint}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* CSS for sparkle animations only */}
      <style>{`
        .sparkle-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
        }
        
        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: var(--mint-success-light);
          border-radius: 50%;
          animation: sparkle-burst 0.6s ease-out forwards;
          animation-delay: var(--delay);
          opacity: 0;
        }
        
        @keyframes sparkle-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) 
                       translateX(calc(cos(var(--angle)) * 35px))
                       translateY(calc(sin(var(--angle)) * 35px))
                       scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) 
                       translateX(calc(cos(var(--angle)) * 35px))
                       translateY(calc(sin(var(--angle)) * 35px))
                       scale(0);
          }
        }
      `}</style>
    </div>
  )
}

export default HeroEmailScatter

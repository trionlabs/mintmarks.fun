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

const MAX_VISIBLE_EMAILS = 9 // 3x3 grid
const SPARKLE_COUNT = 5
const EMAIL_LIFETIME = 16000 // Good rotation speed
const SPAWN_INTERVAL = 2000 // 2s between spawns
const INITIAL_SPAWN_DELAYS = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000] // Fill grid quickly

// Base grid positions - 3x3 matrix with good spacing
// Cards are ~210px wide, container is ~600px = 35% per card
const GRID_SLOTS_BASE = [
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

// Add small random offset for natural look (±2%)
const getRandomizedSlot = (baseSlot: { x: number; y: number }) => ({
  x: baseSlot.x + (Math.random() * 4 - 2),
  y: baseSlot.y + (Math.random() * 4 - 2),
})

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

const getNextAvailableSlot = (existingEmails: ActiveEmail[]) => {
  const occupiedSlots = new Set<number>()
  
  existingEmails.forEach(email => {
    GRID_SLOTS_BASE.forEach((slot, idx) => {
      // Check if this slot area is already taken (with some tolerance for random offset)
      if (Math.abs(slot.x - email.x) < 20 && Math.abs(slot.y - email.startY) < 20) {
        occupiedSlots.add(idx)
      }
    })
  })
  
  for (let i = 0; i < GRID_SLOTS_BASE.length; i++) {
    if (!occupiedSlots.has(i)) {
      return getRandomizedSlot(GRID_SLOTS_BASE[i])
    }
  }
  return null
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
      className="w-[190px] sm:w-[210px]"
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
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-20"
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
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: 'var(--mint-success-gradient)',
                boxShadow: 'var(--mint-success-glow)',
              }}
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                Minted
              </span>
            </div>
            <div 
              className="text-[8px] font-mono text-center mt-1"
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
        className="relative p-3.5 rounded-xl backdrop-blur-md transition-all duration-200"
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
        <div className="flex items-center gap-2.5 relative z-10">
          <div 
            className="p-1.5 rounded-lg shrink-0 transition-colors duration-200"
            style={{ 
              backgroundColor: email.isMinted 
                ? 'var(--mint-success-bg)'
                : isHovered
                  ? 'var(--Controls-Idle)'
                  : 'var(--hero-card-icon-bg)'
            }}
          >
            <Mail 
              className="h-3.5 w-3.5 transition-colors duration-200"
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
              className="text-[9px] font-medium uppercase tracking-wider mb-0.5 truncate transition-colors duration-200"
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
              className="text-[13px] font-medium truncate leading-tight"
              style={{ color: 'var(--page-text-primary)' }}
            >
              {email.subject}
            </div>
          </div>

          {/* Mark It hint */}
          {isHovered && !email.isMinted && (
            <div className="shrink-0 flex items-center gap-1 pl-2 animate-fade-in">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--Controls-Selected)' }} />
              <span 
                className="text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
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
  
  const emailIdRef = useRef(0)
  const templateIndexRef = useRef(0)
  const intervalsRef = useRef<{ spawn?: NodeJS.Timeout; cleanup?: NodeJS.Timeout }>({})

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

  // Spawn email function
  const spawnEmail = useCallback(() => {
    setEmails(prev => {
      const activeEmails = prev.filter(e => Date.now() - e.createdAt < EMAIL_LIFETIME)
      if (activeEmails.length >= MAX_VISIBLE_EMAILS) return activeEmails
      
      const position = getNextAvailableSlot(activeEmails)
      if (!position) return activeEmails

      const template = EMAIL_TEMPLATES[templateIndexRef.current % EMAIL_TEMPLATES.length]
      templateIndexRef.current++
      
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
  }, [])

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

    // Initial spawn with staggered delays
    const timers = INITIAL_SPAWN_DELAYS.map(delay => setTimeout(spawnEmail, delay))
    
    // Continue spawning
    intervalsRef.current.spawn = setInterval(spawnEmail, SPAWN_INTERVAL)
    
    // Cleanup old emails
    intervalsRef.current.cleanup = setInterval(() => {
      setEmails(prev => prev.filter(e => Date.now() - e.createdAt < EMAIL_LIFETIME))
    }, 2000) // Less frequent cleanup
    
    return () => {
      timers.forEach(clearTimeout)
      if (intervalsRef.current.spawn) clearInterval(intervalsRef.current.spawn)
      if (intervalsRef.current.cleanup) clearInterval(intervalsRef.current.cleanup)
    }
  }, [isVisible, spawnEmail])

  // Throttled mouse tracking - only when visible
  useEffect(() => {
    if (!isVisible) return

    const handleMouseMove = throttle((e: MouseEvent) => {
      setMousePos({
        x: 30 + (e.clientX / window.innerWidth) * 40,
        y: 30 + (e.clientY / window.innerHeight) * 40,
      })
    }, 50) // Throttle to 20fps

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isVisible])

  return (
    <div 
      ref={containerRef}
      className="relative h-full min-h-[600px] lg:min-h-[700px] overflow-hidden"
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
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Mouse-following gradient - CSS transition instead of motion value */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, var(--hero-grid-color), transparent 60%)`,
        }}
      />
      
      {/* Ambient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none z-0"
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

/**
 * @fileoverview Hero Email Scatter Animation
 * 
 * Minimal, modern design with smooth CSS animations
 * - No heavy framer-motion animations
 * - CSS-only transitions for performance
 * - Transparent background
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Mail, Sparkles, Share2, MessageCircle, Gift, Users } from 'lucide-react'

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
// Constants
// ============================================

// Post-mint action types
type PostMintActionType = 'share' | 'telegram' | 'discord' | 'claim'
type ActionState = 'idle' | 'loading' | 'success'

interface PostMintAction {
  type: PostMintActionType
  label: string
  successLabel: string
}

// Each brand gets EXACTLY ONE contextually relevant action
const BRAND_ACTION: Record<string, PostMintAction> = {
  // Ownership flex → Share
  Tesla: { type: 'telegram', label: 'Join Owners Club', successLabel: 'Joined' },
  Coinbase: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  Stripe: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  PayPal: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  
  // Event attendance → Community or POAP
  Luma: { type: 'discord', label: 'Join Event DC', successLabel: 'Joined' },
  Devcon: { type: 'claim', label: 'Claim POAP', successLabel: 'Claimed' },
  'ETH Denver': { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  Apple: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  
  // Achievements → Share (Wrapped style)
  Spotify: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  YouTube: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  GitHub: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  Netflix: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  X: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  LinkedIn: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  Substack: { type: 'share', label: 'Share on X', successLabel: 'Posted' },
  
  // Community/Perks
  Figma: { type: 'discord', label: 'Join DC', successLabel: 'Joined' },
  Airbnb: { type: 'claim', label: 'Claim Discount', successLabel: 'Claimed' },
  Binance: { type: 'telegram', label: 'Join TG', successLabel: 'Joined' },
}

// Default action
const DEFAULT_ACTION: PostMintAction = { type: 'share', label: 'Share on X', successLabel: 'Posted' }

// Get THE action for a brand (single action)
const getActionForBrand = (sender: string): PostMintAction => {
  return BRAND_ACTION[sender] || DEFAULT_ACTION
}

// Get icon for action type
const getActionIcon = (type: PostMintActionType) => {
  switch (type) {
    case 'share': return Share2
    case 'telegram': return MessageCircle
    case 'discord': return Users
    case 'claim': return Gift
    default: return Share2
  }
}

const EMAIL_TEMPLATES = [
  { sender: "Substack", subject: "You hit 1K subscribers! 🎉" },
  { sender: "Spotify", subject: "Top 0.01% listener" },
  { sender: "Stripe", subject: "You earned $10K!" },
  { sender: "Airbnb", subject: "You're now a Superhost ⭐" },
  { sender: "GitHub", subject: "100 stars on your repo" },
  { sender: "LinkedIn", subject: "Profile views: 1,000" },
  { sender: "YouTube", subject: "Silver Play Button 🥈" },
  { sender: "X", subject: "10K followers!" },
  { sender: "Luma", subject: "You're approved!" },
  { sender: "Devcon", subject: "Ticket confirmed ✓" },
  { sender: "ETH Denver", subject: "Speaker Invitation!" },
  { sender: "Apple", subject: "WWDC Invitation" },
  { sender: "Coinbase", subject: "You purchased BTC (2014)!" },
  { sender: "Binance", subject: "Position liquidated 💀" },
  { sender: "PayPal", subject: "Money received" },
  { sender: "Netflix", subject: "LOTR: 100 rewatches! 👀" },
  { sender: "Tesla", subject: "You're a Tesla owner!" },
  { sender: "Figma", subject: "You're a Figma Pro!" },
] as const

const MAX_EMAILS = { mobile: 4, tablet: 6, desktop: 9 }
const EMAIL_LIFETIME = 14000
const SPAWN_INTERVAL = 2200

// Grid positions
const GRID_SLOTS = {
  desktop: [
    { x: 2, y: 4 }, { x: 34, y: 8 }, { x: 66, y: 5 },
    { x: 4, y: 36 }, { x: 36, y: 40 }, { x: 64, y: 38 },
    { x: 2, y: 68 }, { x: 34, y: 72 }, { x: 64, y: 70 },
  ],
  tablet: [
    { x: 6, y: 6 }, { x: 52, y: 10 },
    { x: 4, y: 40 }, { x: 54, y: 42 },
    { x: 6, y: 72 }, { x: 52, y: 75 },
  ],
  mobile: [
    { x: 4, y: 10 }, { x: 52, y: 14 },
    { x: 6, y: 56 }, { x: 54, y: 60 },
  ],
} as const

type ScreenSize = 'mobile' | 'tablet' | 'desktop'

const getScreenSize = (w: number): ScreenSize => 
  w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'

// ============================================
// Email Card Component
// ============================================

interface EmailCardProps {
  email: ActiveEmail
  onMint: (id: number) => void
  isExiting: boolean
}

const EmailCard = React.memo(function EmailCard({ email, onMint, isExiting }: EmailCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [actionState, setActionState] = useState<ActionState>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Get THE single action for this brand
  const action = useMemo(() => getActionForBrand(email.sender), [email.sender])
  const Icon = getActionIcon(action.type)
  
  // Trigger confetti when minted
  useEffect(() => {
    if (email.isMinted) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 800)
      return () => clearTimeout(timer)
    }
  }, [email.isMinted])
  
  // Handle action click - simulates the action with loading state
  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Don't do anything if already loading or success
    if (actionState !== 'idle') return
    
    // Set loading state
    setActionState('loading')
    
    // Simulate action completion after a brief delay
    setTimeout(() => {
      setActionState('success')
    }, 350 + Math.random() * 150) // 350-500ms for snappy feel
  }, [actionState])

  return (
    <div
      className={`
        hero-email-card
        absolute w-[185px] sm:w-[205px] md:w-[225px] lg:w-[250px]
        rounded-2xl transition-all duration-300 ease-out
        ${!email.isMinted ? 'cursor-pointer' : ''}
        ${isExiting ? 'hero-card-exit' : 'hero-card-enter'}
        ${email.isMinted ? 'is-minted' : ''}
        ${isHovered ? 'is-hovered' : ''}
      `}
      style={{ 
        left: `${email.x}%`, 
        top: `${email.startY}%`,
        zIndex: isHovered || email.isMinted ? 50 : 10,
        transform: isHovered && !email.isMinted ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !email.isMinted && onMint(email.id)}
    >
      {/* Mini Confetti - appears on mint */}
      {showConfetti && (
        <div className="hero-confetti-container">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`hero-confetti hero-confetti-${i + 1}`}
              style={{ '--delay': `${i * 50}ms` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      
      {/* Minted Badge - compact */}
      {email.isMinted && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 hero-badge-enter">
          <div className="hero-minted-badge px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[8px] font-semibold text-white uppercase tracking-wider">
              Minted
            </span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 sm:p-[18px]">
        <div className="flex items-start gap-3">
          <div className="hero-icon-box p-2.5 rounded-xl shrink-0 transition-colors">
            <Mail className="hero-icon h-4 w-4 transition-colors" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="hero-sender text-[10px] font-medium uppercase tracking-wider mb-1.5 transition-colors">
              {email.sender}
            </div>
            <div className="hero-subject text-[14px] sm:text-[15px] font-medium leading-snug">
              {email.subject}
            </div>
            
            {/* Single Post-Mint Action - shown when minted */}
            {email.isMinted && (
              <div className="hero-actions-enter mt-3">
                <button
                  onClick={handleActionClick}
                  disabled={actionState !== 'idle'}
                  className={`
                    hero-action-btn 
                    ${actionState === 'success' ? 'hero-action-success' : `hero-action-${action.type}`}
                    ${actionState === 'loading' ? 'hero-action-loading' : ''}
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide 
                    transition-all duration-200
                    ${actionState === 'idle' ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {actionState === 'loading' ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="opacity-80">...</span>
                    </>
                  ) : actionState === 'success' ? (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{action.successLabel}</span>
                    </>
                  ) : (
                    <>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{action.label}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mark It Button - with blur background */}
          {isHovered && !email.isMinted && (
            <div className="hero-mark-btn absolute top-3 right-3 px-2.5 py-1.5 rounded-lg hero-fade-in flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span className="text-[9px] font-semibold uppercase tracking-wide">
                Mark It
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================
// Main Component
// ============================================

export const HeroEmailScatter: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [emails, setEmails] = useState<ActiveEmail[]>([])
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set())
  const [isVisible, setIsVisible] = useState(false)
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop')
  
  const emailIdRef = useRef(0)
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Screen size detection
  useEffect(() => {
    const check = () => setScreenSize(getScreenSize(window.innerWidth))
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Get available slot
  const getAvailableSlot = useCallback((existing: ActiveEmail[]) => {
    const slots = GRID_SLOTS[screenSize]
    const occupied = new Set<number>()
    
    existing.forEach(email => {
      slots.forEach((slot, idx) => {
        if (Math.abs(slot.x - email.x) < 18 && Math.abs(slot.y - email.startY) < 18) {
          occupied.add(idx)
        }
      })
    })
    
    const available = slots.map((_, i) => i).filter(i => !occupied.has(i))
    if (!available.length) return null
    
    const idx = available[Math.floor(Math.random() * available.length)]
    const slot = slots[idx]
    return {
      x: slot.x + (Math.random() * 3 - 1.5),
      y: slot.y + (Math.random() * 3 - 1.5),
    }
  }, [screenSize])

  // Spawn email
  const spawnEmail = useCallback(() => {
    setEmails(prev => {
      const active = prev.filter(e => !exitingIds.has(e.id))
      if (active.length >= MAX_EMAILS[screenSize]) return prev
      
      const pos = getAvailableSlot(active)
      if (!pos) return prev

      const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)]
      
      return [...prev, {
        id: emailIdRef.current++,
        sender: template.sender,
        subject: template.subject,
        x: pos.x,
        startY: pos.y,
        createdAt: Date.now(),
        isMinted: false,
      }]
    })
  }, [screenSize, getAvailableSlot, exitingIds])

  // Handle mint
  const handleMint = useCallback((id: number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isMinted: true } : e))
  }, [])

  // Spawn and cleanup
  useEffect(() => {
    if (!isVisible) return

    // Initial spawn burst
    const initialCount = MAX_EMAILS[screenSize]
    for (let i = 0; i < initialCount; i++) {
      setTimeout(spawnEmail, i * 180)
    }

    // Continuous spawning
    const scheduleSpawn = () => {
      const delay = SPAWN_INTERVAL + (Math.random() - 0.5) * 600
      spawnTimeoutRef.current = setTimeout(() => {
        spawnEmail()
        scheduleSpawn()
      }, delay)
    }
    scheduleSpawn()

    // Cleanup old emails with exit animation
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now()
      setEmails(prev => {
        const toExit = prev.filter(e => now - e.createdAt > EMAIL_LIFETIME && !exitingIds.has(e.id))
        if (toExit.length) {
          setExitingIds(ids => {
            const newIds = new Set(ids)
            toExit.forEach(e => newIds.add(e.id))
            return newIds
          })
          // Remove after animation
          setTimeout(() => {
            setEmails(p => p.filter(e => !toExit.some(t => t.id === e.id)))
            setExitingIds(ids => {
              const newIds = new Set(ids)
              toExit.forEach(e => newIds.delete(e.id))
              return newIds
            })
          }, 280)
        }
        return prev
      })
    }, 2500)

    return () => {
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current)
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current)
    }
  }, [isVisible, screenSize, spawnEmail, exitingIds])

  const minHeight = useMemo(() => {
    if (screenSize === 'mobile') return 'min-h-[340px]'
    if (screenSize === 'tablet') return 'min-h-[460px]'
    return 'min-h-[400px] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[680px]'
  }, [screenSize])

  return (
    <div 
      ref={containerRef}
      className={`relative h-full overflow-hidden ${minHeight}`}
      style={{ background: 'transparent' }}
    >
      {/* Email Cards */}
      <div className="absolute inset-0 z-10 px-1 sm:px-3 md:px-4 lg:px-0">
        {emails.map(email => (
          <EmailCard 
            key={email.id}
            email={email} 
            onMint={handleMint}
            isExiting={exitingIds.has(email.id)}
          />
        ))}
      </div>

      {/* CSS Styles - Using CSS Variables & OKLCH */}
      <style>{`
        /* ========== CARD BASE ========== */
        .hero-email-card {
          background: oklch(100% 0 0 / 0.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          box-shadow: 0 1px 2px oklch(0% 0 0 / 0.015);
        }
        .hero-email-card.is-hovered {
          background: oklch(100% 0 0 / 0.82);
          box-shadow: 0 2px 6px oklch(0% 0 0 / 0.03);
        }
        .hero-email-card.is-minted {
          /* Keep neutral background, just add subtle green accent */
          border-color: var(--mint-success);
          box-shadow: 0 0 0 1px var(--mint-success-border), 0 2px 8px oklch(0.65 0.2 145 / 0.12);
        }
        
        /* ========== DARK MODE ========== */
        .dark .hero-email-card {
          background: oklch(100% 0 0 / 0.035);
          border-color: var(--glass-border);
          box-shadow: 0 1px 3px oklch(0% 0 0 / 0.12);
        }
        .dark .hero-email-card.is-hovered {
          background: oklch(100% 0 0 / 0.055);
          box-shadow: 0 2px 8px oklch(0% 0 0 / 0.18);
        }
        .dark .hero-email-card.is-minted {
          /* Keep dark neutral background, subtle green glow */
          border-color: var(--mint-success);
          box-shadow: 0 0 0 1px var(--mint-success-border), 0 2px 12px oklch(0.65 0.2 145 / 0.15);
        }
        
        /* ========== ICON BOX ========== */
        .hero-icon-box {
          background: oklch(0% 0 0 / 0.02);
          border: 1px solid oklch(0% 0 0 / 0.03);
        }
        .hero-email-card.is-minted .hero-icon-box {
          background: oklch(0.65 0.15 145 / 0.1);
          border-color: oklch(0.65 0.15 145 / 0.2);
        }
        .dark .hero-icon-box {
          background: oklch(100% 0 0 / 0.04);
          border-color: oklch(100% 0 0 / 0.05);
        }
        .dark .hero-email-card.is-minted .hero-icon-box {
          background: oklch(0.65 0.15 145 / 0.12);
          border-color: oklch(0.65 0.15 145 / 0.2);
        }
        
        /* ========== ICON ========== */
        .hero-icon {
          color: var(--page-text-muted);
        }
        .hero-email-card.is-minted .hero-icon {
          color: var(--mint-success);
        }
        
        /* ========== TEXT ========== */
        .hero-sender {
          color: var(--page-text-muted);
        }
        .hero-email-card.is-minted .hero-sender {
          color: var(--mint-success);
        }
        
        .hero-subject {
          color: var(--page-text-primary);
        }
        
        /* ========== MINTED BADGE ========== */
        .hero-minted-badge {
          background: var(--mint-success-gradient);
          box-shadow: var(--mint-success-shadow);
        }
        
        /* ========== MARK IT BUTTON ========== */
        .hero-mark-btn {
          background: oklch(0% 0 0 / 0.82);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid oklch(100% 0 0 / 0.06);
          box-shadow: 0 1px 3px oklch(0% 0 0 / 0.08);
          color: oklch(100% 0 0);
        }
        .hero-mark-btn svg {
          color: oklch(100% 0 0 / 0.9);
        }
        .dark .hero-mark-btn {
          background: oklch(100% 0 0 / 0.9);
          border-color: oklch(0% 0 0 / 0.03);
          box-shadow: 0 1px 3px oklch(0% 0 0 / 0.06);
          color: oklch(0% 0 0 / 0.9);
        }
        .dark .hero-mark-btn svg {
          color: oklch(0% 0 0 / 0.8);
        }
        
        /* ========== ANIMATIONS ========== */
        .hero-card-enter {
          animation: heroCardEnter 0.35s ease-out forwards;
        }
        .hero-card-exit {
          animation: heroCardExit 0.28s ease-in forwards;
        }
        .hero-badge-enter {
          animation: heroBadgeEnter 0.3s ease-out forwards;
        }
        .hero-fade-in {
          animation: heroFadeIn 0.15s ease-out forwards;
        }
        
        @keyframes heroCardEnter {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes heroCardExit {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(3px) scale(0.99);
          }
        }
        
        @keyframes heroBadgeEnter {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(3px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        @keyframes heroFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        /* ========== MINI CONFETTI ========== */
        .hero-confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: visible;
          z-index: 30;
        }
        
        .hero-confetti {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 1px;
          animation: heroConfettiBurst 0.7s ease-out forwards;
          animation-delay: var(--delay, 0ms);
        }
        
        /* Position each confetti piece differently */
        .hero-confetti-1 { left: 20%; top: 30%; background: oklch(0.75 0.18 145); }
        .hero-confetti-2 { left: 80%; top: 25%; background: oklch(0.70 0.15 210); border-radius: 50%; }
        .hero-confetti-3 { left: 50%; top: 20%; background: oklch(0.80 0.18 85); }
        .hero-confetti-4 { left: 30%; top: 40%; background: oklch(0.72 0.16 275); border-radius: 50%; }
        .hero-confetti-5 { left: 70%; top: 35%; background: oklch(0.75 0.18 145); }
        .hero-confetti-6 { left: 45%; top: 45%; background: oklch(0.80 0.15 30); border-radius: 50%; }
        
        @keyframes heroConfettiBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: translate(var(--tx, -10px), var(--ty, -20px)) scale(1.2) rotate(90deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx2, -15px), var(--ty2, 10px)) scale(0.5) rotate(180deg);
          }
        }
        
        .hero-confetti-1 { --tx: -25px; --ty: -30px; --tx2: -30px; --ty2: 5px; }
        .hero-confetti-2 { --tx: 25px; --ty: -35px; --tx2: 35px; --ty2: 10px; }
        .hero-confetti-3 { --tx: 5px; --ty: -40px; --tx2: 8px; --ty2: -10px; }
        .hero-confetti-4 { --tx: -20px; --ty: -15px; --tx2: -25px; --ty2: 15px; }
        .hero-confetti-5 { --tx: 20px; --ty: -20px; --tx2: 28px; --ty2: 8px; }
        .hero-confetti-6 { --tx: 0px; --ty: -25px; --tx2: 5px; --ty2: 5px; }
        
        /* ========== POST-MINT ACTION ========== */
        .hero-actions-enter {
          animation: heroActionsEnter 0.35s ease-out forwards;
        }
        
        @keyframes heroActionsEnter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hero-action-btn {
          background: oklch(0% 0 0 / 0.06);
          border: 1px solid oklch(0% 0 0 / 0.08);
          color: var(--page-text-secondary);
        }
        .hero-action-btn:hover:not(:disabled) {
          background: oklch(0% 0 0 / 0.10);
        }
        
        /* Loading state - subtle pulse */
        .hero-action-loading {
          opacity: 0.85;
        }
        
        /* Success state - universal green with pop animation */
        .hero-action-success {
          background: var(--mint-success) !important;
          border-color: var(--mint-success-border) !important;
          color: oklch(0.98 0 0) !important;
          animation: heroActionSuccess 0.35s ease-out forwards;
        }
        
        @keyframes heroActionSuccess {
          0% { transform: scale(1); }
          40% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        /* Share on X - Theme neutral glassmorphic */
        .hero-action-share {
          background: var(--glass-bg-primary);
          border-color: var(--glass-border);
          color: var(--page-text-primary);
        }
        .hero-action-share:hover:not(:disabled) {
          background: var(--glass-bg-hover);
          border-color: var(--glass-border-hover);
        }
        
        /* Telegram - Primary theme color */
        .hero-action-telegram {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--primary-foreground);
        }
        .hero-action-telegram:hover:not(:disabled) {
          background: var(--ring);
          border-color: var(--ring);
        }
        
        /* Discord - Secondary theme color */
        .hero-action-discord {
          background: var(--secondary);
          border-color: var(--border);
          color: var(--secondary-foreground);
        }
        .hero-action-discord:hover:not(:disabled) {
          background: var(--accent);
          border-color: var(--border);
        }
        
        /* Claim/POAP - Accent/warm tone */
        .hero-action-claim {
          background: var(--status-pending-bg);
          border-color: var(--status-pending-border);
          color: var(--status-pending);
        }
        .hero-action-claim:hover:not(:disabled) {
          background: var(--status-pending);
          border-color: var(--status-pending);
          color: var(--primary-foreground);
        }
        
        /* Dark mode success - keep green */
        .dark .hero-action-success {
          background: var(--mint-success) !important;
          color: oklch(0.98 0 0) !important;
        }
      `}</style>
    </div>
  )
}

export default HeroEmailScatter

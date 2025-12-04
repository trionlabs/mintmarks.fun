import { useMemo, useState, useEffect, memo } from 'react'
import { 
  // Email & Communication
  Mail, 
  MailOpen,
  Send,
  Inbox,
  AtSign,
  // Events & Calendar
  Calendar, 
  CalendarCheck,
  Ticket, 
  PartyPopper,
  // Content & Media
  BookOpen, 
  Bookmark,
  FileText,
  // Shopping & Commerce  
  Package,
  Gift,
  ShoppingBag,
  // Blockchain & Crypto
  Fingerprint,
  Shield,
  Link2,
  Key,
  Lock,
  Coins,
  Wallet,
  // Achievement & Recognition
  Award,
  Trophy,
  Star,
  Crown,
  Gem,
  BadgeCheck,
  // Misc
  Sparkles,
  Zap,
  Heart,
  Bell,
  Rocket,
  Users,
  Globe,
  Check,
} from 'lucide-react'

/**
 * SpiralEmailBackground - Minimal & Optimized
 * 
 * CSS-only hover detection via :has() selector.
 * Diverse icons representing email → blockchain journey.
 */

// Grouped by theme for variety
const ICONS = [
  // Email journey
  Mail, MailOpen, Send, Inbox, AtSign,
  // Events
  Calendar, CalendarCheck, Ticket, PartyPopper,
  // Content
  BookOpen, Bookmark, FileText,
  // Commerce
  Package, Gift, ShoppingBag,
  // Blockchain/NFT
  Fingerprint, Shield, Link2, Key, Lock, Coins, Wallet,
  // Achievement
  Award, Trophy, Star, Crown, Gem, BadgeCheck,
  // Magic
  Sparkles, Zap, Heart, Bell, Rocket, Users, Globe, Check,
]

interface IconData {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  Icon: typeof Mail
  delay: number
}

interface SpiralCirclesBackgroundProps {
  /** Number of icons to display in the spiral pattern */
  count?: number
  /** Animation speed - lower is slower (seconds for full rotation) */
  speed?: number
  /** Pause the animation (e.g., when modal is open) */
  paused?: boolean
}

function SpiralCirclesBackgroundInner({ 
  count = 80, 
  speed = 0.5, 
  paused = false 
}: SpiralCirclesBackgroundProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibility = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Calculate animation duration based on speed (inverse relationship)
  const animationDuration = Math.round(90 / speed)

  // Generate spiral positions with golden angle distribution
  const icons = useMemo<IconData[]>(() => {
    const goldenAngle = 137.5 * (Math.PI / 180)
    return Array.from({ length: count }, (_, i) => {
      const angle = i * goldenAngle
      const radius = Math.sqrt(i) * 15
      return {
        id: i,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        size: 24 + (i % 4) * 6, // 24-42px
        opacity: 0.12 + (i % 5) * 0.03, // 0.12-0.24 (slightly more visible)
        Icon: ICONS[i % ICONS.length],
        delay: (i * 0.15) % 3, // Staggered animation
      }
    })
  }, [count])

  const shouldAnimate = !paused && isVisible

  return (
    <div 
      className="spiral-bg fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="spiral-layer absolute inset-0"
        style={{
          animation: shouldAnimate ? `spiral-rotate ${animationDuration}s linear infinite` : 'none',
          transformOrigin: '50% 50%',
          willChange: shouldAnimate ? 'transform' : 'auto',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        {icons.map(({ id, x, y, size, opacity, Icon, delay }) => (
          <div
            key={id}
            className="spiral-icon absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              opacity,
              transform: 'translate(-50%, -50%) translateZ(0)', // GPU acceleration
              animationDelay: `${delay}s`,
              willChange: shouldAnimate ? 'transform' : 'auto',
            }}
          >
            <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
          </div>
        ))}
      </div>
    </div>
  )
}

export const SpiralCirclesBackground = memo(SpiralCirclesBackgroundInner)
export default SpiralCirclesBackground

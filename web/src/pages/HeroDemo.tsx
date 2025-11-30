/**
 * HeroDemo - Demonstrates the new hero glassmorphic theme
 * 
 * This page showcases:
 * - HeroSection with DashedGrid and MouseSpotlight
 * - Hero glass cards (hero, hero-glow, hero-outline variants)
 * - Hero buttons (hero, hero-outline, hero-glass variants)
 * - Typography and layout patterns
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Mail, 
  Ticket, 
  Receipt, 
  Bell, 
  Heart, 
  Sparkles,
  Check
} from 'lucide-react'
import { HeroSection } from '@/components/ui/hero-section'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ============================================
// Demo Email Card Data
// ============================================
const demoEmails = [
  { sender: 'Luma', subject: 'Thanks for joining The Zama World\'s Fair', type: 'event', status: 'Attended' },
  { sender: 'Coinbase', subject: 'Your balance sheet is ready', type: 'finance', status: 'Confirmed' },
  { sender: 'Substack', subject: 'Bankless Daily Newsletter', type: 'newsletter', status: 'Subscribed' },
  { sender: 'Devcon', subject: 'Ticket #4021 Confirmed', type: 'event', status: 'Confirmed' },
]

const getIconForType = (type: string) => {
  switch (type) {
    case 'event': return <Ticket className="h-5 w-5" />
    case 'finance': return <Receipt className="h-5 w-5" />
    case 'newsletter': return <Mail className="h-5 w-5" />
    case 'social': return <Heart className="h-5 w-5" />
    case 'alert': return <Bell className="h-5 w-5" />
    default: return <Mail className="h-5 w-5" />
  }
}

const getIconBgForType = (type: string) => {
  switch (type) {
    case 'event': return 'var(--hero-icon-bg-red)'
    case 'finance': return 'var(--hero-icon-bg-yellow)'
    case 'newsletter': return 'var(--hero-icon-bg-blue)'
    case 'social': return 'var(--hero-icon-bg-pink)'
    case 'alert': return 'var(--hero-icon-bg-orange)'
    default: return 'var(--hero-icon-bg-blue)'
  }
}

// ============================================
// Demo Email Card Component
// ============================================
function DemoEmailCard({ email, index }: { email: typeof demoEmails[0], index: number }) {
  const [isMinted, setIsMinted] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        variant={isMinted ? 'hero-glow' : 'hero'} 
        className="cursor-pointer"
        onClick={() => setIsMinted(!isMinted)}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: getIconBgForType(email.type) }}
            >
              {getIconForType(email.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span 
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    background: 'var(--hero-glass-bg)',
                    border: '1px solid var(--hero-glass-border)',
                  }}
                >
                  {email.sender}
                </span>
                <span 
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: 'rgb(134, 239, 172)',
                  }}
                >
                  {email.status}
                </span>
              </div>
              
              {/* Subject */}
              <h3 
                className="font-semibold text-lg truncate"
                style={{ color: 'var(--hero-text-primary)' }}
              >
                {email.subject}
              </h3>
              
              {/* Date */}
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--hero-text-muted)' }}
              >
                Tue, Nov 18, 2025
              </p>
            </div>
            
            {/* Mint Status */}
            <div className="flex-shrink-0">
              {isMinted ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'var(--mint-success-gradient)',
                    boxShadow: 'var(--mint-success-glow)',
                  }}
                >
                  <Check className="h-5 w-5 text-white" />
                </motion.div>
              ) : (
                <Button variant="hero" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Mark It
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================
// Main Demo Page
// ============================================
export function HeroDemo() {
  return (
    <HeroSection 
      showGrid 
      showSpotlight 
      showDecorative
      minHeight="min-h-screen"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* LEFT COLUMN: Typography */}
        <div className="relative z-10 flex flex-col justify-center p-8 md:p-16 lg:p-24">
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-12"
            style={{ color: 'var(--hero-text-primary)' }}
          >
            Every<br />
            <span style={{ color: 'var(--hero-text-secondary)' }}>Email</span><br />
            Tells a<br />
            Story.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-lg"
          >
            <p 
              className="text-xl font-light leading-relaxed mb-10"
              style={{ color: 'var(--hero-text-secondary)' }}
            >
              Your inbox is a treasure map. Unlock the hidden value in your 
              history, connections, and commitments.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="gap-4">
                Start Transformation
                <div 
                  className="p-2 rounded-full"
                  style={{ background: 'rgba(30, 64, 175, 1)' }}
                >
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </Button>
              
              <Button variant="hero-outline" size="lg">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Demo Cards */}
        <div 
          className="relative hidden lg:flex flex-col justify-center p-8 md:p-12 lg:p-16 gap-4"
          style={{ 
            background: 'linear-gradient(180deg, rgba(30, 64, 175, 0.5) 0%, rgba(29, 78, 216, 0.3) 100%)',
            borderLeft: '1px solid var(--hero-glass-border)',
          }}
        >
          <div className="space-y-4">
            <h2 
              className="text-2xl font-bold mb-6"
              style={{ color: 'var(--hero-text-primary)' }}
            >
              Your Memories, Minted
            </h2>
            
            {demoEmails.map((email, i) => (
              <DemoEmailCard key={i} email={email} index={i} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Button Showcase Section */}
      <div 
        className="relative z-10 py-16 px-8 md:px-16"
        style={{ 
          background: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid var(--hero-glass-border)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl font-bold mb-8 text-center"
            style={{ color: 'var(--hero-text-primary)' }}
          >
            Button Variants
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2">
              <Button variant="hero">Hero Primary</Button>
              <span className="text-xs" style={{ color: 'var(--hero-text-muted)' }}>variant="hero"</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Button variant="hero-outline">Hero Outline</Button>
              <span className="text-xs" style={{ color: 'var(--hero-text-muted)' }}>variant="hero-outline"</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Button variant="hero-glass">Hero Glass</Button>
              <span className="text-xs" style={{ color: 'var(--hero-text-muted)' }}>variant="hero-glass"</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Button variant="hero-glass" size="icon">
                <Sparkles className="h-5 w-5" />
              </Button>
              <span className="text-xs" style={{ color: 'var(--hero-text-muted)' }}>size="icon"</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Showcase Section */}
      <div 
        className="relative z-10 py-16 px-8 md:px-16"
        style={{ borderTop: '1px solid var(--hero-glass-border)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl font-bold mb-8 text-center"
            style={{ color: 'var(--hero-text-primary)' }}
          >
            Card Variants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Card variant="hero">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                    Hero Card
                  </h3>
                  <p style={{ color: 'var(--hero-text-muted)' }}>
                    Basic glassmorphic card with white/transparent styling.
                  </p>
                </CardContent>
              </Card>
              <span className="text-xs block text-center" style={{ color: 'var(--hero-text-muted)' }}>
                variant="hero"
              </span>
            </div>
            
            <div className="space-y-2">
              <Card variant="hero-glow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                    Hero Glow
                  </h3>
                  <p style={{ color: 'var(--hero-text-muted)' }}>
                    Card with animated glow effect on hover.
                  </p>
                </CardContent>
              </Card>
              <span className="text-xs block text-center" style={{ color: 'var(--hero-text-muted)' }}>
                variant="hero-glow"
              </span>
            </div>
            
            <div className="space-y-2">
              <Card variant="hero-outline">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                    Hero Outline
                  </h3>
                  <p style={{ color: 'var(--hero-text-muted)' }}>
                    Transparent with white border, subtle glass.
                  </p>
                </CardContent>
              </Card>
              <span className="text-xs block text-center" style={{ color: 'var(--hero-text-muted)' }}>
                variant="hero-outline"
              </span>
            </div>
          </div>
        </div>
      </div>
    </HeroSection>
  )
}

export default HeroDemo


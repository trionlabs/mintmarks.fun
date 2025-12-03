import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet, ConnectWalletModal } from '@/wallet'
import {
  Sparkles,
  Mail,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { HeroEmailScatter } from '@/components/HeroEmailScatter'
import { HowItWorksSection } from '@/components/HowItWorksSection'
import { HowWeProveSection } from '@/components/HowWeProveSection'
import { WhatYouCanDoSection } from '@/components/WhatYouCanDoSection'
import { ScrollIndicator } from '@/components/ScrollIndicator'
import { ScrollDownIndicator } from '@/components/ScrollDownIndicator'
import { SectionDivider } from '@/components/SectionDivider'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

// Section configuration for scroll indicator and keyboard navigation
const HOMEPAGE_SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'how-we-prove', label: 'How We Prove' },
  { id: 'whats-possible', label: "What's Possible" },
]

// Key for tracking first Gmail connection redirect
const FIRST_GMAIL_REDIRECT_KEY = 'mintmarks_first_gmail_redirected'

export function Home() {
  const navigate = useNavigate()
  const { isAuthenticated: isGmailConnected, login: gmailLogin, isLoading: isAuthLoading } = useAuth()
  const { isConnected: isWalletConnected } = useWallet()

  // Track previous Gmail connection state for detecting first connect
  const wasGmailConnectedRef = useRef<boolean | null>(null)

  // Check if user is fully connected (both Gmail and Wallet)
  const isFullyConnected = isGmailConnected && isWalletConnected

  // First Gmail connection redirect
  useEffect(() => {
    // Skip if auth is still loading (initial mount)
    if (isAuthLoading) return

    // Initialize ref on first non-loading render
    if (wasGmailConnectedRef.current === null) {
      wasGmailConnectedRef.current = isGmailConnected
      return
    }

    // Detect state transition: false → true (just connected)
    const justConnected = !wasGmailConnectedRef.current && isGmailConnected

    // Update ref for next render
    wasGmailConnectedRef.current = isGmailConnected

    if (justConnected) {
      // Check if this is the first ever Gmail connection
      const hasRedirectedBefore = localStorage.getItem(FIRST_GMAIL_REDIRECT_KEY)
      
      if (!hasRedirectedBefore) {
        // First time! Set flag and redirect
        localStorage.setItem(FIRST_GMAIL_REDIRECT_KEY, 'true')
        navigate('/create')
      }
    }
  }, [isGmailConnected, isAuthLoading, navigate])

  // Mark type selection (standard or unique)
  const [markType, setMarkType] = useState<'standard' | 'unique'>('unique')

  // Text rotation states
  const commitments = [
    'That Event You Attended 🎟️',
    'That Newsletter You Subscribed To 📩',
    'That Community You Joined 🤝',
    'That Thing You Purchased 🛍️',
  ]
  const [commitmentIndex, setCommitmentIndex] = useState(0)

  const unlockOptions = ['Airdrops', 'Communities', 'Perks', 'Access', 'Opportunities']
  const [unlockIndex, setUnlockIndex] = useState(0)

  // Rotate commitments every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCommitmentIndex((prev) => (prev + 1) % commitments.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [commitments.length])

  // Rotate unlock options every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUnlockIndex((prev) => (prev + 1) % unlockOptions.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [unlockOptions.length])

  // Enable keyboard navigation between sections
  useKeyboardNavigation({
    sections: HOMEPAGE_SECTIONS,
    enabled: true,
    scrollOffset: 64, // 4rem header height
  })

  return (
    <>
      {/* Scroll Progress Indicator - Floating Navigation */}
      <ScrollIndicator sections={HOMEPAGE_SECTIONS} />

      {/* Hero Section - Full Width Split Layout */}
      <section id="hero" className="home-section relative w-full min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)] overflow-visible">
        {/* Subtle gradient overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'var(--hero-gradient-overlay)',
          }}
        />
        {/* Container - optimized for MacBook screens (max-w-7xl = 1280px) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-0 lg:min-h-[calc(100vh-4rem)] relative z-10">
          {/* Grid: Left wider on lg, narrower on xl+ */}
          {/* Mobile: 1 col, lg: 5/12 + 7/12, xl: 4/12 + 8/12 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-[calc(100vh-4rem)]">
            {/* Left Column: Content - wider on lg (5 cols), narrower on xl (4 cols) */}
            <div
              className="relative z-20 flex items-center py-8 sm:py-12 md:py-16 lg:py-20 lg:col-span-5 xl:col-span-4"
            >
              <div className="w-full">
                {/* Badge */}
                <div
                  className="glass-badge inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 md:mb-8 transition-all duration-300 hero-animate-slide-up"
                >
                  <Sparkles
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 glass-text-primary transition-all duration-300 hero-sparkle-icon"
                  />
                  <span className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-wider glass-text-primary">
                    Powered by{' '}
                    <a
                      href="https://zk.email/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-80 transition-opacity"
                    >
                      ZK-Email
                    </a>{' '}
                    &{' '}
                    <a
                      href="https://zkpassport.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-80 transition-opacity"
                    >
                      ZK-Passport
                    </a>
                  </span>
                </div>

                {/* Hero Content - New Hierarchy */}
                <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                  {/* h2: Story */}
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                    <h2
                      className="glass-text-secondary text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-relaxed hero-animate-slide-up hero-delay-100"
                    >
                      Every Email In Your Inbox Tells A Story.
                    </h2>

                    {/* Rotating commitments */}
                    <div
                      className="glass-text-secondary text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-relaxed hero-animate-slide-up hero-delay-150 min-h-[1.5em] relative"
                    >
                      <div className="hero-rotate-wrapper">
                        {commitments.map((commitment, index) => (
                          <span
                            key={index}
                            className={`hero-rotate-item ${index === commitmentIndex ? 'active' : 'inactive'
                              }`}
                          >
                            {commitment}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Value Proposition - Improved Hierarchy */}
                  <div className="space-y-3 sm:space-y-4 md:space-y-5">
                    {/* h3: Combined Title */}
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-[1.15] tracking-tight hero-animate-slide-up hero-delay-400 flex flex-col gap-0.5 sm:gap-1">
                      <span className="glass-text-primary">Turn E-mails into</span>
                      <span className="glass-text-primary">Private Onchain</span>
                      <span 
                        className="light:text-[var(--status-success)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
                      >Marks</span>
                    </h3>

                    {/* Secondary Line */}
                    <p className="glass-text-secondary text-xs sm:text-sm md:text-base lg:text-lg font-medium hero-animate-slide-up hero-delay-500">
                      to Unlock{' '}<span className="hero-gradient-text font-semibold ml-1">{unlockOptions[unlockIndex]}</span>
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-9 lg:mt-10">
                  {isFullyConnected ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/create')}
                      className="gap-2 w-full sm:w-auto"
                    >
                      Create Your First Mark
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      {!isGmailConnected ? (
                        <Button size="lg" onClick={gmailLogin} className="gap-2 w-full sm:w-auto">
                          <Mail className="h-5 w-5" />
                          Connect Gmail
                        </Button>
                      ) : (
                        <ConnectWalletModal
                          trigger={
                            <Button size="lg" className="gap-2 w-full sm:w-auto">
                              <Wallet className="h-5 w-5" />
                              Connect Wallet
                            </Button>
                          }
                        />
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto"
                  >
                    How It Works
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Email Scatter - narrower on lg (7 cols), wider on xl (8 cols) */}
            <div className="hidden lg:block relative lg:col-span-7 xl:col-span-8 overflow-visible">
              {/* Overflow container - cards can spill out - push more to right on lg */}
              <div 
                className="absolute inset-0 lg:pl-12 xl:pl-8 overflow-visible z-10"
                style={{ right: '-4rem', width: 'calc(100% + 4rem)' }}
              >
                <HeroEmailScatter />
              </div>
            </div>
          </div>

          {/* Mobile & Tablet: Compact Email Scatter below hero content */}
          <div className="lg:hidden pb-6 sm:pb-8 pt-4 sm:pt-6">
            <div className="max-w-md sm:max-w-3xl mx-auto">
              <HeroEmailScatter />
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <ScrollDownIndicator targetId="how-it-works" />
      </section>

      {/* Divider: Hero → How It Works */}
      <SectionDivider variant="gradient" className="my-4 sm:my-6 md:my-8" />

      {/* How It Works Section */}
      <HowItWorksSection markType={markType} onMarkTypeChange={setMarkType} />

      {/* Divider: How It Works → How We Prove */}
      <SectionDivider variant="dots" className="my-4 sm:my-6 md:my-8" />

      {/* How We Prove Section */}
      <HowWeProveSection />

      {/* Divider: How We Prove → What's Possible */}
      <SectionDivider variant="gradient" className="my-4 sm:my-6 md:my-8" />

      {/* What You Can Do More Section */}
      <WhatYouCanDoSection />
    </>
  )
}

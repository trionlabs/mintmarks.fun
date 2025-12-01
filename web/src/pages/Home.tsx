import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet, ConnectWalletModal } from '@/wallet'
import {
  Sparkles,
  Mail,
  Wallet,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'
import { HeroEmailScatter } from '@/components/HeroEmailScatter'

export function Home() {
  const navigate = useNavigate()
  const { isAuthenticated: isGmailConnected, login: gmailLogin } = useAuth()
  const { isConnected: isWalletConnected } = useWallet()

  // Check if user is fully connected (both Gmail and Wallet)
  const isFullyConnected = isGmailConnected && isWalletConnected

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

  return (
    <>
      {/* Hero Section - Full Width Split Layout */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] overflow-visible">
        {/* Container - same as header for alignment */}
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
          {/* Grid: Left narrower (5/12), Right wider (7/12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
            {/* Left Column: Content - narrower (5 columns) */}
            <div
              className="relative z-20 flex items-center py-12 lg:py-20 lg:col-span-5"
            >
              <div className="max-w-lg">
                {/* Badge */}
                <div
                  className="glass-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 sm:mb-7 md:mb-8 transition-all duration-300 hero-animate-slide-up"
                >
                  <Sparkles
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 glass-text-primary transition-all duration-300 hero-sparkle-icon"
                  />
                  <span className="text-xs sm:text-sm font-semibold tracking-wider glass-text-primary">
                    Powered by{' '}
                    <a
                      href="https://zk.email/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-80 transition-opacity"
                    >
                      ZK-Email
                    </a>{' '}
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
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* h2: Story */}
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                    <h2
                      className="glass-text-primary opacity-90 text-base sm:text-lg md:text-xl font-normal leading-relaxed hero-animate-slide-up hero-delay-100"
                    >
                      Every Email In Your Inbox Tells A Story.
                    </h2>

                    {/* Rotating commitments */}
                    <div
                      className="glass-text-primary opacity-90 text-base sm:text-lg md:text-xl font-normal leading-relaxed hero-animate-slide-up hero-delay-150 min-h-[1.5em] relative"
                    >
                      <div className="hero-rotate-wrapper">
                        {commitments.map((commitment, index) => (
                          <span
                            key={index}
                            className={`hero-rotate-item font-normal ${index === commitmentIndex ? 'active' : 'inactive'
                              }`}
                          >
                            {commitment}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Value Proposition - Improved Hierarchy */}
                  <div className="space-y-5">
                    {/* h3: Combined Title */}
                    <h3 className="glass-text-primary text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight hero-animate-slide-up hero-delay-400 flex flex-col gap-1">
                      <span>Turn E-mails into</span>
                      <span>Private Onchain</span>
                      <span>Marks</span>
                    </h3>

                    {/* Secondary Line */}
                    <p className="glass-text-secondary text-base sm:text-lg md:text-xl font-light hero-animate-slide-up hero-delay-500">
                      to Unlock{' '}<span className="hero-gradient-text font-semibold ml-1">{unlockOptions[unlockIndex]}</span>
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-start gap-4 mt-8 sm:mt-9 md:mt-10">
                  {isFullyConnected ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/create')}
                      className="gap-2"
                    >
                      Create Your First Mark
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      {!isGmailConnected ? (
                        <Button size="lg" onClick={gmailLogin} className="gap-2">
                          <Mail className="h-5 w-5" />
                          Connect Gmail
                        </Button>
                      ) : (
                        <ConnectWalletModal
                          trigger={
                            <Button size="lg" className="gap-2">
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
                  >
                    How It Works
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Email Scatter - wider (7 columns), overflow allowed */}
            <div className="hidden lg:block relative lg:col-span-7 overflow-visible">
              {/* Overflow container - cards can spill out */}
              <div className="absolute inset-0 -left-12 -right-8 overflow-visible z-10">
                <HeroEmailScatter />
              </div>
            </div>
          </div>

          {/* Mobile & Tablet: Compact Email Scatter below hero content */}
          <div className="lg:hidden pb-8">
            <div className="max-w-md sm:max-w-3xl mx-auto">
              <HeroEmailScatter />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="glass-text-primary text-2xl sm:text-3xl font-bold mb-4">
            Why MintMarks?
          </h2>
          <p className="glass-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
            Transform your digital commitments into verifiable on-chain credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="glass-icon-box">
                <Shield className="h-6 w-6 glass-text-secondary" />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Privacy First
              </h3>
              <p className="glass-text-secondary text-sm">
                Zero-knowledge proofs verify your attendance without revealing
                your email content.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="glass-icon-box">
                <Zap className="h-6 w-6 glass-text-secondary" />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Fast & Cheap
              </h3>
              <p className="glass-text-secondary text-sm">
                Mint on Base L2 for minimal gas fees and instant confirmations.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="glass-icon-box">
                <Sparkles className="h-6 w-6 glass-text-secondary" />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Unique Collectibles
              </h3>
              <p className="glass-text-secondary text-sm">
                Each Mark is a unique NFT representing your real-world
                commitments.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}

import { useNavigate } from 'react-router-dom'
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

  return (
    <>
      {/* Hero Section - Full Width Split Layout */}
      <section className="relative w-full min-h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Left Column: Content - aligned with header using calc */}
          <div 
            className="relative z-10 flex items-center py-12 lg:py-20"
            style={{
              paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2 + 2rem))',
              paddingRight: '1.5rem',
            }}
          >
            <div className="max-w-xl">
              {/* Badge */}
              <div className="glass-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 sm:mb-7 md:mb-8">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 glass-text-primary" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase glass-text-primary" style={{ letterSpacing: '0.05em' }}>
                  Own Your Commitments
                </span>
              </div>

              {/* Main Title */}
              <h1 className="glass-text-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 sm:mb-6 md:mb-7 leading-[1.15] tracking-tight">
                Marks of Your Commitments.
                <span className="block mt-2 sm:mt-3 text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--Controls-Selected)]">
                  Unlocked.
                </span>
              </h1>

              {/* Description */}
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <p className="glass-text-secondary text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                  Every email in your inbox tells a story. That event you attended. 
                  That newsletter you subscribed to. That community you joined.
                </p>
                <p className="glass-text-secondary text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                  Transform these digital commitments into permanent, on-chain Marks using{' '}
                  <span className="font-semibold glass-text-primary">
                    zero-knowledge proofs
                  </span>
                  .
                </p>

                {/* CTA Text */}
                <p className="glass-text-primary text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight pt-1 sm:pt-2">
                  Transform. Build. Connect.
                </p>
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
                  onClick={() => navigate('/marks')}
                >
                  View My Marks
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Email Scatter - Interactive (Desktop only) */}
          <div className="hidden lg:block relative">
            <HeroEmailScatter />
          </div>
        </div>

        {/* Mobile & Tablet: Compact Email Scatter below hero content */}
        <div className="lg:hidden px-4 pb-8">
          <div className="max-w-md sm:max-w-3xl mx-auto">
            <HeroEmailScatter />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
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
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-[var(--Controls-Idle)]">
                <Shield className="h-6 w-6 text-[var(--Controls-Selected)]" />
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
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-[var(--Controls-Idle)]">
                <Zap className="h-6 w-6 text-[var(--Controls-Selected)]" />
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
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-[var(--Controls-Idle)]">
                <Sparkles className="h-6 w-6 text-[var(--Controls-Selected)]" />
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

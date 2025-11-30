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
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 sm:mb-10 md:mb-12 border backdrop-blur-md"
                style={{
                  backgroundColor: 'var(--page-badge-bg)',
                  borderColor: 'var(--page-badge-border)',
                }}
              >
                <Sparkles
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  style={{ color: 'var(--page-text-primary)' }}
                />
                <span
                  className="text-xs sm:text-sm font-semibold tracking-wide uppercase"
                  style={{ color: 'var(--page-text-primary)', letterSpacing: '0.05em' }}
                >
                  Own Your Commitments
                </span>
              </div>

              {/* Main Title (Original) */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 md:mb-10 leading-[1.1] tracking-tight"
                style={{ color: 'var(--page-text-primary)' }}
              >
                Marks of Your Life.
                <span className="block mt-3 sm:mt-4" style={{ color: 'var(--Controls-Selected)' }}>
                  Unlocked.
                </span>
              </h1>

              {/* Description (Original) */}
              <div className="space-y-6 sm:space-y-8">
                <p
                  className="text-base sm:text-lg md:text-xl font-medium leading-relaxed"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Every email in your inbox tells a story. That event you attended. 
                  That newsletter you subscribed to. That community you joined.
                </p>
                <p
                  className="text-base sm:text-lg md:text-xl font-medium leading-relaxed"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Transform these digital commitments into permanent, on-chain Marks using{' '}
                  <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                    zero-knowledge proofs
                  </span>
                  .
                </p>

                {/* CTA Text */}
                <p
                  className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight pt-2"
                  style={{ color: 'var(--page-text-primary)' }}
                >
                  Transform. Build. Connect.
                </p>
              </div>

              {/* CTA Buttons (Original) */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mt-10 sm:mt-12">
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

          {/* Right Column: Email Scatter - Interactive */}
          <div className="hidden lg:block relative">
            <HeroEmailScatter />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Why MintMarks?
          </h2>
          <p 
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--page-text-secondary)' }}
          >
            Transform your digital commitments into verifiable on-chain credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardContent className="pt-6">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'var(--Controls-Idle)' }}
              >
                <Shield className="h-6 w-6 text-[var(--Controls-Selected)]" />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: 'var(--page-text-primary)' }}
              >
                Privacy First
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                Zero-knowledge proofs verify your attendance without revealing
                your email content.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'var(--Controls-Idle)' }}
              >
                <Zap className="h-6 w-6 text-[var(--Controls-Selected)]" />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: 'var(--page-text-primary)' }}
              >
                Fast & Cheap
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                Mint on Base L2 for minimal gas fees and instant confirmations.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'var(--Controls-Idle)' }}
              >
                <Sparkles className="h-6 w-6 text-[var(--Controls-Selected)]" />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: 'var(--page-text-primary)' }}
              >
                Unique Collectibles
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-secondary)' }}
              >
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

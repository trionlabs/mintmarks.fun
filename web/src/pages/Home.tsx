import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
  CheckCircle,
} from 'lucide-react'

export function Home() {
  const navigate = useNavigate()
  const { isAuthenticated: isGmailConnected, login: gmailLogin } = useAuth()
  const { isConnected: isWalletConnected } = useWallet()

  // Check if user is fully connected (both Gmail and Wallet)
  const isFullyConnected = isGmailConnected && isWalletConnected

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 sm:px-6 sm:pt-12 md:pt-16 lg:pt-20">
      {/* Hero */}
      <header className="mb-16 sm:mb-20 md:mb-24 lg:mb-28 text-center">
        <div className="max-w-4xl mx-auto">
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

          {/* Main Title */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 md:mb-10 leading-[1.1] tracking-tight"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Marks of Your Life.
            <span className="block mt-3 sm:mt-4" style={{ color: 'var(--Controls-Selected)' }}>
              Unlocked.
            </span>
          </h1>

          {/* Description */}
          <p
            className="text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12"
            style={{ color: 'var(--page-text-secondary)' }}
          >
            Transform your email event confirmations into verified NFT
            collectibles using{' '}
            <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              zero-knowledge proofs
            </span>
            .
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              onClick={() => navigate('/create')}
            >
              Learn More
            </Button>
          </div>

          {/* CTA Text */}
          <p
            className="text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight mt-10 sm:mt-12"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Transform. Build. Connect.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-16 sm:space-y-20">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Connect your accounts to start minting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Gmail */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{
              background: isGmailConnected
                ? 'var(--glass-bg-primary)'
                : 'transparent',
              border: `1px solid ${isGmailConnected ? 'var(--Controls-Selected)' : 'var(--glass-border)'}`,
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                background: isGmailConnected
                  ? 'var(--Controls-Selected)'
                  : 'var(--glass-bg-secondary)',
              }}
            >
              {isGmailConnected ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Mail
                  className="h-5 w-5"
                  style={{ color: 'var(--page-text-secondary)' }}
                />
              )}
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold"
                style={{ color: 'var(--page-text-primary)' }}
              >
                1. Connect Gmail
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                {isGmailConnected
                  ? 'Gmail connected - Ready to fetch your event emails'
                  : 'Allow access to read your event confirmation emails'}
              </p>
            </div>
            {!isGmailConnected && (
              <Button variant="outline" size="sm" onClick={gmailLogin}>
                Connect
              </Button>
            )}
          </div>

          {/* Step 2: Wallet */}
          <div
            className="flex items-center gap-4 p-4 rounded-lg"
            style={{
              background: isWalletConnected
                ? 'var(--glass-bg-primary)'
                : 'transparent',
              border: `1px solid ${isWalletConnected ? 'var(--Controls-Selected)' : 'var(--glass-border)'}`,
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                background: isWalletConnected
                  ? 'var(--Controls-Selected)'
                  : 'var(--glass-bg-secondary)',
              }}
            >
              {isWalletConnected ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <Wallet
                  className="h-5 w-5"
                  style={{ color: 'var(--page-text-secondary)' }}
                />
              )}
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold"
                style={{ color: 'var(--page-text-primary)' }}
              >
                2. Connect Wallet
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-secondary)' }}
              >
                {isWalletConnected
                  ? 'Wallet connected - Ready to mint NFTs on Base'
                  : 'Create or connect your wallet to mint NFTs'}
              </p>
            </div>
            {!isWalletConnected && (
              <ConnectWalletModal
                trigger={
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
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
      </div>
    </div>
  )
}

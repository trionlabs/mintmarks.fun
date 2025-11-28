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
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'var(--page-badge-bg)',
            border: '1px solid var(--page-border-color)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <Sparkles className="h-4 w-4 text-[var(--Controls-Selected)]" />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Own Your Commitments
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Marks of Your Life.{' '}
          <span style={{ color: 'var(--Controls-Selected)' }}>Unlocked.</span>
        </h1>

        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'var(--page-text-secondary)' }}
        >
          Transform your email event confirmations into verified NFT
          collectibles using zero-knowledge proofs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
      </div>

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
  )
}

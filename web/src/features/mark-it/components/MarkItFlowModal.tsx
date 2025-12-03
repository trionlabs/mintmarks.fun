/**
 * Mark It Flow Modal
 * 
 * Main modal that orchestrates the entire Mark It flow.
 * Layout:
 * - Terminal view at TOP (email proof runs in parallel)
 * - Step progress below
 * - Current step content
 * 
 * Flow: Wallet → Passport → Mint (email proof runs from start)
 */

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createPublicClient, http, formatEther } from 'viem'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet, ConnectWalletModal } from '@/wallet'
import { MarkItProgress } from './MarkItProgress'
import { TerminalProofView } from './TerminalProofView'
import { MINT_NETWORKS, getMintTransactionUrl, type MintNetworkId } from '@/config/mintNetworks'
import type { MarkItFlowState, MarkItFlowActions, MintSubStep, MarkItStep } from '../types'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Share2,
  ArrowRight,
  Smartphone,
  Mail,
  Wallet,
  X,
  AlertTriangle,
} from 'lucide-react'

interface MarkItFlowModalProps {
  state: MarkItFlowState
  actions: MarkItFlowActions
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Network Balance Component
 * Fetches and displays the user's ETH balance on a specific network
 */
function NetworkBalance({ networkId }: { networkId: MintNetworkId }) {
  const { address } = useWallet()
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setBalance(null)
      setIsLoading(false)
      return
    }

    const fetchBalance = async () => {
      setIsLoading(true)
      try {
        const network = MINT_NETWORKS[networkId]
        const client = createPublicClient({
          chain: network.viemChain,
          transport: http(network.rpcUrl),
        })

        const balanceWei = await client.getBalance({ address })
        const balanceEth = formatEther(balanceWei)
        // Format to 4 decimal places
        const formatted = parseFloat(balanceEth).toFixed(4)
        setBalance(formatted)
      } catch (error) {
        console.error('[NetworkBalance] Failed to fetch balance:', error)
        setBalance(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [address, networkId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--page-text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--page-text-muted)' }}>...</span>
      </div>
    )
  }

  if (!balance) {
    return (
      <span className="text-xs" style={{ color: 'var(--page-text-muted)' }}>
        --
      </span>
    )
  }

  return (
    <div className="text-right">
      <p className="text-sm font-mono font-medium" style={{ color: 'var(--page-text-primary)' }}>
        {balance}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--page-text-muted)' }}>
        ETH
      </p>
    </div>
  )
}

export function MarkItFlowModal({
  state,
  actions,
  open,
  onOpenChange,
}: MarkItFlowModalProps) {
  const { isConnected, address } = useWallet()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)

  // Handle close - only allow if not in middle of processing
  const canClose = state.step === 'wallet' || state.step === 'success' || state.error !== null

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canClose) {
      // Show confirmation dialog instead of closing directly
      setShowCloseConfirmation(true)
      return
    }
    if (!newOpen) {
      actions.cancel()
    }
    onOpenChange(newOpen)
  }

  const handleConfirmClose = () => {
    actions.cancel()
    setShowCloseConfirmation(false)
    onOpenChange(false)
  }

  const handleCancelClose = () => {
    setShowCloseConfirmation(false)
  }

  // Check if email proof is blocking next step
  const isProofBlocking = state.emailProofStatus !== 'complete' && 
                          state.emailProofStatus !== 'error' &&
                          (state.step === 'passport' || state.step === 'mint')

  // Handle step click for navigation - sequential logic
  // Only allows going back to completed steps, not forward
  const handleStepClick = (step: MarkItStep) => {
    const steps: MarkItStep[] = ['wallet', 'passport', 'mint', 'success']
    const currentIndex = steps.indexOf(state.step)
    const targetIndex = steps.indexOf(step)
    
    // Don't allow forward navigation (must use Continue button)
    if (targetIndex > currentIndex) {
      return
    }
    
    // Only allow going back to completed/accessible steps
    if (step === 'wallet' && isConnected && state.step !== 'wallet') {
      // Go back to wallet step
      if (state.step === 'passport') {
        actions.goBack()
      } else if (state.step === 'mint') {
        // Need to go back twice - call goBack once (will go to passport)
        actions.goBack()
        // User can click wallet again to go back further
      }
    } else if (step === 'passport' && state.passportSubStep === 'complete' && state.step === 'mint') {
      // Go back to passport step (only if completed)
      actions.goBack()
    } else if (step === state.step) {
      // Already on this step, do nothing
      return
    }
  }

  // Determine passport verification status
  const isPassportVerified = state.passportSubStep === 'complete'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 border shadow-none"
        style={{ borderColor: 'var(--border)' }}
        showCloseButton={false}
      >
        {/* Header Section - Glassmorphic */}
        <div 
          className="px-6 pt-6 pb-4 border-b z-10"
          style={{ 
            borderColor: 'var(--glass-border)',
            background: 'var(--glass-bg-secondary)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {state.step === 'success' ? '🎉 Mint Successful' : 'Create Mark'}
                </DialogTitle>
                <DialogDescription className="text-sm line-clamp-1 font-medium opacity-80">
                  {state.email?.subject ?? 'Processing your email...'}
                </DialogDescription>
              </div>
              
              {/* Close Button Container */}
              <div className="flex flex-col items-end gap-2">
                {/* Close Button */}
                <button
                  onClick={() => handleOpenChange(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  style={{
                    background: 'var(--glass-bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--page-text-muted)',
                  }}
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Demo Mode Badge - Outline style */}
                {state.isDemo && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border backdrop-blur-sm"
                    style={{
                      background: 'transparent',
                      color: 'var(--status-pending)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    DEMO
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Section - Sticky below header - Glassmorphic */}
        <div 
          className="border-b z-10 transition-all" 
          style={{ 
            borderColor: 'var(--glass-border)',
            background: 'var(--glass-bg-tertiary)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          }}
        >
          {/* Terminal View - Collapsible */}
          <div className="border-b" style={{ borderColor: 'var(--border)' }}>
            <TerminalProofView
              status={state.emailProofStatus}
              progress={state.emailProofProgress}
              logs={state.terminalLogs}
              eventName={state.emailProof?.metadata.eventName ?? state.email?.subject ?? undefined}
            />
          </div>

          {/* Step Progress */}
          {state.step !== 'success' && (
            <div className="px-6 py-4">
              <MarkItProgress 
                currentStep={state.step} 
                walletAddress={address}
                isWalletConnected={isConnected}
                isPassportVerified={isPassportVerified}
                onStepClick={handleStepClick}
              />
            </div>
          )}
        </div>

        {/* Scrollable Content Area - Glassmorphic */}
        <div 
          className="flex-1 overflow-y-auto px-8 py-8 min-h-[240px]"
          style={{
            background: 'transparent',
          }}
        >
          <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full">
            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Proof Blocking Alert */}
            {isProofBlocking && (
              <div 
                className="mb-6 p-3 rounded-lg flex items-center gap-3 text-sm animate-pulse"
                style={{
                  background: 'var(--status-pending-bg)',
                  border: '1px solid var(--status-pending-border)',
                  color: 'var(--status-pending)',
                }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating proof... please wait</span>
              </div>
            )}

            {/* Step Content Components */}
            <div className="relative w-full">
              {state.step === 'wallet' && (
                <WalletStep 
                  isConnected={isConnected} 
                  address={address} 
                  onContinue={actions.nextStep}
                />
              )}

              {state.step === 'passport' && (
                <PassportStep
                  subStep={state.passportSubStep}
                  qrUrl={state.passportQrUrl}
                  address={address}
                  proofReady={state.emailProofStatus === 'complete'}
                />
              )}

              {state.step === 'mint' && (
                <MintStep
                  subStep={state.mintSubStep}
                  txHash={state.transactionHash}
                  eventName={state.emailProof?.metadata.eventName}
                  onConfirmMint={actions.confirmMint}
                  selectedNetwork={state.selectedNetwork}
                  onNetworkChange={actions.setNetwork}
                />
              )}

              {state.step === 'success' && (
                <SuccessStep
                  result={state.mintResult}
                  selectedNetwork={state.selectedNetwork}
                  onViewMarks={() => {
                    handleOpenChange(false)
                    window.location.href = '/marks'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions - Glassmorphic */}
        {state.error && (
          <div 
            className="px-6 py-4 border-t flex justify-between items-center" 
            style={{ 
              borderColor: 'var(--glass-border)',
              background: 'var(--glass-bg-secondary)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            <span className="text-xs text-muted-foreground">Something went wrong</span>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={actions.retry} size="sm" className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 glass-secondary"
              >
                <AlertTriangle className="h-6 w-6 glass-text-muted" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Are you sure you want to close?
                </DialogTitle>
                <DialogDescription className="mt-1.5 leading-relaxed">
                  Closing this dialog will cancel the current process and you'll need to start from the beginning.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 p-4 rounded-lg glass-inset">
            <p className="text-sm font-medium mb-1.5 glass-text-secondary">
              What will be lost:
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside glass-text-muted">
              <li>Current progress in the minting flow</li>
              <li>Email proof generation (if in progress)</li>
              <li>Passport verification session (if active)</li>
              <li>Transaction preparation (if started)</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Close & Restart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

// ============================================
// Step Components
// ============================================

function WalletStep({
  isConnected,
  address,
  onContinue,
}: {
  isConnected: boolean
  address: `0x${string}` | null
  onContinue: () => void
}) {
  // Connected state - clean centered design
  if (isConnected && address) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {/* Success icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--status-confirmed-bg)' }}
        >
          <CheckCircle className="h-7 w-7" style={{ color: 'var(--status-confirmed)' }} />
        </div>

        {/* Connected info */}
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--page-text-primary)' }}>
          Wallet Connected
        </p>
        <p 
          className="font-mono text-sm mb-6 px-3 py-1.5 rounded-md border backdrop-blur-sm"
          style={{ 
            color: 'var(--page-text-secondary)',
            background: 'var(--glass-bg-secondary)',
            borderColor: 'var(--glass-border)',
          }}
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          <ConnectWalletModal
            trigger={
              <Button variant="outline" size="default" className="flex-1">
                Change
              </Button>
            }
          />
          <Button 
            onClick={onContinue} 
            size="default" 
            className="flex-1 gap-2"
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)',
            }}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Not connected - centered design
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8">
      {/* Wallet icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border backdrop-blur-sm"
        style={{ 
          background: 'var(--glass-bg-secondary)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <Wallet className="h-7 w-7" style={{ color: 'var(--page-text-muted)' }} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--page-text-primary)' }}>
        Connect Your Wallet
      </p>
      <p className="text-xs mb-6" style={{ color: 'var(--page-text-muted)' }}>
        Required to mint your attendance NFT
      </p>

      {/* Connect button */}
      <ConnectWalletModal
        trigger={
          <Button 
            size="lg" 
            className="gap-2 px-8"
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)',
            }}
          >
            <Mail className="h-4 w-4" />
            Connect Wallet
          </Button>
        }
      />
    </div>
  )
}

function PassportStep({
  subStep,
  qrUrl,
  address,
  proofReady,
}: {
  subStep: string
  qrUrl: string | null
  address: `0x${string}` | null
  proofReady: boolean
}) {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)

  // Success state - Identity Verified
  if (subStep === 'complete') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--status-confirmed-bg)' }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: 'var(--status-confirmed)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Identity Verified
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Bound to: {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
        </div>
      </div>
    )
  }

  // Waiting for scan
  if (subStep === 'waiting-scan' && qrUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full overflow-hidden">
        <div className="text-center mb-1">
          <p className="font-semibold text-base" style={{ color: 'var(--page-text-primary)' }}>
            Verify Your Identity
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--page-text-secondary)' }}>
            Scan with ZKPassport app
          </p>
        </div>

        {/* QR Code - Responsive Container */}
        <div
          className="p-4 rounded-xl shrink-0"
          style={{ background: 'white' }}
        >
          <div className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
            <QRCodeSVG value={qrUrl} width="100%" height="100%" level="M" marginSize={0} />
          </div>
        </div>

        {/* Mobile link */}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(qrUrl, '_blank')}
            className="gap-2 h-8 text-xs"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Open in App
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--page-text-muted)' }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Waiting for verification...
        </div>
      </div>
    )
  }

  // Generating QR code
  if (subStep === 'generating-qr') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Generating QR Code
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Preparing ZKPassport verification...
          </p>
        </div>
      </div>
    )
  }

  // Fallback / Waiting for email proof
  // Only show this if none of the above matched
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: 'var(--page-text-muted)' }}
      />
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
          {!proofReady ? 'Waiting for Email Proof' : 'Preparing Verification'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
          {!proofReady 
            ? 'Identity verification will begin once the proof is ready' 
            : 'Initializing secure connection...'}
        </p>
      </div>
    </div>
  )
}

function MintStep({
  subStep,
  txHash,
  eventName,
  onConfirmMint,
  selectedNetwork,
  onNetworkChange,
}: {
  subStep: MintSubStep
  txHash: string | null
  eventName?: string
  onConfirmMint: () => void
  selectedNetwork: MintNetworkId
  onNetworkChange: (network: MintNetworkId) => void
}) {
  const network = MINT_NETWORKS[selectedNetwork]
  // Success state - NFT Minted
  if (subStep === 'complete') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--status-confirmed-bg)' }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: 'var(--status-confirmed)' }} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
          NFT Minted!
        </p>
      </div>
    )
  }

  // Transaction pending - waiting for confirmation
  if (subStep === 'pending' && txHash) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Confirming on {network.shortName}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Waiting for block confirmation...
          </p>
        </div>
        <Button
          variant="link"
          onClick={() => window.open(getMintTransactionUrl(selectedNetwork, txHash), '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Explorer
        </Button>
      </div>
    )
  }

  // Sending transaction
  if (subStep === 'confirming') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Sending Transaction
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Please wait...
          </p>
        </div>
      </div>
    )
  }

  // Checking nullifier on-chain
  if (subStep === 'checking-nullifier') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Checking Availability
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Verifying email hasn't been used before...
          </p>
        </div>
      </div>
    )
  }

  // Simulating transaction
  if (subStep === 'simulating') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Simulating Transaction
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Checking if transaction will succeed...
          </p>
        </div>
      </div>
    )
  }

  // Ready to mint - minimalist design with network selection
  if (subStep === 'ready-to-mint') {
    const allNetworks = Object.values(MINT_NETWORKS)
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border backdrop-blur-sm"
            style={{ 
              background: 'var(--glass-bg-secondary)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <CheckCircle className="h-7 w-7" style={{ color: 'var(--mint-success)' }} />
          </div>
          
          <h3 
            className="text-base font-semibold mb-1" 
            style={{ color: 'var(--page-text-primary)' }}
          >
            Ready to Mint
          </h3>
          
          {eventName && (
            <p 
              className="text-xs max-w-[240px] line-clamp-2" 
              style={{ color: 'var(--page-text-muted)' }}
            >
              {eventName}
            </p>
          )}
        </div>

        {/* Network Selection */}
        <div className="w-full max-w-[300px] mb-6">
          <p 
            className="text-[10px] font-medium uppercase tracking-wider mb-2 px-1"
            style={{ color: 'var(--page-text-muted)' }}
          >
            Network
          </p>
          
          <div className="space-y-1.5">
            {allNetworks.map((net) => {
              const isSelected = net.id === selectedNetwork
              const isEnabled = net.enabled
              
              return (
                <button
                  key={net.id}
                  disabled={!isEnabled}
                  onClick={() => isEnabled && onNetworkChange(net.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all backdrop-blur-sm"
                  style={{
                    background: isSelected ? 'var(--glass-bg-hover)' : 'var(--glass-bg-secondary)',
                    border: `1px solid ${isSelected ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
                    opacity: isEnabled ? 1 : 0.4,
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Network icon - minimal */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold border"
                      style={{
                        background: isSelected ? 'var(--page-text-primary)' : 'transparent',
                        borderColor: isSelected ? 'transparent' : 'var(--glass-border)',
                        color: isSelected ? 'var(--background)' : 'var(--page-text-secondary)',
                      }}
                    >
                      {net.id.startsWith('ethereum') ? 'Ξ' : 'B'}
                    </div>
                    
                    <div className="text-left">
                      <p 
                        className="text-sm font-medium leading-tight"
                        style={{ color: 'var(--page-text-primary)' }}
                      >
                        {net.shortName}
                      </p>
                      {net.testnet && (
                        <p 
                          className="text-[10px]"
                          style={{ color: 'var(--page-text-muted)' }}
                        >
                          Testnet
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Right side */}
                  {isEnabled ? (
                    isSelected ? (
                      <NetworkBalance networkId={net.id} />
                    ) : null
                  ) : (
                    <span 
                      className="text-[10px]"
                      style={{ color: 'var(--page-text-muted)' }}
                    >
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mint button */}
        <Button
          size="lg"
          onClick={onConfirmMint}
          className="w-full max-w-[300px] h-11 text-sm font-medium rounded-xl"
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
          }}
        >
          Mint Mark
        </Button>
      </div>
    )
  }

  // Preparing transaction
  if (subStep === 'preparing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--page-text-muted)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Preparing Transaction
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            {eventName ? `Minting: ${eventName}` : 'Setting up mint transaction...'}
          </p>
        </div>
      </div>
    )
  }

  // Fallback - Waiting for proof
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: 'var(--page-text-muted)' }}
      />
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
          Waiting for Email Proof
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
          Minting will begin once the proof is ready
        </p>
      </div>
    </div>
  )
}

function SuccessStep({
  result,
  selectedNetwork,
  onViewMarks,
}: {
  result: MarkItFlowState['mintResult']
  selectedNetwork: MintNetworkId
  onViewMarks: () => void
}) {
  const network = MINT_NETWORKS[selectedNetwork]
  
  const shareOnX = () => {
    const text = `I just minted my "${result?.eventName}" attendance NFT on @mintmarks! 🎉\n\nProof of attendance on ${network.name}, verified with ZK proofs.`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce"
        style={{ background: 'var(--status-confirmed-bg)' }}
      >
        <CheckCircle className="h-10 w-10" style={{ color: 'var(--status-confirmed)' }} />
      </div>

      <div className="text-center">
        <p className="font-bold text-xl" style={{ color: 'var(--page-text-primary)' }}>
          Your Mark is Onchain!
        </p>
        {result && (
          <>
            <p className="text-sm mt-2" style={{ color: 'var(--page-text-secondary)' }}>
              {result.eventName}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--page-text-muted)' }}>
              Minted on {network.name}
            </p>
            {result.transactionHash && (
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open(getMintTransactionUrl(selectedNetwork, result.transactionHash), '_blank')}
                className="gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                View Transaction
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        <Button variant="outline" onClick={shareOnX} className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Share on X
        </Button>
        <Button onClick={onViewMarks} className="flex-1 gap-2">
          <ArrowRight className="h-4 w-4" />
          View My Marks
        </Button>
      </div>
    </div>
  )
}

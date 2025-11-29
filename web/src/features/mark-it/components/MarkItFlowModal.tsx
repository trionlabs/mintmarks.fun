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

import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet, ConnectWalletModal } from '@/wallet'
import { MarkItProgress } from './MarkItProgress'
import { TerminalProofView } from './TerminalProofView'
import { NetworkSelector } from './NetworkSelector'
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
} from 'lucide-react'

interface MarkItFlowModalProps {
  state: MarkItFlowState
  actions: MarkItFlowActions
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MarkItFlowModal({
  state,
  actions,
  open,
  onOpenChange,
}: MarkItFlowModalProps) {
  const { isConnected, address } = useWallet()

  // Handle close - only allow if not in middle of processing
  const canClose = state.step === 'wallet' || state.step === 'success' || state.error !== null

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canClose) {
      // Don't allow closing during processing
      return
    }
    if (!newOpen) {
      actions.cancel()
    }
    onOpenChange(newOpen)
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
        showCloseButton={canClose}
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 border-b bg-background/80 backdrop-blur-sm z-10" style={{ borderColor: 'var(--border)' }}>
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
              
              {/* Badges Container */}
              <div className="flex flex-col items-end gap-2">
                {/* Network Badge - shows selected network */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors"
                  style={{
                    background: 'var(--Controls-Idle)',
                    color: 'var(--Controls-Selected)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {MINT_NETWORKS[state.selectedNetwork].shortName}
                </div>

                {/* Demo Mode Badge */}
                {state.isDemo && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border"
                    style={{
                      background: 'var(--status-pending-bg)',
                      color: 'var(--status-pending)',
                      borderColor: 'var(--status-pending-border)',
                    }}
                  >
                    DEMO
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Section - Sticky below header */}
        <div className="bg-background/60 backdrop-blur-sm border-b z-10 transition-all" style={{ borderColor: 'var(--border)' }}>
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
                progress={state.progress} 
                walletAddress={address}
                isWalletConnected={isConnected}
                isPassportVerified={isPassportVerified}
                onStepClick={handleStepClick}
              />
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 min-h-[240px] bg-background/40">
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
              <div className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3 text-sm text-yellow-500 animate-pulse">
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

        {/* Footer Actions */}
        {state.error && (
          <div className="px-6 py-4 border-t bg-background/80 backdrop-blur-sm flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
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
          className="font-mono text-sm mb-6 px-3 py-1.5 rounded-md"
          style={{ 
            color: 'var(--page-text-secondary)',
            background: 'var(--Controls-Idle)',
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
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--Controls-Idle)' }}
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
          style={{ color: 'var(--Controls-Selected)' }}
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
        style={{ color: 'var(--Controls-Selected)' }}
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
          style={{ color: 'var(--Controls-Selected)' }}
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
          style={{ color: 'var(--Controls-Selected)' }}
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
          style={{ color: 'var(--Controls-Selected)' }}
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
          style={{ color: 'var(--Controls-Selected)' }}
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

  // Ready to mint - show network selector and Mint button
  // When clicked, confirmMint() will:
  // 1. Check if transaction is prepared
  // 2. If not, prepare it first (mint())
  // 3. Then send the transaction
  if (subStep === 'ready-to-mint') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--status-confirmed-bg)' }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: 'var(--status-confirmed)' }} />
        </div>
        
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: 'var(--page-text-primary)' }}>
            Ready to Mint!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            {eventName}
          </p>
        </div>

        {/* Network Selector */}
        <div className="w-full max-w-xs">
          <label
            className="block text-xs font-medium mb-2"
            style={{ color: 'var(--page-text-muted)' }}
          >
            Select Network
          </label>
          <NetworkSelector
            selected={selectedNetwork}
            onChange={onNetworkChange}
          />
        </div>

        <Button
          size="lg"
          onClick={onConfirmMint}
          className="gap-2 px-8 w-full max-w-xs"
        >
          <CheckCircle className="h-5 w-5" />
          Mint on {network.shortName}
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
          style={{ color: 'var(--Controls-Selected)' }}
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
        style={{ color: 'var(--Controls-Selected)' }}
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

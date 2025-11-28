/**
 * Mark It Flow Modal
 * 
 * Main modal that orchestrates the entire Mark It flow.
 * Shows different content based on current step.
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
import { ethereumSepolia, getSepoliaTransactionUrl } from '@/config/sepolia'
import type { MarkItFlowState, MarkItFlowActions, MintSubStep } from '../types'
import {
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Share2,
  ArrowRight,
  Smartphone,
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={canClose}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {state.step === 'success' ? '🎉 Success!' : 'Mark It'}
            </DialogTitle>
            {/* Network Badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'var(--Controls-Idle)',
                color: 'var(--Controls-Selected)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {ethereumSepolia.name}
            </div>
          </div>
          <DialogDescription>
            {state.email?.subject ?? 'Processing your email'}
          </DialogDescription>
        </DialogHeader>

        {/* Demo Mode Badge */}
        {state.isDemo && (
          <div
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--status-pending-bg)',
              color: 'var(--status-pending)',
            }}
          >
            <AlertCircle className="h-4 w-4" />
            Demo Mode - No real transactions
          </div>
        )}

        {/* Progress Indicator */}
        <MarkItProgress currentStep={state.step} progress={state.progress} />

        {/* Step Content */}
        <div className="min-h-[200px] flex flex-col">
          {/* Error State */}
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Wallet */}
          {state.step === 'wallet' && (
            <WalletStep isConnected={isConnected} address={address} />
          )}

          {/* Step 2: Email Proof */}
          {state.step === 'email-proof' && (
            <EmailProofStep
              subStep={state.emailProofSubStep}
              progress={state.emailProofProgress}
              result={state.emailProof}
            />
          )}

          {/* Step 3: Passport */}
          {state.step === 'passport' && (
            <PassportStep
              subStep={state.passportSubStep}
              qrUrl={state.passportQrUrl}
              address={address}
            />
          )}

          {/* Step 4: Mint */}
          {state.step === 'mint' && (
            <MintStep
              subStep={state.mintSubStep}
              txHash={state.transactionHash}
              eventName={state.emailProof?.metadata.eventName}
              onConfirmMint={actions.confirmMint}
            />
          )}

          {/* Step 5: Success */}
          {state.step === 'success' && (
            <SuccessStep
              result={state.mintResult}
              onViewMarks={() => {
                handleOpenChange(false)
                window.location.href = '/marks'
              }}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {state.error && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={actions.retry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </>
          )}
        </div>
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
}: {
  isConnected: boolean
  address: `0x${string}` | null
}) {
  if (isConnected && address) {
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
            Wallet Connected
          </p>
          <p className="text-sm font-mono mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            {address.slice(0, 8)}...{address.slice(-6)}
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--page-text-muted)' }}>
          Proceeding to email proof generation...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'var(--Controls-Idle)' }}
      >
        <Wallet className="h-10 w-10" style={{ color: 'var(--Controls-Selected)' }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg" style={{ color: 'var(--page-text-primary)' }}>
          Connect Your Wallet
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
          You need a wallet to mint your soulbound NFT
        </p>
      </div>
      <ConnectWalletModal
        trigger={
          <Button size="lg" className="gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        }
      />
    </div>
  )
}

function EmailProofStep({
  subStep,
  progress,
  result,
}: {
  subStep: string
  progress: { message: string; percent: number }
  result: MarkItFlowState['emailProof']
}) {
  if (subStep === 'complete' && result) {
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
            Email Proof Generated
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Event: {result.metadata.eventName}
          </p>
          <p className="text-xs font-mono mt-2" style={{ color: 'var(--page-text-muted)' }}>
            Nullifier: {result.nullifier.slice(0, 12)}...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: 'var(--Controls-Selected)' }}
      />
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
          {progress.message || 'Generating ZK Proof...'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--page-text-muted)' }}>
          This may take 30-60 seconds
        </p>
      </div>
      {/* Sub-progress bar */}
      <div className="w-full max-w-xs">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--Controls-Idle)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress.percent}%`,
              background: 'var(--Controls-Selected)',
            }}
          />
        </div>
        <p className="text-xs text-center mt-1 font-mono" style={{ color: 'var(--page-text-muted)' }}>
          {progress.percent}%
        </p>
      </div>
    </div>
  )
}

function PassportStep({
  subStep,
  qrUrl,
  address,
}: {
  subStep: string
  qrUrl: string | null
  address: `0x${string}` | null
}) {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)

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

  if (subStep === 'waiting-scan' && qrUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-center mb-2">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Verify Your Identity
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Scan with ZKPassport app
          </p>
        </div>

        {/* QR Code */}
        <div
          className="p-4 rounded-xl"
          style={{ background: 'white' }}
        >
          <QRCodeSVG value={qrUrl} size={180} level="M" marginSize={0} />
        </div>

        {/* Mobile link */}
        {isMobile && (
          <Button
            variant="outline"
            onClick={() => window.open(qrUrl, '_blank')}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            Open in App
          </Button>
        )}

        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--page-text-muted)' }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for verification...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: 'var(--Controls-Selected)' }}
      />
      <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
        Preparing verification...
      </p>
    </div>
  )
}

function MintStep({
  subStep,
  txHash,
  eventName,
  onConfirmMint,
}: {
  subStep: MintSubStep
  txHash: string | null
  eventName?: string
  onConfirmMint: () => void
}) {
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

  if (subStep === 'pending' && txHash) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2
          className="h-12 w-12 animate-spin"
          style={{ color: 'var(--Controls-Selected)' }}
        />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
            Confirming Transaction
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Waiting for block confirmation...
          </p>
        </div>
        <Button
          variant="link"
          onClick={() => window.open(getSepoliaTransactionUrl(txHash), '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Etherscan
        </Button>
      </div>
    )
  }

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

  // Ready to mint - show the Mint button
  if (subStep === 'ready-to-mint') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--status-confirmed-bg)' }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: 'var(--status-confirmed)' }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: 'var(--page-text-primary)' }}>
            Ready to Mint!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            {eventName}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--page-text-muted)' }}>
            Your proofs are verified. Click below to mint your NFT.
          </p>
        </div>
        <Button
          size="lg"
          onClick={onConfirmMint}
          className="gap-2 px-8"
        >
          <CheckCircle className="h-5 w-5" />
          Mint NFT
        </Button>
      </div>
    )
  }

  // Default: preparing/simulating/checking
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
        {eventName && (
          <p className="text-sm mt-1" style={{ color: 'var(--page-text-secondary)' }}>
            Minting: {eventName}
          </p>
        )}
      </div>
    </div>
  )
}

function SuccessStep({
  result,
  onViewMarks,
}: {
  result: MarkItFlowState['mintResult']
  onViewMarks: () => void
}) {
  const shareOnX = () => {
    const text = `I just minted my "${result?.eventName}" attendance NFT on @mintmarks! 🎉\n\nProof of attendance, verified with ZK proofs.`
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
            {result.transactionHash && (
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open(getSepoliaTransactionUrl(result.transactionHash), '_blank')}
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


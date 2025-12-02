/**
 * @fileoverview Unified connect modal with two tabs.
 * Uses RainbowKit's useConnectModal hook for better UX.
 * 
 * CRITICAL: SignInModal must be rendered OUTSIDE the Dialog to prevent
 * unmounting when Dialog closes. We use a ref + useEffect for auto-click.
 */

import { useState, useEffect, useRef } from 'react'
import { SignInModal } from '@coinbase/cdp-react'
import { useIsSignedIn } from '@coinbase/cdp-hooks'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Mail, Wallet } from 'lucide-react'

interface ConnectWalletModalProps {
  trigger?: React.ReactNode
}

export function ConnectWalletModal({ trigger }: ConnectWalletModalProps) {
  const [open, setOpen] = useState(false)
  const [showCdpModal, setShowCdpModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const cdpButtonRef = useRef<HTMLButtonElement>(null)
  
  const { openConnectModal } = useConnectModal()
  const { isConnected: isExternalConnected } = useAccount()
  const { isSignedIn: isCdpConnected } = useIsSignedIn()

  // Check if CDP is configured
  const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID

  // Auto-click CDP button when showCdpModal becomes true
  useEffect(() => {
    if (showCdpModal && cdpButtonRef.current) {
      const timer = setTimeout(() => {
        cdpButtonRef.current?.click()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showCdpModal])

  // Reset connecting state when Dialog opens (handles dismissed CDP modal case)
  useEffect(() => {
    if (open) {
      setIsConnecting(false)
      setShowCdpModal(false)
    }
  }, [open])
  
  // ============================================
  // Modal Dismiss Detection
  // ============================================
  // SignInModal doesn't have onClose callback.
  // Detect dismiss and reset state.
  
  const isWalletConnected = isCdpConnected || isExternalConnected
  
  // Reset when wallet connects
  useEffect(() => {
    if (isWalletConnected && isConnecting) {
      setIsConnecting(false)
      setShowCdpModal(false)
    }
  }, [isWalletConnected, isConnecting])
  
  // Detect click outside CDP modal
  useEffect(() => {
    if (!showCdpModal) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[role="dialog"]') === null) {
        setTimeout(() => {
          if (!isCdpConnected) {
            setShowCdpModal(false)
            setIsConnecting(false)
          }
        }, 100)
      }
    }
    
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 200)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showCdpModal, isCdpConnected])
  
  // Fallback timeout
  useEffect(() => {
    if (!showCdpModal || !isConnecting) return
    
    const fallbackTimer = setTimeout(() => {
      if (!isCdpConnected && !isExternalConnected) {
        setShowCdpModal(false)
        setIsConnecting(false)
      }
    }, 30000)
    
    return () => clearTimeout(fallbackTimer)
  }, [showCdpModal, isConnecting, isCdpConnected, isExternalConnected])

  /**
   * Opens RainbowKit modal for external wallet connection.
   */
  const handleExternalConnect = () => {
    if (isConnecting) return
    setIsConnecting(true)
    setOpen(false)
    setTimeout(() => {
      openConnectModal?.()
      setIsConnecting(false)
    }, 150)
  }

  /**
   * Opens CDP SignInModal.
   */
  const handleEmailConnect = () => {
    if (isConnecting) return
    setIsConnecting(true)
    setOpen(false)
    setShowCdpModal(true)
  }

  /**
   * Called when CDP auth succeeds or modal closes/dismissed.
   */
  const handleCdpComplete = () => {
    setShowCdpModal(false)
    setIsConnecting(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button>Connect Wallet</Button>}
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Connect to MintMarks</DialogTitle>
            <DialogDescription className="sr-only">
              Choose a connection method: email for new users or browser wallet for existing users.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={isCDPConfigured ? 'email' : 'wallet'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="email"
                className="flex items-center gap-2"
                disabled={!isCDPConfigured}
              >
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </TabsTrigger>
            </TabsList>

            {isCDPConfigured && (
              <TabsContent value="email" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  New to crypto? Sign in with email to create a wallet.
                </p>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleEmailConnect}
                  disabled={isCdpConnected || isConnecting}
                >
                  {isCdpConnected ? 'Already Connected' : 'Continue with Email'}
                </Button>
              </TabsContent>
            )}

            <TabsContent value="wallet" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Connect your MetaMask, Rabby, or Coinbase Wallet.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={handleExternalConnect}
                disabled={isExternalConnected || isConnecting}
              >
                {isExternalConnected ? 'Already Connected' : 'Connect Wallet'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 
        SignInModal rendered OUTSIDE Dialog to prevent unmounting.
        Hidden button is auto-clicked via useEffect when showCdpModal is true.
        NOTE: SignInModal doesn't expose onClose - we rely on onSuccess only.
        If user dismisses without auth, showCdpModal stays true until next attempt.
      */}
      {isCDPConfigured && showCdpModal && (
        <SignInModal onSuccess={handleCdpComplete}>
          <button 
            ref={cdpButtonRef}
            className="sr-only"
            aria-hidden="true"
          />
        </SignInModal>
      )}
    </>
  )
}

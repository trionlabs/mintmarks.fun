/**
 * @fileoverview Wallet Operations Modal
 * 
 * Unified modal for wallet connection and operations.
 * 
 * Modes:
 * - create: First-time wallet setup (CDP Email or External Wallet)
 * - operations: Send, Receive, Disconnect (for connected wallets)
 * 
 * Features:
 * - CDP Email wallet creation flow
 * - External wallet connection via RainbowKit
 * - QR code for receiving (coming soon)
 * - Disconnect/logout options
 */

import { useState, useCallback, useEffect, useRef } from 'react'
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
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Mail, 
  Wallet, 
  Send, 
  Download, 
  LogOut, 
  Copy, 
  Check, 
  ExternalLink,
  QrCode,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useToast } from '@/contexts/ToastContext'
import { getAddressUrl, ACTIVE_NETWORK } from '@/config/contracts'

// ============================================
// Types
// ============================================

interface WalletOperationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalMode = 'create' | 'operations'
type OperationsTab = 'send' | 'receive' | 'disconnect'

// ============================================
// Constants
// ============================================

/** Delay before triggering CDP modal click (ms) */
const CDP_AUTO_CLICK_DELAY = 100

/** Delay before opening external wallet modal (ms) */
const EXTERNAL_CONNECT_DELAY = 150

// ============================================
// Component
// ============================================

export function WalletOperationsModal({
  open,
  onOpenChange,
}: WalletOperationsModalProps) {
  const { showToast } = useToast()
  const { openConnectModal } = useConnectModal()
  const { isConnected: isExternalConnected } = useAccount()
  const { isSignedIn: isCdpConnected } = useIsSignedIn()
  
  const {
    isWalletConnected,
    walletAddress,
    walletSource,
    formattedBalance,
    walletDisconnect,
    handleFullLogout,
    isLoggingOut,
  } = useAuthStatus()
  
  // Local state
  const [showCdpModal, setShowCdpModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<OperationsTab>('receive')
  const cdpButtonRef = useRef<HTMLButtonElement>(null)
  
  // Determine mode based on wallet connection state
  const mode: ModalMode = isWalletConnected ? 'operations' : 'create'
  
  // Check if CDP is configured
  const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID
  
  // ============================================
  // CDP Auto-click Effect
  // ============================================
  
  useEffect(() => {
    if (showCdpModal && cdpButtonRef.current) {
      const timer = setTimeout(() => {
        cdpButtonRef.current?.click()
      }, CDP_AUTO_CLICK_DELAY)
      return () => clearTimeout(timer)
    }
  }, [showCdpModal])
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsConnecting(false)
      setShowCdpModal(false)
      setActiveTab('receive')
      setCopied(false)
    }
  }, [open])
  
  // Close modal when wallet connects
  useEffect(() => {
    if (isWalletConnected && mode === 'create') {
      onOpenChange(false)
    }
  }, [isWalletConnected, mode, onOpenChange])
  
  // ============================================
  // Connection Handlers
  // ============================================
  
  /**
   * Initiates CDP email wallet connection flow.
   * Closes this dialog and opens CDP SignInModal.
   */
  const handleEmailConnect = useCallback(() => {
    if (isConnecting) return
    setIsConnecting(true)
    onOpenChange(false)
    setShowCdpModal(true)
  }, [isConnecting, onOpenChange])
  
  /**
   * Initiates external wallet connection via RainbowKit.
   */
  const handleExternalConnect = useCallback(() => {
    if (isConnecting) return
    setIsConnecting(true)
    onOpenChange(false)
    setTimeout(() => {
      openConnectModal?.()
      setIsConnecting(false)
    }, EXTERNAL_CONNECT_DELAY)
  }, [isConnecting, onOpenChange, openConnectModal])
  
  /**
   * Called when CDP auth completes (success or dismiss).
   */
  const handleCdpComplete = useCallback(() => {
    setShowCdpModal(false)
    setIsConnecting(false)
  }, [])
  
  // ============================================
  // Operations Handlers
  // ============================================
  
  /**
   * Copies wallet address to clipboard.
   */
  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      showToast('Address copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[WalletOperationsModal] Copy failed:', error)
      showToast('Failed to copy address', 'error')
    }
  }, [walletAddress, showToast])
  
  /**
   * Disconnects wallet only (keeps Gmail connected).
   */
  const handleDisconnect = useCallback(async () => {
    try {
      await walletDisconnect()
      showToast('Wallet disconnected', 'success')
      onOpenChange(false)
    } catch (error) {
      console.error('[WalletOperationsModal] Disconnect failed:', error)
      showToast('Failed to disconnect wallet', 'error')
    }
  }, [walletDisconnect, showToast, onOpenChange])
  
  /**
   * Full logout - disconnects wallet AND logs out Gmail.
   */
  const handleFullLogoutClick = useCallback(async () => {
    await handleFullLogout()
    onOpenChange(false)
  }, [handleFullLogout, onOpenChange])
  
  /**
   * Opens block explorer for wallet address.
   */
  const handleViewExplorer = useCallback(() => {
    if (walletAddress) {
      window.open(getAddressUrl(walletAddress), '_blank', 'noopener,noreferrer')
    }
  }, [walletAddress])
  
  // ============================================
  // Render: Create Mode (Wallet Connection)
  // ============================================
  
  const renderCreateMode = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Connect Wallet</DialogTitle>
        <DialogDescription className="text-center">
          Choose how you want to connect your wallet
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
        
        {/* Email Tab - CDP Wallet */}
        {isCDPConfigured && (
          <TabsContent value="email" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              New to crypto? Sign in with email to create a wallet instantly.
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
        
        {/* Wallet Tab - External Wallets */}
        <TabsContent value="wallet" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Connect MetaMask, Rabby, Coinbase Wallet, or other wallets.
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
    </>
  )
  
  // ============================================
  // Render: Operations Mode (Wallet Management)
  // ============================================
  
  const renderOperationsMode = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Wallet</DialogTitle>
        <DialogDescription className="text-center">
          {formattedBalance} on {ACTIVE_NETWORK.name}
        </DialogDescription>
      </DialogHeader>
      
      {/* Wallet Info Card */}
      <Card variant="figma" className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Wallet Icon with Glow */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  backgroundColor: 'var(--wallet-icon-connected-bg)',
                  color: 'var(--wallet-icon-connected-color)',
                  boxShadow: 'var(--wallet-icon-connected-glow)',
                }}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                {/* Truncated Address */}
                <p 
                  className="font-mono text-sm font-semibold" 
                  style={{ color: 'var(--page-text-primary)' }}
                >
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>
                {/* Wallet Source Badge */}
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs" 
                    style={{ color: 'var(--page-text-secondary)' }}
                  >
                    {walletSource === 'cdp' ? 'Email Wallet' : 'External Wallet'}
                  </span>
                  {walletSource === 'external' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                      EXT
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyAddress}
                aria-label={copied ? 'Address copied' : 'Copy address'}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleViewExplorer}
                aria-label="View on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Operations Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as OperationsTab)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send</span>
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Receive</span>
          </TabsTrigger>
          <TabsTrigger value="disconnect" className="flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Send Tab - Coming Soon */}
        <TabsContent value="send" className="mt-4">
          <Card variant="figma">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send ETH
              </CardTitle>
              <CardDescription className="text-xs">
                Send native tokens to another address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coming Soon Notice */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Send feature coming soon. Use your wallet app for now.
                </p>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewExplorer}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Receive Tab */}
        <TabsContent value="receive" className="mt-4">
          <Card variant="figma">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4" />
                Receive
              </CardTitle>
              <CardDescription className="text-xs">
                Share your address to receive tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Placeholder */}
              <div 
                className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-center">
                  <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p 
                    className="text-xs" 
                    style={{ color: 'var(--page-text-muted)' }}
                  >
                    QR Code coming soon
                  </p>
                </div>
              </div>
              
              {/* Address Display */}
              <div className="space-y-2">
                <p 
                  className="text-xs font-medium" 
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Your Address
                </p>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg font-mono text-xs break-all"
                  style={{
                    backgroundColor: 'var(--glass-bg-secondary)',
                    color: 'var(--page-text-primary)',
                  }}
                >
                  <span className="flex-1">{walletAddress}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleCopyAddress}
                    aria-label={copied ? 'Address copied' : 'Copy address'}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button className="w-full" onClick={handleCopyAddress}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Disconnect Tab */}
        <TabsContent value="disconnect" className="mt-4">
          <Card variant="figma">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout Options
              </CardTitle>
              <CardDescription className="text-xs">
                Disconnect wallet or logout completely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Disconnect Wallet Only */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleDisconnect}
              >
                <Wallet className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Disconnect Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    Keep Gmail connected, disconnect wallet only
                  </p>
                </div>
              </Button>
              
              {/* Full Logout */}
              <Button
                variant="destructive"
                className="w-full justify-start gap-3"
                onClick={handleFullLogoutClick}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">
                    {isLoggingOut ? 'Logging out...' : 'Full Logout'}
                  </p>
                  <p className="text-xs opacity-80">
                    Disconnect wallet and logout Gmail
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {mode === 'create' ? renderCreateMode() : renderOperationsMode()}
        </DialogContent>
      </Dialog>
      
      {/* 
        CDP SignInModal - Rendered OUTSIDE Dialog to prevent unmounting.
        Uses hidden button with auto-click via useEffect.
        NOTE: SignInModal doesn't expose onClose, relies on onSuccess.
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

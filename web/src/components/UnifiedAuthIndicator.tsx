/**
 * @fileoverview Unified Auth Indicator Component
 * 
 * A compact, glassmorphic auth indicator that combines Gmail + Wallet status.
 * Implements an 8-state state machine with full accessibility support.
 * 
 * States:
 * 1. NOT_AUTHENTICATED - "Sign in" button
 * 2. GMAIL_ONLY_NO_WALLET - Email shown, wallet creation prompt
 * 3. GMAIL_ONLY_WALLET_LOADING - Email + "Connecting..."
 * 4. FULLY_CONNECTED_DEFAULT - Balance + Email
 * 5. FULLY_CONNECTED_HOVER - Balance + Address + Copy icon
 * 6. GMAIL_AUTH_ERROR - Error with retry
 * 7. WALLET_CONNECTION_ERROR - Error with retry
 * 8. BALANCE_FETCH_ERROR - Balance error with retry
 * 
 * Features:
 * - Desktop: Hover to show address
 * - Mobile: Touch to show address (2s), long-press to copy
 * - Accessibility: ARIA labels, keyboard navigation
 * - Debounced click handlers (300ms)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { SignInModal } from '@coinbase/cdp-react'
import { useIsSignedIn } from '@coinbase/cdp-hooks'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { 
  Mail, 
  Wallet, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown,
  Globe,
  Power,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useToast } from '@/contexts/ToastContext'
import { useWallet } from '@/wallet'
import { ACTIVE_NETWORK, NETWORKS, getAddressUrl, type NetworkKey } from '@/config/contracts'
import { isActiveNetwork } from '@/config/chains'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

interface UnifiedAuthIndicatorProps {
  className?: string
}

type AuthState = 
  | 'NOT_AUTHENTICATED'
  | 'GMAIL_ONLY_NO_WALLET'
  | 'GMAIL_ONLY_WALLET_LOADING'
  | 'FULLY_CONNECTED'
  | 'GMAIL_AUTH_ERROR'
  | 'WALLET_CONNECTION_ERROR'
  | 'BALANCE_FETCH_ERROR'

// Note: isActiveNetwork() helper imported from @/config/chains

// Debounce delay
const DEBOUNCE_MS = 300

// Touch interaction timing
const TOUCH_ADDRESS_DISPLAY_MS = 2000
const LONG_PRESS_MS = 500

// ============================================
// Network Icon Component
// ============================================

function NetworkIcon({ chainId, size = 'sm' }: { chainId: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  // Base (mainnet + testnet)
  if (chainId === 8453 || chainId === 84532) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#0052FF" />
        <path d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6c2.76 0 5.09-1.83 5.79-4.4h-4.29c-.47.86-1.42 1.4-2.5 1.4-1.66 0-3-1.34-3-3s1.34-3 3-3c1.08 0 2.03.54 2.5 1.4h4.29C17.09 7.83 14.76 6 12 6z" fill="white"/>
      </svg>
    )
  }
  
  // Ethereum (mainnet + sepolia)
  if (chainId === 1 || chainId === 11155111) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#627EEA" />
        <path d="M12 5v5.5l4 2.3L12 5z" fill="white" fillOpacity="0.6"/>
        <path d="M12 5L8 12.8l4-2.3V5z" fill="white"/>
        <path d="M12 16v4l4-5.5-4 1.5z" fill="white" fillOpacity="0.6"/>
        <path d="M12 20v-4l-4-1.5 4 5.5z" fill="white"/>
      </svg>
    )
  }
  
  // Arbitrum
  if (chainId === 42161) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#28A0F0" />
        <path d="M8 15l4-8 4 8h-2l-2-4-2 4H8z" fill="white"/>
      </svg>
    )
  }
  
  // Optimism
  if (chainId === 10) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#FF0420" />
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    )
  }
  
  // Polygon
  if (chainId === 137) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#8247E5" />
        <path d="M15 10l-3-2-3 2v4l3 2 3-2v-4z" fill="white"/>
      </svg>
    )
  }
  
  // Unknown network fallback
  return (
    <div className={cn(cls, 'rounded-full bg-muted flex items-center justify-center')}>
      <Globe className="w-2.5 h-2.5 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}

// ============================================
// Debounce Hook
// ============================================

function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  return useMemo(() => {
    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T
    
    return debouncedFn
  }, [delay])
}

// ============================================
// Component
// ============================================

export function UnifiedAuthIndicator({ 
  className,
}: UnifiedAuthIndicatorProps) {
  const { showToast } = useToast()
  
  // RainbowKit & CDP hooks for wallet connection
  const { openConnectModal } = useConnectModal()
  const { isConnected: isExternalConnected } = useAccount()
  const { isSignedIn: isCdpConnected } = useIsSignedIn()
  const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID
  
  // CDP modal state
  const [showCdpModal, setShowCdpModal] = useState(false)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const cdpButtonRef = useRef<HTMLButtonElement>(null)
  
  // Auto-click CDP button when showCdpModal becomes true
  useEffect(() => {
    if (showCdpModal && cdpButtonRef.current) {
      const timer = setTimeout(() => {
        cdpButtonRef.current?.click()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showCdpModal])
  
  // ============================================
  // Modal Dismiss Detection
  // ============================================
  // SignInModal doesn't have onClose/onDismiss callback.
  // We detect dismiss by checking if modal was shown but no connection happened.
  // Uses a combination of:
  // 1. Click-outside detection when CDP modal is shown
  // 2. Wallet connection state changes
  // 3. Fallback timeout
  
  // Reset connecting state when wallet actually connects
  useEffect(() => {
    const walletConnected = isCdpConnected || isExternalConnected
    if (walletConnected && isConnectingWallet) {
      setIsConnectingWallet(false)
      setShowCdpModal(false)
    }
  }, [isCdpConnected, isExternalConnected, isConnectingWallet])
  
  // Detect click outside CDP modal to reset state
  useEffect(() => {
    if (!showCdpModal) return
    
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is on the modal backdrop (outside modal content)
      const target = e.target as HTMLElement
      
      // CDP modal typically has a backdrop/overlay
      // If user clicks outside and modal closes, reset state
      // We use a small delay to let the modal close first
      if (target.closest('[role="dialog"]') === null && 
          target.closest('.cdp-modal') === null) {
        // Clicked outside modal area
        setTimeout(() => {
          // Only reset if still not connected
          if (!isCdpConnected) {
            setShowCdpModal(false)
            setIsConnectingWallet(false)
          }
        }, 100)
      }
    }
    
    // Add listener after a short delay to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 200)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showCdpModal, isCdpConnected])
  
  // Fallback: Reset state after timeout if modal was dismissed without action
  useEffect(() => {
    if (!showCdpModal || !isConnectingWallet) return
    
    // If still connecting after 30 seconds, assume modal was dismissed
    const fallbackTimer = setTimeout(() => {
      if (!isCdpConnected && !isExternalConnected) {
        setShowCdpModal(false)
        setIsConnectingWallet(false)
        if (import.meta.env.DEV) {
          console.log('[UnifiedAuthIndicator] Connection timeout, resetting state')
        }
      }
    }, 30000)
    
    return () => clearTimeout(fallbackTimer)
  }, [showCdpModal, isConnectingWallet, isCdpConnected, isExternalConnected])
  
  // Get wallet capabilities first (needed for useAuthStatus override)
  const { switchChain, canSwitchChain, isMultichain, chainId: walletChainId } = useWallet()
  
  // Selected network for CDP wallets (persisted in localStorage)
  // Note: No SSR check needed - this is a Vite SPA (client-only)
  const [selectedCdpNetwork, setSelectedCdpNetwork] = useState<number>(() => {
    const saved = localStorage.getItem('mintmarks_selected_network')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (isActiveNetwork(parsed)) return parsed
    }
    return ACTIVE_NETWORK.chainId // Default to Base Sepolia
  })
  
  // Get auth status with optional chainId override for CDP wallets
  const {
    isGmailConnected,
    userEmail,
    gmailLogin,
    isWalletConnected,
    walletAddress,
    walletLoading,
    walletDisconnect,
    formattedBalance,
    balanceLoading,
    networkName,
    gmailAuthError,
    walletConnectionError,
    balanceError,
    connectionTimeout,
    handleFullLogout,
    isLoggingOut,
    retryGmailAuth,
    retryWalletConnection,
    retryBalanceFetch,
  } = useAuthStatus({ 
    overrideChainId: isMultichain ? selectedCdpNetwork : undefined 
  })
  
  // UI State
  const [copied, setCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [switchingToChainId, setSwitchingToChainId] = useState<number | null>(null)
  
  // Touch handling refs
  const touchStartTimeRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchDisplayTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Derived values
  // For CDP wallets, use the user-selected network; for external wallets, use the actual connected chain
  const chainId = isMultichain 
    ? selectedCdpNetwork 
    : (walletChainId ?? ACTIVE_NETWORK.chainId)
  const emailName = userEmail?.split('@')[0]?.slice(0, 10) || ''
  
  // Show address when hovered (desktop) or touched (mobile), but not when dropdown is open
  const showAddress = (isHovered || isTouched) && !isDropdownOpen
  
  // ============================================
  // State Machine
  // ============================================
  
  const currentState: AuthState = useMemo(() => {    
    // Error states take priority
    if (gmailAuthError) return 'GMAIL_AUTH_ERROR'
    
    // Not authenticated - no Gmail
    if (!isGmailConnected) return 'NOT_AUTHENTICATED'
    
    // Wallet connection error - only show if wallet is NOT connected
    // If wallet IS connected, the error is stale or informational (e.g., wrong network warning)
    if (walletConnectionError && !isWalletConnected) return 'WALLET_CONNECTION_ERROR'
    if (connectionTimeout && !isWalletConnected) return 'WALLET_CONNECTION_ERROR'
    
    // Loading state
    if (walletLoading && !isWalletConnected) return 'GMAIL_ONLY_WALLET_LOADING'
    
    // Gmail connected but no wallet yet
    if (!isWalletConnected) return 'GMAIL_ONLY_NO_WALLET'
    
    // Balance error (wallet connected but balance fetch failed)
    if (balanceError) return 'BALANCE_FETCH_ERROR'
    
    // Fully connected - Gmail + Wallet
    return 'FULLY_CONNECTED'
  }, [
    isGmailConnected,
    isWalletConnected,
    walletLoading,
    gmailAuthError,
    walletConnectionError,
    balanceError,
    connectionTimeout,
  ])
  
  // ============================================
  // Handlers
  // ============================================
  
  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      showToast('Address copied!', 'success')
      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[UnifiedAuthIndicator] Copy failed:', error)
      showToast('Failed to copy address', 'error')
    }
  }, [walletAddress, showToast])
  
  const handleViewExplorer = useCallback(() => {
    if (walletAddress && chainId) {
      // Find the network config by chainId
      const networkEntry = Object.values(NETWORKS).find(n => n.chainId === chainId)
      if (networkEntry) {
        window.open(`${networkEntry.blockExplorer}/address/${walletAddress}`, '_blank', 'noopener,noreferrer')
      } else {
        // Fallback to active network
        window.open(getAddressUrl(walletAddress), '_blank', 'noopener,noreferrer')
      }
    }
  }, [walletAddress, chainId])
  
  const handleDisconnect = useCallback(async () => {
    await walletDisconnect()
    setIsDropdownOpen(false)
    showToast('Wallet disconnected', 'success')
  }, [walletDisconnect, showToast])
  
  const handleSignOut = useCallback(async () => {
    await handleFullLogout()
    setIsDropdownOpen(false)
  }, [handleFullLogout])
  
  // Debounced versions for rapid click protection
  const debouncedGmailLogin = useDebounce(gmailLogin, DEBOUNCE_MS)
  const debouncedRetryGmail = useDebounce(retryGmailAuth, DEBOUNCE_MS)
  const debouncedRetryWallet = useDebounce(retryWalletConnection, DEBOUNCE_MS)
  
  /**
   * Opens RainbowKit modal for external wallet connection.
   */
  const handleExternalConnect = useCallback(() => {
    if (isConnectingWallet) return
    setIsConnectingWallet(true)
    setIsDropdownOpen(false)
    setTimeout(() => {
      openConnectModal?.()
      setIsConnectingWallet(false)
    }, 150)
  }, [isConnectingWallet, openConnectModal])

  /**
   * Opens CDP SignInModal for email wallet.
   */
  const handleEmailWalletConnect = useCallback(() => {
    if (isConnectingWallet) return
    setIsConnectingWallet(true)
    setIsDropdownOpen(false)
    setShowCdpModal(true)
  }, [isConnectingWallet])

  /**
   * Called when CDP auth succeeds or modal closes/dismissed.
   */
  const handleCdpComplete = useCallback(() => {
    setShowCdpModal(false)
    setIsConnectingWallet(false)
  }, [])
  
  /**
   * Handle network switch/selection
   * - External wallets: Actually switch the connected chain
   * - CDP wallets: Update selected network (for balance display & default)
   */
  const handleNetworkSwitch = useCallback(async (targetChainId: number) => {
    // Don't switch if already on this chain
    if (targetChainId === chainId) return
    
    // Check if network is active/supported
    if (!isActiveNetwork(targetChainId)) {
      showToast('This network is not yet available', 'warning')
      return
    }
    
    const networkName = Object.values(NETWORKS).find(n => n.chainId === targetChainId)?.name || 'Network'
    
    // CDP wallets: Just update the selected network (no actual switch needed)
    if (isMultichain) {
      setSelectedCdpNetwork(targetChainId)
      localStorage.setItem('mintmarks_selected_network', targetChainId.toString())
      showToast(`Viewing ${networkName}`, 'success')
      return
    }
    
    // External wallets: Actually switch the chain
    if (!canSwitchChain || !switchChain) {
      return
    }
    
    setIsSwitchingNetwork(true)
    setSwitchingToChainId(targetChainId)
    
    try {
      await switchChain(targetChainId)
      showToast(`Switched to ${networkName}`, 'success')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[UnifiedAuthIndicator] Network switch failed:', error)
      }
      showToast('Failed to switch network. Please try again.', 'error')
    } finally {
      setIsSwitchingNetwork(false)
      setSwitchingToChainId(null)
    }
  }, [chainId, canSwitchChain, switchChain, isMultichain, showToast])
  
  // ============================================
  // Touch Handlers (Mobile Support)
  // ============================================
  
  const handleTouchStart = useCallback(() => {
    touchStartTimeRef.current = Date.now()
    
    // Start long press timer for copy
    longPressTimerRef.current = setTimeout(() => {
      handleCopyAddress()
    }, LONG_PRESS_MS)
  }, [handleCopyAddress])
  
  const handleTouchEnd = useCallback(() => {
    const touchDuration = Date.now() - touchStartTimeRef.current
    
    // Cancel long press if it was a short tap
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    // Short tap: show address temporarily
    if (touchDuration < LONG_PRESS_MS) {
      setIsTouched(true)
      
      // Clear existing timer
      if (touchDisplayTimerRef.current) {
        clearTimeout(touchDisplayTimerRef.current)
      }
      
      // Hide address after delay
      touchDisplayTimerRef.current = setTimeout(() => {
        setIsTouched(false)
      }, TOUCH_ADDRESS_DISPLAY_MS)
    }
  }, [])
  
  // Cleanup touch timers
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      if (touchDisplayTimerRef.current) clearTimeout(touchDisplayTimerRef.current)
    }
  }, [])
  
  // ============================================
  // Keyboard Handler (Accessibility)
  // ============================================
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        // Toggle dropdown or trigger action based on state
        if (currentState === 'FULLY_CONNECTED') {
          setIsDropdownOpen(prev => !prev)
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        break
      case 'c':
        // Ctrl+C or Cmd+C to copy address
        if ((e.ctrlKey || e.metaKey) && walletAddress) {
          e.preventDefault()
          handleCopyAddress()
        }
        break
    }
  }, [currentState, walletAddress, handleCopyAddress])
  
  // ============================================
  // ARIA Label Generator
  // ============================================
  
  const getAriaLabel = useCallback((): string => {
    switch (currentState) {
      case 'NOT_AUTHENTICATED':
        return 'Sign in with email to get started'
      case 'GMAIL_AUTH_ERROR':
        return 'Authentication error. Click to retry.'
      case 'GMAIL_ONLY_NO_WALLET':
        return `Signed in as ${emailName}. Click to connect wallet.`
      case 'GMAIL_ONLY_WALLET_LOADING':
        return `Signed in as ${emailName}. Connecting wallet...`
      case 'WALLET_CONNECTION_ERROR':
        return `Signed in as ${emailName}. Wallet connection failed. Click to retry.`
      case 'BALANCE_FETCH_ERROR':
        return `Wallet connected. Balance error. Click to open wallet menu.`
      case 'FULLY_CONNECTED':
        return `Wallet balance: ${formattedBalance}. Email: ${emailName}. Click to open wallet menu.`
      default:
        return 'Authentication status'
    }
  }, [currentState, emailName, formattedBalance])
  
  // Helper for address truncation - shorter format for compact display
  const truncateAddress = (addr: string) => addr ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : ''
  
  // ============================================
  // Render: State 1 - NOT_AUTHENTICATED
  // ============================================
  
  if (currentState === 'NOT_AUTHENTICATED') {
    return (
      <Button
        onClick={debouncedGmailLogin}
        variant="outline"
        size="sm"
        className={cn('h-9 px-4 sm:px-5 gap-2 text-sm', className)}
        aria-label={getAriaLabel()}
      >
        <Mail className="w-4 h-4" aria-hidden="true" />
        Sign in
      </Button>
    )
  }
  
  // ============================================
  // Render: State 6 - GMAIL_AUTH_ERROR
  // ============================================
  
  if (currentState === 'GMAIL_AUTH_ERROR') {
    return (
      <button
        onClick={debouncedRetryGmail}
        className={cn(
          'flex items-center gap-2 h-9 px-4 sm:px-5 rounded-md text-sm',
          'transition-colors duration-200',
          className
        )}
        style={{
          backgroundColor: 'var(--gmail-icon-error-bg)',
          color: 'var(--gmail-icon-error-color)',
          transform: 'none',
          translate: 'none',
        }}
        aria-label={getAriaLabel()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        <span>Auth Error</span>
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
      </button>
    )
  }
  
  // ============================================
  // Render: State 7 - WALLET_CONNECTION_ERROR
  // ============================================
  
  if (currentState === 'WALLET_CONNECTION_ERROR') {
    return (
      <button
        onClick={debouncedRetryWallet}
        className={cn(
          'flex items-center gap-2 h-9 px-4 sm:px-5 rounded-md text-sm',
          'transition-colors duration-200',
          className
        )}
        style={{
          backgroundColor: 'var(--wallet-icon-error-bg)',
          color: 'var(--wallet-icon-error-color)',
          transform: 'none',
          translate: 'none',
        }}
        aria-label={getAriaLabel()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <Mail 
          className="w-4 h-4" 
          style={{ color: 'var(--gmail-icon-connected-color)' }}
          aria-hidden="true" 
        />
        <span className="text-muted-foreground">{emailName}</span>
        <div className="w-px h-4 bg-border/60 mx-0.5" aria-hidden="true" />
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
      </button>
    )
  }
  
  // ============================================
  // Render: States 2 & 3 - GMAIL_ONLY_*
  // ============================================
  
  if (currentState === 'GMAIL_ONLY_NO_WALLET' || currentState === 'GMAIL_ONLY_WALLET_LOADING') {
    const isLoading = currentState === 'GMAIL_ONLY_WALLET_LOADING'
    
    return (
      <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center justify-start gap-2 h-9 px-4 sm:px-5 rounded-md text-sm',
              'bg-muted/50 hover:bg-muted border border-border/50',
              'transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isLoading && 'cursor-wait',
              isDropdownOpen && 'bg-muted',
              className
            )}
            style={{
              transform: 'none',
              translate: 'none',
            }}
            aria-label={getAriaLabel()}
            aria-busy={isLoading}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <Wallet 
              className="w-4 h-4"
              style={{ color: 'var(--wallet-icon-warning-color)' }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              {isLoading ? 'Connecting...' : emailName}
            </span>
            <ChevronDown 
              className={cn(
                'w-4 h-4 text-muted-foreground/60 transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )} 
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-64 p-0" 
          sideOffset={4}
        >
          {/* Section 1: Account (Email) */}
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: 'var(--glass-bg-secondary)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <span 
                  className="text-sm text-foreground truncate cursor-default"
                  title={userEmail ?? undefined}
                >
                  {userEmail}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="p-2 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/10 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          {/* Section 2: Wallet Connection Options */}
          <div className="p-3 space-y-2">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
              Connect Wallet
            </span>
            
            {/* Email Wallet Option (CDP) - Recommended */}
            {isCDPConfigured && (
              <button
                onClick={handleEmailWalletConnect}
                disabled={isCdpConnected || isLoading || isConnectingWallet}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left',
                  'hover:bg-white/5 dark:hover:bg-white/[0.03]',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'group'
                )}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{ 
                    background: 'var(--glass-bg-secondary)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--Controls-Selected)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium block" style={{ color: 'var(--page-text-primary)' }}>Email Wallet</span>
                    <span 
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ 
                        background: 'var(--glass-bg-secondary)',
                        color: 'var(--page-text-secondary)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      Easy
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--page-text-muted)' }}>New to crypto? Start here</span>
                </div>
              </button>
            )}
            
            {/* External Wallet Option */}
            <button
              onClick={handleExternalConnect}
              disabled={isExternalConnected || isLoading || isConnectingWallet}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group'
              )}
              style={{
                background: 'transparent',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ 
                  background: 'var(--glass-bg-secondary)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <Wallet className="w-4 h-4" style={{ color: 'var(--page-text-secondary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block" style={{ color: 'var(--page-text-primary)' }}>Browser Wallet</span>
                <span className="text-[10px]" style={{ color: 'var(--page-text-muted)' }}>MetaMask, Rabby, Coinbase</span>
              </div>
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* CDP SignInModal - rendered outside dropdown to prevent unmounting */}
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
  
  // ============================================
  // Render: States 4, 5, 8 - FULLY_CONNECTED & BALANCE_ERROR
  // ============================================
  
  const hasBalanceError = currentState === 'BALANCE_FETCH_ERROR'
  
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-md text-sm',
            'bg-muted/50 hover:bg-muted border border-border/50',
            'transition-colors transition-opacity duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'min-w-[160px]', // Fixed width to prevent layout shift
            isDropdownOpen && 'bg-muted',
            className
          )}
          style={{
            transform: 'none',
            translate: 'none',
          }}
          aria-label={getAriaLabel()}
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
          tabIndex={0}
        >
          {/* Network Icon */}
          <NetworkIcon chainId={chainId} />
          
          {/* Balance/Address Container - Fixed width to prevent layout shift */}
          <div 
            className="relative flex items-center gap-1 w-[70px] shrink-0"
            style={showAddress ? { cursor: 'copy' } : undefined}
            onClick={showAddress ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopyAddress()
            } : undefined}
            onPointerDown={showAddress ? (e) => e.stopPropagation() : undefined}
            title={walletAddress ?? undefined}
          >
            {balanceLoading ? (
              <span className="font-medium tabular-nums text-foreground animate-pulse">...</span>
            ) : hasBalanceError ? (
              <span 
                className="text-xs font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  retryBalanceFetch()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ color: 'var(--wallet-icon-error-color)', cursor: 'pointer' }}
              >
                Error
              </span>
            ) : (
              <>
                {/* Balance - visible when not showing address */}
                <span 
                  className={cn(
                    "font-medium tabular-nums text-foreground truncate transition-opacity duration-150",
                    showAddress ? "opacity-0 absolute" : "opacity-100"
                  )}
                  title={formattedBalance}
                >
                  {formattedBalance}
                </span>
                
                {/* Address + Copy Icon - visible on hover */}
                <span
                  className={cn(
                    "font-mono text-xs text-foreground flex items-center gap-0.5 transition-opacity duration-150 min-w-0",
                    showAddress ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                  )}
                  title={walletAddress ?? undefined}
                >
                  <span className="truncate min-w-0">{truncateAddress(walletAddress || '')}</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                </span>
              </>
            )}
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-border/60 mx-0.5" aria-hidden="true" />
          
          {/* Email */}
          <span className="text-muted-foreground text-xs">{emailName}</span>
          
          {/* Chevron */}
          <ChevronDown 
            className={cn(
              'w-4 h-4 text-muted-foreground/60 transition-transform duration-200',
              isDropdownOpen && 'rotate-180'
            )} 
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-0" 
        sideOffset={4}
      >
        {/* Section 1: Account (Email) */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: 'var(--glass-bg-secondary)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <span 
                className="text-sm text-foreground truncate cursor-default"
                title={userEmail ?? undefined}
              >
                {userEmail}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="p-2 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/10 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Section 2: Wallet */}
        <div className="p-3 space-y-3">
          {/* Balance + Network */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NetworkIcon chainId={chainId} size="md" />
              <span className="text-lg font-semibold tracking-tight">
                {hasBalanceError ? 'Error' : formattedBalance}
              </span>
              {hasBalanceError && (
                <button
                  onClick={retryBalanceFetch}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Retry balance fetch"
                >
                  <RefreshCw className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-medium">{networkName}</span>
          </div>
          
          {/* Wallet Address + Actions */}
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-foreground/80 font-mono truncate flex-1">
              {walletAddress}
            </code>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={handleCopyAddress}
                className={cn(
                  'p-1.5 rounded-md transition-all duration-200',
                  'hover:bg-white/10',
                  copied ? 'text-green-400' : 'text-muted-foreground/50 hover:text-muted-foreground'
                )}
                aria-label={copied ? 'Address copied' : 'Copy address'}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleViewExplorer}
                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/10 transition-all duration-200"
                aria-label="View on explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDisconnect}
                className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/10 transition-all duration-200"
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Section 3: Networks */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
              Networks
            </span>
            {isMultichain && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                Multichain
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {(Object.entries(NETWORKS) as [NetworkKey, typeof NETWORKS[NetworkKey]][]).map(([key, network]) => {
              const isActive = isActiveNetwork(network.chainId)
              const isCurrent = network.chainId === chainId
              const isSwitchingToThis = switchingToChainId === network.chainId
              const canClick = isActive && !isCurrent && !isSwitchingNetwork
              
              return (
                <button
                  key={key}
                  onClick={() => canClick && handleNetworkSwitch(network.chainId)}
                  disabled={!isActive || isCurrent || isSwitchingNetwork}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs w-full text-left',
                    'transition-all duration-200',
                    isCurrent && 'bg-primary/10',
                    !isActive && 'opacity-35',
                    canClick && 'hover:bg-white/8 cursor-pointer',
                    (!isActive || isCurrent) && 'cursor-default',
                    isSwitchingNetwork && !isSwitchingToThis && 'opacity-50'
                  )}
                  aria-label={
                    isCurrent 
                      ? `${network.name} - Current network` 
                      : isActive 
                        ? `Switch to ${network.name}` 
                        : `${network.name} - Coming soon`
                  }
                >
                  <NetworkIcon chainId={network.chainId} />
                  <span className={cn('flex-1', isCurrent && 'font-medium')}>{network.name}</span>
                  
                  <div className="flex items-center">
                    {isSwitchingToThis && (
                      <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" aria-hidden="true" />
                    )}
                    {isCurrent && !isSwitchingToThis && (
                      <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    )}
                    {!isActive && (
                      <span className="text-[9px] text-muted-foreground/50 font-medium">Soon</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          
          {isMultichain && (
            <p className="text-[9px] text-muted-foreground/50 px-1 mt-2.5 leading-relaxed">
              Your CDP wallet works on all chains. Select a network to view balance.
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

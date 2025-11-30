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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useToast } from '@/contexts/ToastContext'
import { ACTIVE_NETWORK, NETWORKS, getAddressUrl, type NetworkKey } from '@/config/contracts'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

interface UnifiedAuthIndicatorProps {
  className?: string
  onWalletClick?: () => void
}

type AuthState = 
  | 'NOT_AUTHENTICATED'
  | 'GMAIL_ONLY_NO_WALLET'
  | 'GMAIL_ONLY_WALLET_LOADING'
  | 'FULLY_CONNECTED'
  | 'GMAIL_AUTH_ERROR'
  | 'WALLET_CONNECTION_ERROR'
  | 'BALANCE_FETCH_ERROR'

// Active networks for display
const ACTIVE_NETWORK_IDS = [84532, 11155111] // Base Sepolia, Ethereum Sepolia

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
  onWalletClick,
}: UnifiedAuthIndicatorProps) {
  const { showToast } = useToast()
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
  } = useAuthStatus()
  
  // UI State
  const [copied, setCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  
  // Touch handling refs
  const touchStartTimeRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchDisplayTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Derived values
  const chainId = ACTIVE_NETWORK.chainId
  const emailName = userEmail?.split('@')[0]?.slice(0, 10) || ''
  
  // Show address when hovered (desktop) or touched (mobile), but not when dropdown is open
  const showAddress = (isHovered || isTouched) && !isDropdownOpen
  
  // ============================================
  // State Machine
  // ============================================
  
  const currentState: AuthState = useMemo(() => {
    if (gmailAuthError) return 'GMAIL_AUTH_ERROR'
    if (!isGmailConnected) return 'NOT_AUTHENTICATED'
    if (walletConnectionError || connectionTimeout) return 'WALLET_CONNECTION_ERROR'
    if (walletLoading) return 'GMAIL_ONLY_WALLET_LOADING'
    if (!isWalletConnected) return 'GMAIL_ONLY_NO_WALLET'
    if (balanceError) return 'BALANCE_FETCH_ERROR'
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
    if (walletAddress) {
      window.open(getAddressUrl(walletAddress), '_blank', 'noopener,noreferrer')
    }
  }, [walletAddress])
  
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
  const debouncedRetryWallet = useDebounce(() => {
    retryWalletConnection()
    onWalletClick?.()
  }, DEBOUNCE_MS)
  
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
        className={cn('h-8 px-3 gap-1.5 text-sm', className)}
        aria-label={getAriaLabel()}
      >
        <Mail className="w-3.5 h-3.5" aria-hidden="true" />
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
          'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm',
          'transition-colors duration-200',
          className
        )}
        style={{
          backgroundColor: 'var(--gmail-icon-error-bg)',
          color: 'var(--gmail-icon-error-color)',
        }}
        aria-label={getAriaLabel()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Auth Error</span>
        <RefreshCw className="w-3 h-3" aria-hidden="true" />
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
          'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm',
          'transition-colors duration-200',
          className
        )}
        style={{
          backgroundColor: 'var(--wallet-icon-error-bg)',
          color: 'var(--wallet-icon-error-color)',
        }}
        aria-label={getAriaLabel()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <Mail 
          className="w-3.5 h-3.5" 
          style={{ color: 'var(--gmail-icon-connected-color)' }}
          aria-hidden="true" 
        />
        <span className="text-muted-foreground">{emailName}</span>
        <div className="w-px h-3.5 bg-border/60 mx-0.5" aria-hidden="true" />
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
        <RefreshCw className="w-3 h-3" aria-hidden="true" />
      </button>
    )
  }
  
  // ============================================
  // Render: States 2 & 3 - GMAIL_ONLY_*
  // ============================================
  
  if (currentState === 'GMAIL_ONLY_NO_WALLET' || currentState === 'GMAIL_ONLY_WALLET_LOADING') {
    const isLoading = currentState === 'GMAIL_ONLY_WALLET_LOADING'
    
    return (
      <button
        onClick={() => !isLoading && onWalletClick?.()}
        className={cn(
          'flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm',
          'bg-muted/50 hover:bg-muted border border-border/50',
          'transition-colors duration-200',
          isLoading && 'cursor-wait',
          className
        )}
        disabled={isLoading}
        aria-label={getAriaLabel()}
        aria-busy={isLoading}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <Mail 
          className="w-3.5 h-3.5"
          style={{ color: 'var(--gmail-icon-connected-color)' }}
          aria-hidden="true"
        />
        <span className="text-muted-foreground">
          {isLoading ? 'Connecting...' : emailName}
        </span>
        <Wallet 
          className="w-3.5 h-3.5"
          style={{ color: 'var(--wallet-icon-disconnected-color)' }}
          aria-hidden="true"
        />
      </button>
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
            'flex items-center gap-1 h-8 pl-1.5 pr-2 rounded-md text-sm',
            'bg-muted/50 hover:bg-muted border border-border/50',
            'transition-all duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'min-w-[160px]', // Fixed width to prevent layout shift
            isDropdownOpen && 'bg-muted',
            className
          )}
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
            onClick={showAddress ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopyAddress()
            } : undefined}
            onPointerDown={showAddress ? (e) => e.stopPropagation() : undefined}
            style={showAddress ? { cursor: 'copy' } : undefined}
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
                  title={walletAddress}
                >
                  <span className="truncate min-w-0">{truncateAddress(walletAddress || '')}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                </span>
              </>
            )}
          </div>
          
          {/* Divider */}
          <div className="w-px h-3.5 bg-border/60 mx-0.5" aria-hidden="true" />
          
          {/* Email */}
          <span className="text-muted-foreground text-xs">{emailName}</span>
          
          {/* Chevron */}
          <ChevronDown 
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200',
              isDropdownOpen && 'rotate-180'
            )} 
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-60 p-0" 
        sideOffset={4}
      >
        {/* Header - Balance & Network */}
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <NetworkIcon chainId={chainId} size="md" />
              <span className="font-semibold">
                {hasBalanceError ? 'Balance Error' : formattedBalance}
              </span>
              {hasBalanceError && (
                <button
                  onClick={retryBalanceFetch}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  aria-label="Retry balance fetch"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{networkName}</span>
          </div>
          
          {/* Full Address */}
          <code className="text-[11px] text-muted-foreground font-mono block truncate">
            {walletAddress}
          </code>
        </div>
        
        {/* Quick Actions */}
        <div className="p-2 border-b border-border/50">
          <div className="flex gap-1.5">
            <button
              onClick={handleCopyAddress}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs',
                'bg-muted/50 hover:bg-muted transition-colors',
                copied && 'text-green-600'
              )}
              aria-label={copied ? 'Address copied' : 'Copy address'}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleViewExplorer}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs bg-muted/50 hover:bg-muted transition-colors"
              aria-label="View on block explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Explorer
            </button>
          </div>
        </div>
        
        {/* Networks */}
        <div className="p-2 border-b border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
            Networks
          </div>
          <div className="space-y-0.5">
            {(Object.entries(NETWORKS) as [NetworkKey, typeof NETWORKS[NetworkKey]][]).map(([key, network]) => {
              const isActive = ACTIVE_NETWORK_IDS.includes(network.chainId)
              const isCurrent = network.chainId === chainId
              
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
                    isCurrent && 'bg-primary/10',
                    !isActive && 'opacity-40'
                  )}
                  role="listitem"
                >
                  <NetworkIcon chainId={network.chainId} />
                  <span className={cn(isCurrent && 'font-medium')}>{network.name}</span>
                  {isCurrent && <Check className="w-3 h-3 text-primary ml-auto" aria-hidden="true" />}
                  {!isActive && (
                    <span className="text-[9px] text-muted-foreground ml-auto">Soon</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Logout Actions */}
        <div className="p-2">
          <div className="flex gap-1.5">
            <button
              onClick={handleDisconnect}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Disconnect wallet only"
            >
              <Power className="w-3.5 h-3.5" />
              Disconnect
            </button>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Sign out completely"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isLoggingOut ? '...' : 'Sign out'}
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

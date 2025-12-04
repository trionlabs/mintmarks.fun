/**
 * @fileoverview Unified Auth Status Hook
 * 
 * Combines Gmail authentication and wallet connection into a single interface.
 * Provides balance fetching, error handling, and retry functionality.
 * 
 * Used by UnifiedAuthIndicator component for displaying auth status.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPublicClient, http, formatEther } from 'viem'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/wallet'
import { useToast } from '@/contexts/ToastContext'
import { ACTIVE_NETWORK, NETWORKS } from '@/config/contracts'
import { getViemChain, getNativeSymbol, isTestnet } from '@/config/chains'

// ============================================
// Types
// ============================================

export interface AuthStatusError {
  type: 'gmail' | 'wallet' | 'balance'
  message: string
  originalError?: unknown
}

export interface AuthStatus {
  // Gmail Auth
  isGmailConnected: boolean
  userEmail: string | null
  gmailLogin: () => void
  gmailLogout: () => void

  // Wallet
  isWalletConnected: boolean
  walletAddress: string | null
  walletSource: 'cdp' | 'external' | null
  walletLoading: boolean
  walletDisconnect: () => Promise<void>

  // Balance
  balance: number
  balanceLoading: boolean
  balanceSymbol: string
  formattedBalance: string

  // Network
  networkName: string
  isTestnet: boolean

  // Error States
  gmailAuthError: AuthStatusError | null
  walletConnectionError: AuthStatusError | null
  balanceError: AuthStatusError | null

  // Retry Functions
  retryGmailAuth: () => void
  retryWalletConnection: () => void
  retryBalanceFetch: () => void

  // Combined States
  connectionTimeout: boolean
  needsWalletCreation: boolean
  isFullyConnected: boolean

  // Full Logout (Gmail + Wallet)
  handleFullLogout: () => Promise<void>
  isLoggingOut: boolean
}

// ============================================
// Constants
// ============================================

const CONNECTION_TIMEOUT_MS = 10000 // 10 seconds
const BALANCE_FETCH_TIMEOUT_MS = 5000 // 5 seconds
const BALANCE_REFRESH_INTERVAL_MS = 30000 // 30 seconds

// ============================================
// Helpers
// ============================================

// Note: getViemChain and getNativeSymbol imported from @/config/chains

/**
 * Format balance for display
 */
function formatBalance(balance: number, symbol: string): string {
  if (balance === 0) return `0.00 ${symbol}`
  if (balance < 0.0001) return `<0.0001 ${symbol}`
  if (balance < 0.01) return `${balance.toFixed(4)} ${symbol}`
  if (balance < 1) return `${balance.toFixed(3)} ${symbol}`
  return `${balance.toFixed(2)} ${symbol}`
}

// ============================================
// Hook
// ============================================

interface UseAuthStatusOptions {
  /** Override the chain ID for balance fetching (useful for CDP multichain wallets) */
  overrideChainId?: number
}

export function useAuthStatus(options: UseAuthStatusOptions = {}): AuthStatus {
  const { overrideChainId } = options
  const { showToast } = useToast()

  // Auth context
  const {
    isAuthenticated: isGmailConnected,
    userInfo,
    login: gmailLogin,
    logout: gmailLogout,
  } = useAuth()

  // Wallet context
  const {
    isConnected: isWalletConnected,
    address: walletAddress,
    source: walletSource,
    isLoading: walletLoading,
    disconnect: walletDisconnect,
    error: walletContextError,
    chainId: walletChainId,
  } = useWallet()

  // Local state
  const [balance, setBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [connectionTimeout, setConnectionTimeout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Error states
  const [gmailAuthError, setGmailAuthError] = useState<AuthStatusError | null>(null)
  const [walletConnectionError, setWalletConnectionError] = useState<AuthStatusError | null>(null)
  const [balanceError, setBalanceError] = useState<AuthStatusError | null>(null)

  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Computed values
  // Priority: override > wallet's chainId > ACTIVE_NETWORK (fallback for CDP)
  const chainId = overrideChainId ?? walletChainId ?? ACTIVE_NETWORK.chainId
  const balanceSymbol = getNativeSymbol(chainId)
  const formattedBalance = formatBalance(balance, balanceSymbol)
  const userEmail = userInfo?.email ?? null
  // Get network name from chainId (dynamic for external wallets)
  const networkConfig = Object.values(NETWORKS).find(n => n.chainId === chainId)
  const networkName = networkConfig?.name ?? ACTIVE_NETWORK.name
  const isTestnetNetwork = isTestnet(chainId)

  // ============================================
  // Balance Fetching
  // ============================================

  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return

    // Abort previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setBalanceLoading(true)
    setBalanceError(null)

    try {
      const chain = getViemChain(chainId)
      const network = Object.values(NETWORKS).find(n => n.chainId === chainId)

      const client = createPublicClient({
        chain,
        transport: http(network?.rpcUrl),
      })

      // Add timeout
      const balancePromise = client.getBalance({
        address: address as `0x${string}`,
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Balance fetch timeout')), BALANCE_FETCH_TIMEOUT_MS)
      })

      const balanceWei = await Promise.race([balancePromise, timeoutPromise])
      const balanceEth = parseFloat(formatEther(balanceWei))

      setBalance(balanceEth)
      setBalanceError(null)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return

      if (import.meta.env.DEV) {
        console.error('[useAuthStatus] Balance fetch failed:', error)
      }
      setBalanceError({
        type: 'balance',
        message: 'Failed to load balance',
        originalError: error,
      })
    } finally {
      setBalanceLoading(false)
    }
  }, [chainId])

  // ============================================
  // Connection Timeout
  // ============================================

  useEffect(() => {
    // Reset timeout flag immediately when wallet connects
    // This is critical for Gmail + External wallet flow
    if (isWalletConnected) {
      setConnectionTimeout(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }
    
    // Only track timeout when Gmail is connected but wallet is loading
    if (isGmailConnected && walletLoading && !isWalletConnected) {
      timeoutRef.current = setTimeout(() => {
        setConnectionTimeout(true)
        if (import.meta.env.DEV) {
          console.warn('[useAuthStatus] Wallet connection timeout')
        }
      }, CONNECTION_TIMEOUT_MS)
    } else {
      // Clear timeout timer (but don't reset flag - it will reset when wallet connects)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isGmailConnected, walletLoading, isWalletConnected])

  // ============================================
  // Balance Auto-Refresh
  // ============================================

  useEffect(() => {
    if (isWalletConnected && walletAddress) {
      // Initial fetch
      fetchBalance(walletAddress)

      // OPTIMIZED: Only refresh balance when tab is visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchBalance(walletAddress)
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Set up interval (only when tab is visible)
      balanceIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchBalance(walletAddress)
        }
      }, BALANCE_REFRESH_INTERVAL_MS)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (balanceIntervalRef.current) {
          clearInterval(balanceIntervalRef.current)
          balanceIntervalRef.current = null
        }
        abortControllerRef.current?.abort()
      }
    } else {
      // Reset balance when disconnected
      setBalance(0)
      setBalanceError(null)
      // Clean up any existing interval
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current)
        balanceIntervalRef.current = null
      }
    }
  }, [isWalletConnected, walletAddress, fetchBalance, chainId]) // Re-fetch when chain changes

  // ============================================
  // Wallet Context Error Handling
  // ============================================

  useEffect(() => {
    if (walletContextError) {
      setWalletConnectionError({
        type: 'wallet',
        message: walletContextError.message,
        originalError: walletContextError,
      })
    } else {
      setWalletConnectionError(null)
    }
  }, [walletContextError])

  // ============================================
  // Retry Functions
  // ============================================

  const retryGmailAuth = useCallback(() => {
    setGmailAuthError(null)
    gmailLogin()
  }, [gmailLogin])

  const retryWalletConnection = useCallback(() => {
    setWalletConnectionError(null)
    setConnectionTimeout(false)
    // Wallet connection is handled by ConnectWalletModal
    // This just clears the error state
  }, [])

  const retryBalanceFetch = useCallback(() => {
    if (walletAddress) {
      fetchBalance(walletAddress)
    }
  }, [walletAddress, fetchBalance])

  // ============================================
  // Full Logout (Gmail + Wallet)
  // ============================================

  const handleFullLogout = useCallback(async () => {
    setIsLoggingOut(true)

    try {
      // 1. Disconnect wallet first (if connected)
      if (isWalletConnected) {
        await walletDisconnect()
      }

      // 2. Logout Gmail
      gmailLogout()

      // 3. Clear all state
      setBalance(0)
      setBalanceError(null)
      setWalletConnectionError(null)
      setConnectionTimeout(false)

      showToast('Logged out successfully', 'success')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[useAuthStatus] Logout failed:', error)
      }
      showToast('Failed to logout completely', 'error')
    } finally {
      setIsLoggingOut(false)
    }
  }, [isWalletConnected, walletDisconnect, gmailLogout, showToast])

  // ============================================
  // Linked Logout Listener
  // ============================================

  useEffect(() => {
    const handleAuthLogout = () => {
      if (isWalletConnected) {
        walletDisconnect().catch(err => {
          if (import.meta.env.DEV) {
            console.error('[useAuthStatus] Failed to disconnect wallet on auth:logout:', err)
          }
        })
      }
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [isWalletConnected, walletDisconnect])

  // ============================================
  // Computed States
  // ============================================

  const needsWalletCreation = isGmailConnected && !isWalletConnected && !walletLoading
  const isFullyConnected = isGmailConnected && isWalletConnected

  // ============================================
  // Return Value
  // ============================================

  return useMemo(() => ({
    // Gmail Auth
    isGmailConnected,
    userEmail,
    gmailLogin,
    gmailLogout,

    // Wallet
    isWalletConnected,
    walletAddress,
    walletSource,
    walletLoading,
    walletDisconnect,

    // Balance
    balance,
    balanceLoading,
    balanceSymbol,
    formattedBalance,

    // Network
    networkName,
    isTestnet: isTestnetNetwork,

    // Error States
    gmailAuthError,
    walletConnectionError,
    balanceError,

    // Retry Functions
    retryGmailAuth,
    retryWalletConnection,
    retryBalanceFetch,

    // Combined States
    connectionTimeout,
    needsWalletCreation,
    isFullyConnected,

    // Full Logout
    handleFullLogout,
    isLoggingOut,
  }), [
    isGmailConnected,
    userEmail,
    gmailLogin,
    gmailLogout,
    isWalletConnected,
    walletAddress,
    walletSource,
    walletLoading,
    walletDisconnect,
    balance,
    balanceLoading,
    balanceSymbol,
    formattedBalance,
    networkName,
    isTestnet,
    gmailAuthError,
    walletConnectionError,
    balanceError,
    retryGmailAuth,
    retryWalletConnection,
    retryBalanceFetch,
    connectionTimeout,
    needsWalletCreation,
    isFullyConnected,
    handleFullLogout,
    isLoggingOut,
  ])
}


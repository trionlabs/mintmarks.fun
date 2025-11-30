/**
 * @fileoverview Core type definitions for the wallet module.
 * All wallet adapters must conform to these types.
 */

/**
 * Identifies the source/provider of the connected wallet.
 */
export type WalletSource = 'cdp' | 'external' | null

/**
 * Current state of a wallet connection.
 */
export interface WalletState {
  /** Connected wallet address, or null if not connected */
  address: `0x${string}` | null
  /** Whether a wallet is currently connected */
  isConnected: boolean
  /** The source/provider of the connected wallet */
  source: WalletSource
  /** Chain ID the wallet is connected to (null for multichain wallets) */
  chainId: number | null
  /** Whether an operation is in progress */
  isLoading: boolean
  /** Most recent error, if any */
  error: WalletError | null
  /** 
   * Whether the wallet is multichain (same address works on all EVM chains).
   * CDP embedded wallets are multichain - no switch needed.
   */
  isMultichain: boolean
}

/**
 * Transaction request parameters.
 * Works across all wallet providers.
 */
export interface TransactionRequest {
  /** Recipient address */
  to: `0x${string}`
  /** Amount in wei (optional) */
  value?: bigint
  /** Transaction data for contract calls (optional) */
  data?: `0x${string}`
  /** Target chain ID (optional - defaults to ACTIVE_NETWORK) */
  chainId?: number
}

/**
 * Result of a successful transaction.
 */
export interface TransactionResult {
  /** Transaction hash */
  hash: `0x${string}`
}

/**
 * Actions that can be performed with a connected wallet.
 */
export interface WalletActions {
  /** Send a transaction */
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResult>
  /** Disconnect the wallet */
  disconnect: () => Promise<void>
  /** 
   * Switch to a different chain (external wallets only).
   * CDP wallets don't need this - they're multichain native.
   */
  switchChain?: (chainId: number) => Promise<void>
}

/**
 * Complete unified wallet interface.
 * This is what components receive from useWallet().
 */
export interface UnifiedWallet extends WalletState, WalletActions {
  /** Whether this wallet supports chain switching */
  canSwitchChain: boolean
}

/**
 * Normalized error types.
 */
export type WalletErrorType =
  | 'NOT_CONNECTED'
  | 'WRONG_NETWORK'
  | 'INSUFFICIENT_FUNDS'
  | 'USER_REJECTED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

/**
 * Normalized wallet error.
 */
export interface WalletError {
  type: WalletErrorType
  message: string
  originalError?: unknown
}

/**
 * Interface for wallet adapters.
 */
export interface WalletAdapter {
  state: WalletState
  sendTransaction?: (tx: TransactionRequest) => Promise<TransactionResult>
  disconnect: () => Promise<void>
  /** Switch chain (only for external wallets) */
  switchChain?: (chainId: number) => Promise<void>
}



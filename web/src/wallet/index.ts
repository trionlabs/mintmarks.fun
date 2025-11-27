/**
 * @fileoverview Wallet module public exports.
 * 
 * Usage:
 * import { useWallet, WalletProvider, ConnectWalletModal } from '@/wallet'
 */

// Context & Hook (main API)
export { WalletProvider, useWallet } from './context'

// Components
export { ConnectWalletModal, WalletStatus } from './components'

// Types
export type {
  UnifiedWallet,
  WalletState,
  WalletSource,
  WalletError,
  WalletErrorType,
  TransactionRequest,
  TransactionResult,
  WalletAdapter,
  WalletActions,
} from './types'

// Utilities
export { truncateAddress, isValidAddress, formatAddress } from './utils'
export { normalizeError, createWalletError } from './utils'


/**
 * @fileoverview Error normalization utilities.
 * Converts provider-specific errors to consistent WalletError format.
 */

import type { WalletError, WalletErrorType } from '../types'

const ERROR_MESSAGES: Record<WalletErrorType, string> = {
  NOT_CONNECTED: 'Please connect your wallet first.',
  WRONG_NETWORK: 'Please switch to the correct network.',
  INSUFFICIENT_FUNDS: 'Insufficient balance for this transaction.',
  USER_REJECTED: 'Transaction was cancelled.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN: 'An unexpected error occurred.',
}

/**
 * Normalizes any error into a WalletError.
 */
export function normalizeError(error: unknown): WalletError {
  if (typeof error === 'string') {
    return { type: detectErrorType(error), message: error }
  }

  if (error instanceof Error) {
    const type = detectErrorType(error.message)
    return { type, message: ERROR_MESSAGES[type], originalError: error }
  }

  return { type: 'UNKNOWN', message: ERROR_MESSAGES.UNKNOWN, originalError: error }
}

/**
 * Detects error type from error message.
 */
function detectErrorType(message: string): WalletErrorType {
  const lower = message.toLowerCase()

  if (lower.includes('insufficient') || lower.includes('funds')) {
    return 'INSUFFICIENT_FUNDS'
  }
  if (lower.includes('rejected') || lower.includes('denied') || lower.includes('cancel')) {
    return 'USER_REJECTED'
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'NETWORK_ERROR'
  }
  if (lower.includes('wrong network') || lower.includes('switch')) {
    return 'WRONG_NETWORK'
  }

  return 'UNKNOWN'
}

/**
 * Creates a WalletError with specific type.
 */
export function createWalletError(
  type: WalletErrorType,
  customMessage?: string
): WalletError {
  return {
    type,
    message: customMessage ?? ERROR_MESSAGES[type],
  }
}



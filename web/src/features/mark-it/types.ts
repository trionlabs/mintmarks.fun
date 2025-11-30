/**
 * Mark It Flow Type Definitions
 * 
 * Flow order:
 * 1. Email Proof (runs in parallel, shown as terminal at top)
 * 2. Wallet (connect wallet)
 * 3. Passport (ZKPassport verification)
 * 4. Mint (final minting with network selection)
 */

import type { EmailMetadata } from '@/types/gmail'
import type { MintNetworkId } from '@/config/mintNetworks'

/**
 * Steps in the Mark It flow (user-facing steps)
 * Email proof runs in parallel and is NOT a step - it's shown as terminal
 */
export type MarkItStep = 'wallet' | 'passport' | 'mint' | 'success'

/**
 * Email proof status (runs in parallel, shown in terminal)
 */
export type EmailProofStatus =
  | 'idle'
  | 'loading-email'
  | 'initializing-wasm'
  | 'loading-circuit'
  | 'parsing-email'
  | 'generating-proof'
  | 'complete'
  | 'error'

/**
 * Terminal log entry for email proof display
 */
export interface TerminalLogEntry {
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error' | 'progress'
  progress?: number // 0-100
}

/**
 * Sub-states for passport step
 */
export type PassportSubStep =
  | 'waiting-proof'  // Waiting for email proof to complete
  | 'generating-qr'
  | 'waiting-scan'
  | 'verifying'
  | 'complete'
  | 'error'

/**
 * Sub-states for mint step
 */
export type MintSubStep =
  | 'waiting-proof'  // Waiting for email proof (if not done)
  | 'preparing'
  | 'checking-nullifier'
  | 'simulating'
  | 'ready-to-mint'  // Waiting for user to click "Mint" button (for CDP)
  | 'confirming'
  | 'pending'
  | 'complete'
  | 'error'

/**
 * Email proof result
 */
export interface EmailProofResult {
  proof: string
  publicInputs: string[]
  nullifier: string
  metadata: {
    eventName: string
    date: string
    domain: string
    proofTimeSeconds: number
    proofSizeKB: string
  }
}

/**
 * Passport proof result (ZKPassport format)
 */
export interface PassportProofResult {
  version: string
  proofVerificationData: {
    vkeyHash: string
    proof: string
    publicInputs: string[]
  }
  committedInputs: string
  serviceConfig: {
    validityPeriodInSeconds: number
    domain: string
    scope: string
    devMode: boolean
  }
}

/**
 * Mint result
 */
export interface MintResult {
  transactionHash: string
  tokenId?: string
  eventName: string
}

/**
 * Mark It flow state
 */
export interface MarkItFlowState {
  // Current user-facing step (Wallet → Passport → Mint → Success)
  step: MarkItStep
  
  // Progress (0-100) for the current step
  progress: number
  
  // Email being processed
  email: EmailMetadata | null
  
  // Email proof (runs in parallel, shown as terminal)
  emailProof: EmailProofResult | null
  emailProofStatus: EmailProofStatus
  emailProofProgress: number // 0-100
  terminalLogs: TerminalLogEntry[]
  
  // Passport
  passportProof: PassportProofResult | null
  passportSubStep: PassportSubStep
  passportQrUrl: string | null
  
  // Mint
  mintResult: MintResult | null
  mintSubStep: MintSubStep
  transactionHash: string | null
  
  // Network selection for minting
  selectedNetwork: MintNetworkId
  
  // Error (step-specific error, not email proof error)
  error: string | null
  
  // Demo mode
  isDemo: boolean
}

/**
 * Mark It flow actions
 */
export interface MarkItFlowActions {
  // Start the flow with an email
  start: (email: EmailMetadata) => void
  
  // Move to next step
  nextStep: () => void
  
  // Go back
  goBack: () => void
  
  // Cancel/close
  cancel: () => void
  
  // Retry current step
  retry: () => void
  
  // Set error
  setError: (error: string) => void
  
  // Set the network to mint on
  setNetwork: (network: MintNetworkId) => void
  
  // Prepare mint transaction (called when user clicks "Mint NFT" button)
  mint: () => void
  
  // Confirm and send mint transaction (for CDP wallets)
  confirmMint: () => void
}

/**
 * Complete flow hook return type
 */
export type UseMarkItFlowReturn = MarkItFlowState & MarkItFlowActions

/**
 * Props for step components
 */
export interface StepProps {
  state: MarkItFlowState
  onNext: () => void
  onCancel: () => void
  onRetry?: () => void
}

/**
 * Demo mode mock data
 */
export interface DemoMockData {
  emailProof: EmailProofResult
  passportProof: PassportProofResult
  mintResult: MintResult
}


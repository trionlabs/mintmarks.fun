/**
 * Mark It Flow Type Definitions
 */

import type { EmailMetadata } from '@/types/gmail'

/**
 * Steps in the Mark It flow
 */
export type MarkItStep = 'wallet' | 'email-proof' | 'passport' | 'mint' | 'success'

/**
 * Sub-states for email proof step
 */
export type EmailProofSubStep =
  | 'loading-email'
  | 'initializing-wasm'
  | 'loading-circuit'
  | 'parsing-email'
  | 'generating-proof'
  | 'complete'
  | 'error'

/**
 * Sub-states for passport step
 */
export type PassportSubStep =
  | 'waiting-wallet'
  | 'generating-qr'
  | 'waiting-scan'
  | 'verifying'
  | 'complete'
  | 'error'

/**
 * Sub-states for mint step
 */
export type MintSubStep =
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
  // Current step
  step: MarkItStep
  
  // Progress (0-100)
  progress: number
  
  // Email being processed
  email: EmailMetadata | null
  
  // Email proof
  emailProof: EmailProofResult | null
  emailProofSubStep: EmailProofSubStep
  emailProofProgress: { message: string; percent: number }
  
  // Passport
  passportProof: PassportProofResult | null
  passportSubStep: PassportSubStep
  passportQrUrl: string | null
  
  // Mint
  mintResult: MintResult | null
  mintSubStep: MintSubStep
  transactionHash: string | null
  
  // Error
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


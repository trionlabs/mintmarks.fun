/**
 * Mark It Flow Configuration
 */

import type { DemoMockData } from './types'

/**
 * Flow timing configuration
 */
export const FLOW_CONFIG = {
  // Auto-advance delays (ms)
  autoAdvanceDelay: 1500,
  
  // Progress update intervals
  proofProgressInterval: 500,
  
  // Timeouts
  emailProofTimeout: 120000, // 2 minutes
  passportTimeout: 300000, // 5 minutes
  mintTimeout: 60000, // 1 minute
}

/**
 * Demo mode configuration
 */
export const DEMO_CONFIG = {
  // Simulated delays for demo mode (ms)
  emailLoadDelay: 500,
  wasmInitDelay: 800,
  circuitLoadDelay: 1000,
  proofGenerateDelay: 3000,
  passportVerifyDelay: 2000,
  mintDelay: 2000,
}

/**
 * Demo mock data
 */
export const DEMO_MOCK_DATA: DemoMockData = {
  emailProof: {
    proof: '0x' + '00'.repeat(500), // Mock proof bytes
    publicInputs: [
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // pubkeyHash
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // nullifier
      '0x0000000000000000000000000000000000000000000000000000000000000000', // date (bounded vec)
      '0x0000000000000000000000000000000000000000000000000000000000000000', // event name (bounded vec)
    ],
    nullifier: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    metadata: {
      eventName: 'Demo Event 2024',
      date: 'December 1, 2024',
      domain: 'lu.ma',
      proofTimeSeconds: 3.2,
      proofSizeKB: '1.24',
    },
  },
  passportProof: {
    version: '0x0000000000000000000000000000000000000000000000000000000000000001',
    proofVerificationData: {
      vkeyHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      proof: '0x' + '00'.repeat(256),
      publicInputs: [
        '0x0000000000000000000000000000000000000000000000000000000000000001', // verified
      ],
    },
    committedInputs: '0x' + '00'.repeat(64),
    serviceConfig: {
      validityPeriodInSeconds: 3600,
      domain: 'localhost',
      scope: 'mintmarks-personhood',
      devMode: true,
    },
  },
  mintResult: {
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    tokenId: '12345',
    eventName: 'Demo Event 2024',
  },
}

/**
 * Step labels for UI
 */
export const STEP_LABELS = {
  wallet: 'Connect Wallet',
  'email-proof': 'Email Proof',
  passport: 'Verify Identity',
  mint: 'Mint NFT',
  success: 'Complete',
}

/**
 * Step descriptions
 */
export const STEP_DESCRIPTIONS = {
  wallet: 'Connect your wallet to continue',
  'email-proof': 'Generating zero-knowledge proof of your email',
  passport: 'Verify your identity with ZKPassport',
  mint: 'Mint your soulbound attendance NFT',
  success: 'Your mark is onchain!',
}

/**
 * Progress percentages for each step
 */
export const STEP_PROGRESS = {
  wallet: { start: 0, end: 15 },
  'email-proof': { start: 15, end: 50 },
  passport: { start: 50, end: 75 },
  mint: { start: 75, end: 100 },
  success: { start: 100, end: 100 },
}


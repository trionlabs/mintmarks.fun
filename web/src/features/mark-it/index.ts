/**
 * Mark It Feature Public Exports
 */

// Types
export * from './types'

// Config
export * from './config'

// Hooks
export { useMarkItFlow } from './hooks/useMarkItFlow'

// Components
export { ConfirmEmailModal } from './components/ConfirmEmailModal'
export { MarkItFlowModal } from './components/MarkItFlowModal'
export { MarkItProgress } from './components/MarkItProgress'

// Lib
export { generateEmailProof, isProofGenerationSupported, cleanupProver } from './lib/emailProver'


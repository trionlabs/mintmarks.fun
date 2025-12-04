/**
 * @fileoverview Wallet hooks exports.
 */

// Main unified hook (use this in components)
export { useUnifiedWallet } from './useUnifiedWallet'

// Internal hooks (used by useUnifiedWallet, exported for testing)
export { useCdpAuthMarkerSync } from './useCdpAuthMarkerSync'
export { useWalletMutualExclusion } from './useWalletMutualExclusion'

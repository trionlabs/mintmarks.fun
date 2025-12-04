/**
 * @fileoverview Wallet utility exports.
 */

export { normalizeError, createWalletError } from './errorUtils'
export { truncateAddress, isValidAddress, formatAddress, maskEmail, maskAddress } from './addressUtils'
export {
  // Constants
  CDP_ACTIVE_KEY,
  WAGMI_KEY_PREFIX,
  // CDP Auth State
  setCdpActive,
  clearCdpActive,
  isCdpMarkerSet,
  // CDP SDK Detection
  hasCdpSdkState,
  getCdpRelatedKeys,
  // Combined Checks
  isCdpAuthActive,
  shouldWagmiReconnect,
  // Cleanup
  clearAllCdpState,
  clearWagmiState,
  // Debug
  getAuthStateSummary,
  logAuthState,
} from './walletAuthState'

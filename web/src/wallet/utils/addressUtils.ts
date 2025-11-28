/**
 * @fileoverview Address formatting utilities.
 */

/**
 * Truncates an address for display (e.g., "0x1234...5678").
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Validates if a string is a valid Ethereum address.
 */
export function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Formats address with checksum (basic implementation).
 * For full checksum, use viem's getAddress.
 */
export function formatAddress(address: string): `0x${string}` | null {
  if (!isValidAddress(address)) return null
  return address as `0x${string}`
}

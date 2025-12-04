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
 * Masks an email address for privacy (e.g., "ya*****@gmail.com").
 * Shows first 2 characters of username + ***** + domain.
 */
export function maskEmail(email: string): string {
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!username || !domain) return email
  const visible = username.slice(0, 2)
  return `${visible}*****@${domain}`
}

/**
 * Masks a wallet address for privacy (e.g., "0x*****").
 * Shows "0x" prefix + first 2 hex chars + *****.
 */
export function maskAddress(address: string): string {
  if (!address) return ''
  if (address.startsWith('0x') && address.length > 4) {
    return `${address.slice(0, 4)}*****`
  }
  // Fallback for non-standard addresses
  return `${address.slice(0, 2)}*****`
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

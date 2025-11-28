/**
 * @fileoverview wagmi configuration for external wallets.
 * Supports browser extension wallets only (no WalletConnect/mobile).
 */

import { createConfig, createStorage, http } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

const isBrowser = typeof window !== 'undefined'

/**
 * wagmi configuration.
 * Only browser extension wallets - no mobile/WalletConnect.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  ssr: false,
  storage: isBrowser
    ? createStorage({
        storage: window.localStorage,
      })
    : undefined,
  connectors: [
    // Injected wallets: MetaMask, Rabby, etc.
    injected(),
    // Coinbase Wallet browser extension
    coinbaseWallet({ appName: 'MintMarks' }),
    // NO walletConnect - requires project ID, mobile focused
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})

// Re-export chains for convenience
export { baseSepolia, base } from 'wagmi/chains'



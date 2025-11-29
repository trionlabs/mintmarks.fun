/**
 * @fileoverview wagmi configuration for external wallets.
 * Supports browser extension wallets only (no WalletConnect/mobile).
 * 
 * Multichain support: Base Sepolia, Base, Ethereum Sepolia, Ethereum
 */

import { createConfig, createStorage, http } from 'wagmi'
import { baseSepolia, base, sepolia, mainnet } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

const isBrowser = typeof window !== 'undefined'

/**
 * wagmi configuration.
 * Only browser extension wallets - no mobile/WalletConnect.
 * 
 * Supports all four networks for Mark It minting:
 * - Ethereum Sepolia (testnet)
 * - Base Sepolia (testnet)
 * - Ethereum (mainnet)
 * - Base (mainnet)
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base, sepolia, mainnet],
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
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

// Re-export chains for convenience
export { baseSepolia, base, sepolia, mainnet } from 'wagmi/chains'



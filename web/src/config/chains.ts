/**
 * @fileoverview Chain configuration for wagmi/RainbowKit.
 * 
 * Supports multichain: Base Sepolia (default) + Ethereum Sepolia (for Mark It flow)
 */

import { baseSepolia, base, sepolia, mainnet, arbitrum, optimism, polygon } from 'wagmi/chains'
import { defineChain } from 'viem'

// Active chains - wagmi will support all of these
// Order matters: first chain is the default
export const ACTIVE_CHAINS = [baseSepolia, sepolia] as const

// All supported chains (for reference/future use)
export const ALL_SUPPORTED_CHAINS = [
  baseSepolia,
  sepolia,
  base,
  mainnet,
  arbitrum,
  optimism,
  polygon,
] as const

// Celo (ready but inactive)
export const celoAlfajores = defineChain({
  id: 44787,
  name: 'Celo Alfajores',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://alfajores-forno.celo-testnet.org'] } },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://alfajores.celoscan.io' },
  },
  testnet: true,
})

// Feature flags
export const CELO_ENABLED = false
export const MAINNET_ENABLED = false

// Re-export for convenience
export { baseSepolia, base, sepolia, mainnet }



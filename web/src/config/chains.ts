/**
 * @fileoverview Chain configuration.
 * Celo is configured but inactive.
 */

import { baseSepolia, base } from 'wagmi/chains'
import { defineChain } from 'viem'

// Active chains
export const ACTIVE_CHAINS = [baseSepolia] as const

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
export { baseSepolia, base }



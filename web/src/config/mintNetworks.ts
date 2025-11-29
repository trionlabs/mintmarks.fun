/**
 * Mint Networks Configuration
 * 
 * Defines all networks where Mintmarks contracts are deployed.
 * Each network has its own contract address from environment variables.
 * 
 * Used by Mark It flow for multichain minting.
 */

import { baseSepolia, base, sepolia, mainnet } from 'viem/chains'
import type { Chain } from 'viem'

/**
 * Mint network identifiers
 * These match the keys in MINT_NETWORKS
 */
export type MintNetworkId = 
  | 'ethereum-sepolia' 
  | 'base-sepolia' 
  | 'ethereum' 
  | 'base'

/**
 * Mint network configuration
 */
export interface MintNetworkConfig {
  id: MintNetworkId
  chainId: number
  name: string
  shortName: string
  viemChain: Chain
  contractAddress: `0x${string}` | undefined
  rpcUrl: string
  blockExplorer: string
  testnet: boolean
  enabled: boolean
  /** CDP network identifier for CDP wallet transactions */
  cdpNetwork: string
}

/**
 * All mint networks configuration
 * Order determines display order in UI
 */
export const MINT_NETWORKS: Record<MintNetworkId, MintNetworkConfig> = {
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'ETH Sepolia',
    viemChain: sepolia,
    // Supports both legacy (VITE_MINTMARKS_ADDRESS) and new naming (VITE_MINTMARKS_ETH_SEPOLIA)
    contractAddress: (import.meta.env.VITE_MINTMARKS_ADDRESS || import.meta.env.VITE_MINTMARKS_ETH_SEPOLIA) as `0x${string}` | undefined,
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    testnet: true,
    enabled: true,
    cdpNetwork: 'ethereum-sepolia',
  },
  'base-sepolia': {
    id: 'base-sepolia',
    chainId: 84532,
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    viemChain: baseSepolia,
    contractAddress: import.meta.env.VITE_MINTMARKS_BASE_SEPOLIA as `0x${string}` | undefined,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    testnet: true,
    enabled: false, // Not deployed yet
    cdpNetwork: 'base-sepolia',
  },
  'ethereum': {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    shortName: 'Ethereum',
    viemChain: mainnet,
    contractAddress: import.meta.env.VITE_MINTMARKS_ETH as `0x${string}` | undefined,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    testnet: false,
    enabled: false, // Not deployed yet
    cdpNetwork: 'ethereum',
  },
  'base': {
    id: 'base',
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    viemChain: base,
    contractAddress: import.meta.env.VITE_MINTMARKS_BASE as `0x${string}` | undefined,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    testnet: false,
    enabled: false, // Not deployed yet
    cdpNetwork: 'base',
  },
} as const

/**
 * Get all enabled mint networks
 * Returns networks that are enabled in config
 */
export function getEnabledMintNetworks(): MintNetworkConfig[] {
  return Object.values(MINT_NETWORKS).filter((n) => n.enabled)
}

/**
 * Get mint networks with deployed contracts
 * Returns networks that have a contract address configured
 */
export function getConfiguredMintNetworks(): MintNetworkConfig[] {
  return Object.values(MINT_NETWORKS).filter(
    (n) => n.enabled && n.contractAddress && n.contractAddress !== '0x0000000000000000000000000000000000000000'
  )
}

/**
 * Get a specific mint network by ID
 */
export function getMintNetwork(id: MintNetworkId): MintNetworkConfig {
  return MINT_NETWORKS[id]
}

/**
 * Get mint network by chain ID
 */
export function getMintNetworkByChainId(chainId: number): MintNetworkConfig | undefined {
  return Object.values(MINT_NETWORKS).find((n) => n.chainId === chainId)
}

/**
 * Check if a network has a deployed contract
 */
export function isNetworkConfigured(id: MintNetworkId): boolean {
  const network = MINT_NETWORKS[id]
  return Boolean(
    network.contractAddress && 
    network.contractAddress !== '0x0000000000000000000000000000000000000000'
  )
}

/**
 * Get block explorer URL for a transaction
 */
export function getMintTransactionUrl(networkId: MintNetworkId, txHash: string): string {
  const network = MINT_NETWORKS[networkId]
  return `${network.blockExplorer}/tx/${txHash}`
}

/**
 * Get the default mint network
 * Returns the first configured network, or first enabled if none configured
 */
export function getDefaultMintNetwork(): MintNetworkConfig {
  const configured = getConfiguredMintNetworks()
  if (configured.length > 0) {
    return configured[0]
  }
  return getEnabledMintNetworks()[0]
}


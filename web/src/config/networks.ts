/**
 * Network Configuration for MyMarks
 * 
 * This is used by MyMarks gallery for filtering NFTs by network.
 * For minting, see config/mintNetworks.ts
 */

import type { NetworkId } from '@/types/nft'

export interface NetworkConfig {
  id: NetworkId
  name: string
  shortName: string
  chainId: number
  blockExplorer: string
  enabled: boolean
  testnet: boolean
}

const networks: NetworkConfig[] = [
  {
    id: 'ethereum-sepolia',
    name: 'Ethereum Sepolia',
    shortName: 'ETH Sepolia',
    chainId: 11155111,
    blockExplorer: 'https://sepolia.etherscan.io',
    enabled: true,
    testnet: true,
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    chainId: 84532,
    blockExplorer: 'https://sepolia.basescan.org',
    enabled: true,
    testnet: true,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'Ethereum',
    chainId: 1,
    blockExplorer: 'https://etherscan.io',
    enabled: true,
    testnet: false,
  },
  {
    id: 'base',
    name: 'Base',
    shortName: 'Base',
    chainId: 8453,
    blockExplorer: 'https://basescan.org',
    enabled: true,
    testnet: false,
  },
]

export function getEnabledNetworks(): NetworkConfig[] {
  return networks.filter((n) => n.enabled)
}

export function getNetwork(id: NetworkId): NetworkConfig | undefined {
  return networks.find((n) => n.id === id)
}

export function getTransactionUrl(network: NetworkId, txHash: string): string {
  const config = getNetwork(network)
  if (!config) return '#'
  return `${config.blockExplorer}/tx/${txHash}`
}

export function getAddressUrl(network: NetworkId, address: string): string {
  const config = getNetwork(network)
  if (!config) return '#'
  return `${config.blockExplorer}/address/${address}`
}



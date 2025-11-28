/**
 * Network Configuration for MyMarks
 */

import type { NetworkId } from '@/types/nft'

export interface NetworkConfig {
  id: NetworkId
  name: string
  shortName: string
  chainId: number
  blockExplorer: string
  enabled: boolean
}

const networks: NetworkConfig[] = [
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    chainId: 84532,
    blockExplorer: 'https://sepolia.basescan.org',
    enabled: true,
  },
  {
    id: 'base-mainnet',
    name: 'Base',
    shortName: 'Base',
    chainId: 8453,
    blockExplorer: 'https://basescan.org',
    enabled: false, // Enable when ready for mainnet
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


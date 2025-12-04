/**
 * Smart Contract Configuration
 * 
 * This file contains all contract addresses, ABIs, and network configurations.
 * Centralizing this makes it easy to manage different environments.
 */

// ============================================
// Network Configuration
// ============================================

/**
 * CDP Supported EVM Networks
 * 
 * @see https://docs.cdp.coinbase.com/api-reference/v2/rest-api/evm-smart-accounts/prepare-a-user-operation
 * 
 * Supported networks: base-sepolia, base, arbitrum, optimism, zora, 
 * polygon, bnb, avalanche, ethereum, ethereum-sepolia
 */
export const NETWORKS = {
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia' as const, // CDP network identifier
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    faucet: 'https://www.coinbase.com/faucets/base-sepolia',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    network: 'base' as const,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    faucet: null,
  },
  ethereumSepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    network: 'ethereum-sepolia' as const, // CDP network identifier
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    faucet: 'https://sepoliafaucet.com',
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    network: 'ethereum' as const,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    faucet: null,
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    network: 'arbitrum' as const,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    faucet: null,
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    network: 'optimism' as const,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    faucet: null,
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    network: 'polygon' as const,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    faucet: null,
  },
} as const;

export type NetworkKey = keyof typeof NETWORKS;
export type CdpNetwork = typeof NETWORKS[NetworkKey]['network'];

// Current active network (default for new users)
export const ACTIVE_NETWORK = NETWORKS.ethereumSepolia;

// ============================================
// TestMintmarks Contract (Base Sepolia)
// ============================================

/**
 * TestMintmarks - Simple ERC-1155 NFT for testing wallet functionality
 * 
 * Features:
 * - Public mint with 0.00001 ETH fee
 * - On-chain SVG metadata
 * - No proof required (unlike production Mintmarks)
 */
export const TEST_MINTMARKS = {
  // Contract address (set via environment variable after deployment)
  address: (import.meta.env.VITE_TEST_MINTMARKS_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  
  // Mint fee in wei (0.00001 ETH = 10^13 wei)
  mintFee: 10000000000000n,
  
  // Mint fee in ETH (for display)
  mintFeeEth: '0.00001',
  
  // ABI for the mint function
  abi: [
    {
      name: 'mint',
      type: 'function',
      stateMutability: 'payable',
      inputs: [],
      outputs: [{ name: 'tokenId', type: 'uint256' }],
    },
    {
      name: 'name',
      type: 'function',
      stateMutability: 'pure',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'symbol',
      type: 'function',
      stateMutability: 'pure',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'totalMinted',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'mintCount',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'hasMinted',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'uri',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'account', type: 'address' },
        { name: 'id', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
    // Events
    {
      name: 'TestMinted',
      type: 'event',
      inputs: [
        { name: 'minter', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
        { name: 'timestamp', type: 'uint256', indexed: false },
      ],
    },
  ] as const,
} as const;

// ============================================
// Production Mintmarks Contract (Future)
// ============================================

export const MINTMARKS = {
  address: (import.meta.env.VITE_MINTMARKS_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  // ABI will be added when ZK proof minting is implemented
  abi: [] as const,
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a contract address is configured
 */
export function isContractConfigured(address: `0x${string}`): boolean {
  return address !== '0x0000000000000000000000000000000000000000';
}

/**
 * Get block explorer URL for a transaction
 */
export function getTransactionUrl(txHash: string, network = ACTIVE_NETWORK): string {
  return `${network.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getAddressUrl(address: string, network = ACTIVE_NETWORK): string {
  return `${network.blockExplorer}/address/${address}`;
}

/**
 * Get block explorer URL for a token
 */
export function getTokenUrl(contractAddress: string, tokenId: string | number, network = ACTIVE_NETWORK): string {
  return `${network.blockExplorer}/token/${contractAddress}?a=${tokenId}`;
}



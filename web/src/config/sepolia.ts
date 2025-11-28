/**
 * Ethereum Sepolia Network Configuration
 * Used for ZK proof minting flow
 */

import { defineChain } from 'viem'

export const ethereumSepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      // RPC URL from .env - public fallback without API key
      http: [import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
})

// Check if running in dev mode
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// RPC URL from environment - NEVER hardcode API keys
export const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL as string

/**
 * Mintmarks contract configuration on Ethereum Sepolia
 * All addresses MUST come from .env - NO fallbacks
 */
export const MINTMARKS_CONTRACTS = {
  mintmarks: import.meta.env.VITE_MINTMARKS_ADDRESS as `0x${string}` | undefined,
  emailVerifier: import.meta.env.VITE_EMAIL_VERIFIER_ADDRESS as `0x${string}` | undefined,
  zkPassportVerifier: import.meta.env.VITE_ZKPASSPORT_VERIFIER_ADDRESS as `0x${string}` | undefined,
}

/**
 * ZKPassport configuration
 */
export const ZKPASSPORT_CONFIG = {
  domain: isDev ? 'localhost' : 'mintmarks.fun',
  scope: 'mintmarks-personhood',
  devMode: isDev,
}

/**
 * Mintmarks contract ABI
 */
export const MINTMARKS_ABI = [
  // Errors
  { type: 'error', name: 'InvalidEmailProof', inputs: [] },
  { type: 'error', name: 'InvalidPassportProof', inputs: [] },
  { type: 'error', name: 'InvalidPassportScope', inputs: [] },
  { type: 'error', name: 'InvalidBoundAddress', inputs: [] },
  { type: 'error', name: 'InvalidBoundChain', inputs: [] },
  { type: 'error', name: 'InvalidBoundEmailNullifier', inputs: [] },
  { type: 'error', name: 'EmailNullifierAlreadyUsed', inputs: [] },
  { type: 'error', name: 'PassportIdAlreadyUsed', inputs: [] },
  { type: 'error', name: 'EventNameTooLong', inputs: [] },
  { type: 'error', name: 'NonTransferable', inputs: [] },
  // Events
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'eventName', type: 'string', indexed: false },
      { name: 'emailNullifier', type: 'bytes32', indexed: false },
      { name: 'passportId', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferSingle',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  // Functions
  {
    inputs: [
      { name: 'emailProof', type: 'bytes' },
      { name: 'emailPublicInputs', type: 'bytes32[]' },
      {
        name: 'passportParams',
        type: 'tuple',
        components: [
          { name: 'version', type: 'bytes32' },
          {
            name: 'proofVerificationData',
            type: 'tuple',
            components: [
              { name: 'vkeyHash', type: 'bytes32' },
              { name: 'proof', type: 'bytes' },
              { name: 'publicInputs', type: 'bytes32[]' },
            ],
          },
          { name: 'committedInputs', type: 'bytes' },
          {
            name: 'serviceConfig',
            type: 'tuple',
            components: [
              { name: 'validityPeriodInSeconds', type: 'uint256' },
              { name: 'domain', type: 'string' },
              { name: 'scope', type: 'string' },
              { name: 'devMode', type: 'bool' },
            ],
          },
        ],
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'eventName', type: 'string' }],
    name: 'getTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenNames',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'emailNullifierUsed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

/**
 * Check if contracts are configured in .env
 */
export function areContractsConfigured(): boolean {
  return Boolean(
    MINTMARKS_CONTRACTS.mintmarks &&
    MINTMARKS_CONTRACTS.emailVerifier &&
    MINTMARKS_CONTRACTS.zkPassportVerifier
  )
}

/**
 * Get contract address with validation
 * Throws if not configured
 */
export function getMintmarksAddress(): `0x${string}` {
  if (!MINTMARKS_CONTRACTS.mintmarks) {
    throw new Error('VITE_MINTMARKS_ADDRESS is not set in .env')
  }
  return MINTMARKS_CONTRACTS.mintmarks
}

/**
 * Get block explorer URL for transaction
 */
export function getSepoliaTransactionUrl(txHash: string): string {
  return `${ethereumSepolia.blockExplorers.default.url}/tx/${txHash}`
}


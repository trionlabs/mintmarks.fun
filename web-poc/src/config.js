import { sepolia } from 'viem/chains'

export const CHAIN = sepolia

// Check if running in dev mode (localhost)
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// Use Vite proxy in dev to bypass CORS, direct URL in production
export const RPC_URL = isDev
  ? '/api/rpc'
  : import.meta.env.VITE_SEPOLIA_RPC_URL

// Contract addresses from environment
export const CONTRACTS = {
  emailVerifier: import.meta.env.VITE_EMAIL_VERIFIER_ADDRESS,
  mintmarks: import.meta.env.VITE_MINTMARKS_ADDRESS,
  zkPassportVerifier: import.meta.env.VITE_ZKPASSPORT_VERIFIER_ADDRESS,
}

// Validate required config in production
if (!isDev) {
  const missing = []
  if (!RPC_URL) missing.push('VITE_SEPOLIA_RPC_URL')
  if (!CONTRACTS.emailVerifier) missing.push('VITE_EMAIL_VERIFIER_ADDRESS')
  if (!CONTRACTS.mintmarks) missing.push('VITE_MINTMARKS_ADDRESS')
  if (!CONTRACTS.zkPassportVerifier) missing.push('VITE_ZKPASSPORT_VERIFIER_ADDRESS')
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export const ZKPASSPORT_CONFIG = {
  // Domain must match origin for WebSocket to work
  // In devMode, proofs are generated with this domain - contract must accept it
  domain: isDev ? 'localhost' : 'mintmarks.fun',
  scope: 'mintmarks-personhood',
  devMode: isDev,
}

// Mintmarks contract ABI
export const MINTMARKS_ABI = [
  // Errors for proper decoding
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
]

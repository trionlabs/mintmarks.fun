import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Contract addresses from env
const VERIFIER_ADDRESS = process.env.VERIFIER_ADDRESS;
const MINTMARKS_ADDRESS = process.env.MINTMARKS_ADDRESS;

if (!VERIFIER_ADDRESS || !MINTMARKS_ADDRESS) {
  console.error('[ERROR]: VERIFIER_ADDRESS and MINTMARKS_ADDRESS must be set in .env');
  process.exit(1);
}

const VERIFIER_ABI = [
  {
    inputs: [
      { name: 'proof', type: 'bytes' },
      { name: 'publicInputs', type: 'bytes32[]' }
    ],
    name: 'verify',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const MINTMARKS_ABI = [
  {
    inputs: [
      { name: 'proof', type: 'bytes' },
      { name: 'publicInputs', type: 'bytes32[]' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'eventName', type: 'string' }],
    name: 'getTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
];

async function main() {
  const shouldMint = process.argv.includes('--mint');

  // Load proof and public inputs
  // Paths are hardcoded!!!
  const proofPath = path.join(__dirname, '../../circuits/target/proof.bin');
  const publicInputsPath = path.join(__dirname, '../../circuits/target/public_inputs.json');

  if (!fs.existsSync(proofPath) || !fs.existsSync(publicInputsPath)) {
    console.error('[ERROR]: Proof files not found. Run: pnpm run prove');
    process.exit(1);
  }

  const proofBin = fs.readFileSync(proofPath);
  const proofHex = '0x' + proofBin.toString('hex');
  const publicInputs = JSON.parse(fs.readFileSync(publicInputsPath, 'utf-8'));

  console.log('Proof size:', proofBin.length, 'bytes');
  console.log('Public inputs:', publicInputs.length);

  // Decode event name from public inputs
  const eventNameLen = parseInt(publicInputs[323], 16);
  let eventName = '';
  for (let i = 0; i < eventNameLen; i++) {
    eventName += String.fromCharCode(parseInt(publicInputs[67 + i], 16));
  }
  console.log('Event:', eventName);

  // Create client
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl)
  });

  console.log('\nVerifying proof:');
  console.log('Verifier:', VERIFIER_ADDRESS);

  try {
    const verified = await publicClient.readContract({
      address: VERIFIER_ADDRESS,
      abi: VERIFIER_ABI,
      functionName: 'verify',
      args: [proofHex, publicInputs]
    });

    if (!verified) {
      console.log('[FAILED]: Proof verification returned false');
      process.exit(1);
    }
    console.log('[OK]: Proof verified');

    if (!shouldMint) {
      console.log('\nRun with --mint to mint token');
      return;
    }

    // Mint flow
    console.log('\nMinting:');
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('[ERROR]: PRIVATE_KEY not set');
      process.exit(1);
    }

    const account = privateKeyToAccount(`0x${privateKey}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl)
    });

    console.log('Minter:', account.address);
    console.log('Mintmarks:', MINTMARKS_ADDRESS);

    const tokenId = await publicClient.readContract({
      address: MINTMARKS_ADDRESS,
      abi: MINTMARKS_ABI,
      functionName: 'getTokenId',
      args: [eventName]
    });
    console.log('TokenId:', tokenId.toString().slice(0, 20) + '...');

    const balanceBefore = await publicClient.readContract({
      address: MINTMARKS_ADDRESS,
      abi: MINTMARKS_ABI,
      functionName: 'balanceOf',
      args: [account.address, tokenId]
    });
    console.log('Balance before:', balanceBefore.toString());

    console.log('\nSending tx...');
    const hash = await walletClient.writeContract({
      address: MINTMARKS_ADDRESS,
      abi: MINTMARKS_ABI,
      functionName: 'mint',
      args: [proofHex, publicInputs]
    });
    console.log('Tx:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Status:', receipt.status);
    console.log('Gas:', receipt.gasUsed.toString());

    if (receipt.status === 'success') {
      const balanceAfter = await publicClient.readContract({
        address: MINTMARKS_ADDRESS,
        abi: MINTMARKS_ABI,
        functionName: 'balanceOf',
        args: [account.address, tokenId]
      });
      console.log('Balance after:', balanceAfter.toString());

      console.log('\n[SUCCESS]: Minted!');
      console.log('View:', `https://base-sepolia.blockscout.com/tx/${hash}`);
    }
  } catch (error) {
    console.error('\n[ERROR]:', error.message);
    process.exit(1);
  }
}

main();

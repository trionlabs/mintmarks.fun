import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verifier address is hardcoded here!!!
const VERIFIER_ADDRESS = '0xDB80797A62948Bc1189e46De13Cf3B1d5Ee60936';

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

async function main() {
  // Load proof and public inputs
  // Proof and public inputs are hardcoded here!!!
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

  // Create client
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl)
  });

  console.log('\nCalling verify() on', VERIFIER_ADDRESS);
  console.log('Chain: Base Sepolia (84532)');

  try {
    const result = await client.readContract({
      address: VERIFIER_ADDRESS,
      abi: VERIFIER_ABI,
      functionName: 'verify',
      args: [proofHex, publicInputs]
    });

    if (result) {
      console.log(result)
      console.log('\n[SUCCESS]: Proof verified on-chain!');
    } else {
      console.log(result)
      console.log('\n[FAILED]: Proof verification returned false');
    }
  } catch (error) {
    console.error('\n[ERROR]: Verification failed');
    console.error(error.message);
    process.exit(1);
  }
}

main();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { prepareCircuitInputs, decodeBoundedVec } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(emlPath) {
  // Check circuit exists
  // Mintmarks circuit name is hardcoded here!!!
  const circuitPath = path.join(__dirname, '../target/mintmarksfun_circuits.json');
  if (!fs.existsSync(circuitPath)) {
    console.error('[ERROR]: Circuit not compiled. Run: pnpm run compile');
    process.exit(1);
  }

  // Load circuit
  const circuit = JSON.parse(fs.readFileSync(circuitPath, 'utf-8'));
  console.log(`Circuit: ${circuitPath}`);
  console.log(`Noir version: ${circuit.noir_version}`);

  console.log(`\nPreparing inputs from: ${emlPath}`);
  const { inputs, metadata } = await prepareCircuitInputs(emlPath);
  console.log(`Date: ${metadata.date}`);
  console.log(`Event: ${metadata.eventName}`);

  console.log('\nInitializing Noir and UltraHonk backend...');
  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);

  try {
    console.log('Executing circuit...');
    const { witness, returnValue } = await noir.execute(inputs);

    console.log('\nCircuit Outputs:');
    if (returnValue && returnValue.length >= 4) {
      console.log(`Pubkey Hash: ${returnValue[0]}`);
      console.log(`Email Nullifier: ${returnValue[1]}`);
      console.log(`Date: "${decodeBoundedVec(returnValue[2])}"`);
      console.log(`Event Name: "${decodeBoundedVec(returnValue[3])}"`);
    }

    console.log('\nGenerating UltraHonk proof...');
    const startProve = Date.now();
    const proof = await backend.generateProof(witness, { keccak: true });
    const proveTime = ((Date.now() - startProve) / 1000).toFixed(2);

    console.log(`Proof generated in ${proveTime}s`);
    console.log(`Proof size: ${(proof.proof.length / 1024).toFixed(2)} KB`);

    // Save outputs
    const proofPath = path.join(__dirname, '../target/proof.bin');
    const publicInputsPath = path.join(__dirname, '../target/public_inputs.json');

    fs.writeFileSync(proofPath, proof.proof);
    fs.writeFileSync(publicInputsPath, JSON.stringify(proof.publicInputs, null, 2));

    console.log(`\nSaved: ${proofPath}`);
    console.log(`Saved: ${publicInputsPath}`);

    console.log('\nVerifying proof...');
    const startVerify = Date.now();
    const verified = await backend.verifyProof(proof, { keccak: true });
    const verifyTime = ((Date.now() - startVerify) / 1000).toFixed(2);

    if (verified) {
      console.log(`Proof verified in ${verifyTime}s`);
    } else {
      console.error('[FAILED]: Proof verification failed');
      process.exit(1);
    }

  } finally {
    await backend.destroy();
  }
}

const emlPath = process.argv[2] || path.join(__dirname, '../example.eml');

main(emlPath).catch(err => {
  console.error('[ERROR]:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

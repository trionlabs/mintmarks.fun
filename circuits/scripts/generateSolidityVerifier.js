import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UltraHonkBackend } from '@aztec/bb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateVerifier() {
    // Mintmarks circuit name is hardcoded here!!!
    const circuitPath = path.join(__dirname, '../target/mintmarksfun_circuits.json');
    const outputDir = path.join(__dirname, '../solidity-verifier');
    const outputPath = path.join(outputDir, 'UltraHonkVerifier.sol');

    // Check circuit exists
    if (!fs.existsSync(circuitPath)) {
        console.error('[ERROR]: Circuit not found!');
        console.error(`Expected: ${circuitPath}`);
        console.error('\nRun: pnpm run compile');
        process.exit(1);
    }

    const circuit = JSON.parse(fs.readFileSync(circuitPath, 'utf-8'));
    const circuitSize = (fs.statSync(circuitPath).size / 1024 / 1024).toFixed(2);
    console.log(`Circuit loaded: ${circuitPath}`);
    console.log(`Circuit size: ${circuitSize} MB`);
    console.log(`Noir version: ${circuit.noir_version}\n`);

    console.log('Initializing UltraHonk backend...');
    const backend = new UltraHonkBackend(circuit.bytecode);

    try {
        console.log('Generating Solidity verifier contract...\n');
        const startTime = Date.now();
        const contract = await backend.getSolidityVerifier();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, contract);

        const contractSize = (contract.length / 1024).toFixed(2);
        console.log(`Verifier contract generated in ${elapsed}s`);
        console.log(`Output: ${outputPath}`);
        console.log(`Contract size: ${contractSize} KB\n`);

        // Parse public inputs count (if available)
        const contractStr = typeof contract === 'string' ? contract : contract.toString();
        const publicInputsMatch = contractStr.match(/uint256 constant NUMBER_OF_PUBLIC_INPUTS = (\d+)/);
        if (publicInputsMatch) {
            console.log(`Public inputs: ${publicInputsMatch[1]}`);
        }

        console.log('\n[SUCCESS]: Solidity verifier generated.');

    } catch (error) {
        console.error('\n[ERROR]: Failed to generate verifier');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        await backend.destroy();
    }
}

generateVerifier().catch(err => {
    console.error('[ERROR]: Unhandled error:', err);
    process.exit(1);
});
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toProverToml } from '@zk-email/zkemail-nr/dist/utils.js';
import { prepareCircuitInputs } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(emlPath) {
  console.log(`Reading: ${emlPath}`);
  const { inputs, metadata } = await prepareCircuitInputs(emlPath);

  console.log(`\nDKIM verified successfully`);
  console.log(`Date: ${metadata.date}`);
  console.log(`Subject: ${metadata.subject}`);
  console.log(`Event: ${metadata.eventName}`);

  // Write Prover.toml
  const outputPath = path.join(__dirname, '../Prover.toml');
  const tomlContent = `# Generated Prover.toml for Mintmarks circuit
# Event: ${metadata.eventName}

${toProverToml(inputs)}
`;

  fs.writeFileSync(outputPath, tomlContent);
  console.log(`\nProver.toml written to: ${outputPath}`);
}

// CLI input
const emlPath = process.argv[2] || path.join(__dirname, '../example.eml');

main(emlPath).catch(err => {
  console.error('[ERROR]:', err.message);
  process.exit(1);
});

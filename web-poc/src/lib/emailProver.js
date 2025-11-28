/**
 * Browser-based email proof generation for Mintmarks
 *
 * This module handles:
 * 1. Parsing .eml files
 * 2. DKIM verification with DNS-over-HTTPS
 * 3. Circuit input preparation
 * 4. Noir proof generation using UltraHonk
 */

import { generateEmailVerifierInputs, verifyDKIMSignature } from '@zk-email/zkemail-nr';
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import initACVM from '@noir-lang/acvm_js/web';
import initAbi from '@noir-lang/noirc_abi/web';

// Cache for circuit and backend to avoid reloading
let cachedCircuit = null;
let cachedBackend = null;
let cachedNoir = null;
let wasmInitialized = false;

/**
 * Initialize WASM modules with explicit paths
 */
async function initializeWasm() {
  if (wasmInitialized) return;

  try {
    await Promise.all([
      initACVM(new URL('/wasm/acvm_js_bg.wasm', window.location.origin)),
      initAbi(new URL('/wasm/noirc_abi_wasm_bg.wasm', window.location.origin)),
    ]);
    wasmInitialized = true;
    console.log('WASM modules initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WASM modules:', error);
    throw new Error(`WASM initialization failed: ${error.message}`);
  }
}

/**
 * Load the compiled circuit JSON
 */
async function loadCircuit(onProgress) {
  if (cachedCircuit) {
    return cachedCircuit;
  }

  onProgress?.('Loading circuit...');
  const response = await fetch('/mintmarksfun_circuits.json');
  if (!response.ok) {
    throw new Error('Failed to load circuit. Make sure the circuit is compiled.');
  }
  cachedCircuit = await response.json();
  return cachedCircuit;
}

/**
 * Initialize Noir and UltraHonk backend
 */
async function initializeBackend(circuit, onProgress) {
  if (cachedNoir && cachedBackend) {
    return { noir: cachedNoir, backend: cachedBackend };
  }

  onProgress?.('Initializing WASM modules...');

  // Initialize WASM modules with explicit paths FIRST
  await initializeWasm();

  onProgress?.('Initializing proof system (this may take a moment)...');

  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);

  cachedNoir = noir;
  cachedBackend = backend;

  return { noir, backend };
}

/**
 * Custom DNS resolver using DNS-over-HTTPS (Cloudflare)
 * This replaces Node.js DNS for browser environment
 */
async function resolveDKIMKey(domain, selector) {
  const dnsName = `${selector}._domainkey.${domain}`;

  // Try Cloudflare DoH first
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dnsName)}&type=TXT`,
      {
        headers: { Accept: 'application/dns-json' },
      }
    );

    if (!response.ok) {
      throw new Error(`DNS lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Answer || data.Answer.length === 0) {
      throw new Error(`No DKIM record found for ${dnsName}`);
    }

    // Find the TXT record with DKIM data
    for (const answer of data.Answer) {
      if (answer.type === 16) { // TXT record
        const txtData = answer.data.replace(/"/g, '');
        if (txtData.includes('p=')) {
          return txtData;
        }
      }
    }

    throw new Error(`No DKIM key found in DNS response for ${dnsName}`);
  } catch (err) {
    console.error('Cloudflare DoH failed, trying Google:', err);

    // Fallback to Google DoH
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(dnsName)}&type=TXT`
    );

    if (!response.ok) {
      throw new Error(`Google DNS lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Answer || data.Answer.length === 0) {
      throw new Error(`No DKIM record found for ${dnsName}`);
    }

    for (const answer of data.Answer) {
      if (answer.type === 16) {
        const txtData = answer.data.replace(/"/g, '');
        if (txtData.includes('p=')) {
          return txtData;
        }
      }
    }

    throw new Error(`No DKIM key found in DNS response for ${dnsName}`);
  }
}

/**
 * Get the index and length of a header field (case-insensitive)
 * Skips DKIM-Signature headers to avoid finding fields inside the h= list
 */
function getConstrainedHeaderSequence(headers, fieldName) {
  const headerStr = headers.toString();

  const regex = new RegExp(
    `[${fieldName[0].toUpperCase()}${fieldName[0].toLowerCase()}]${fieldName.slice(1).toLowerCase()}:.*?(?=\\r?\\n(?![\\t ]))`,
    'g'
  );

  // Find all DKIM-Signature header ranges to skip them
  const dkimRanges = [];
  const dkimRegex = /DKIM-Signature:.*?(?=\r?\n(?![\t ]))/gs;
  let dkimMatch;
  while ((dkimMatch = dkimRegex.exec(headerStr)) !== null) {
    dkimRanges.push({
      start: dkimMatch.index,
      end: dkimMatch.index + dkimMatch[0].length,
    });
  }

  // Find the header field outside DKIM ranges
  const matches = [...headerStr.matchAll(regex)];
  for (const match of matches) {
    const matchStart = match.index;
    const insideDkim = dkimRanges.some(
      (range) => matchStart >= range.start && matchStart <= range.end
    );

    if (!insideDkim) {
      return {
        index: matchStart.toString(),
        length: match[0].length.toString(),
      };
    }
  }

  throw new Error(`Header field "${fieldName}" not found outside DKIM headers`);
}

/**
 * Get the sequence for just the header value (after "fieldname:")
 */
function getHeaderValueSequence(headerSequence, fieldName) {
  const headerIndex = parseInt(headerSequence.index);
  const headerLength = parseInt(headerSequence.length);
  const prefixLength = fieldName.length + 1; // "fieldname:" = name + ":"

  return {
    index: (headerIndex + prefixLength).toString(),
    length: (headerLength - prefixLength).toString(),
  };
}

/**
 * Extract event name from subject line
 * Luma emails have subject like "Thanks for joining <Event Name>"
 */
function getEventNameSequence(headers, subjectValueSequence) {
  const valueIndex = parseInt(subjectValueSequence.index);
  const valueLength = parseInt(subjectValueSequence.length);
  const subjectValue = headers.subarray(valueIndex, valueIndex + valueLength).toString();

  const prefix = 'Thanks for joining ';
  const prefixIndex = subjectValue.indexOf(prefix);

  if (prefixIndex !== -1) {
    const eventNameOffset = prefixIndex + prefix.length;
    return {
      index: (valueIndex + eventNameOffset).toString(),
      length: (valueLength - eventNameOffset).toString(),
    };
  }

  // Fallback: use entire subject value as event name
  return subjectValueSequence;
}

/**
 * Decode BoundedVec from Noir output
 */
function decodeBoundedVec(boundedVec) {
  if (boundedVec && typeof boundedVec === 'object' && 'storage' in boundedVec && 'len' in boundedVec) {
    const length = parseInt(boundedVec.len);
    const storage = boundedVec.storage;
    if (!Array.isArray(storage) || length === 0) return '';
    const bytes = storage.slice(0, length);
    return new TextDecoder().decode(new Uint8Array(bytes.map((b) => parseInt(b))));
  }
  return '';
}

/**
 * Prepare circuit inputs from email content
 */
async function prepareCircuitInputs(emailBuffer, onProgress) {
  onProgress?.('Parsing email and verifying DKIM signature...');

  // Generate base inputs
  const baseInputs = await generateEmailVerifierInputs(emailBuffer, {
    maxHeadersLength: 2048,
    ignoreBodyHashCheck: true,
  });

  // Verify DKIM and get headers
  const dkimResult = await verifyDKIMSignature(emailBuffer, undefined, undefined, true);
  const headers = dkimResult.headers;

  onProgress?.('Extracting header fields...');

  // Extract header sequences
  const dateHeaderSequence = getConstrainedHeaderSequence(headers, 'date');
  const dateValueSequence = getHeaderValueSequence(dateHeaderSequence, 'date');
  const subjectHeaderSequence = getConstrainedHeaderSequence(headers, 'subject');
  const subjectValueSequence = getHeaderValueSequence(subjectHeaderSequence, 'subject');
  const eventNameSequence = getEventNameSequence(headers, subjectValueSequence);

  // Extract human-readable values for metadata
  const dateValue = headers
    .subarray(
      parseInt(dateValueSequence.index),
      parseInt(dateValueSequence.index) + parseInt(dateValueSequence.length)
    )
    .toString()
    .trim();

  const eventName = headers
    .subarray(
      parseInt(eventNameSequence.index),
      parseInt(eventNameSequence.index) + parseInt(eventNameSequence.length)
    )
    .toString()
    .trim();

  const inputs = {
    header: baseInputs.header,
    pubkey: baseInputs.pubkey,
    signature: baseInputs.signature,
    date_header_sequence: dateHeaderSequence,
    date_value_sequence: dateValueSequence,
    subject_header_sequence: subjectHeaderSequence,
    subject_value_sequence: subjectValueSequence,
    event_name_sequence: eventNameSequence,
  };

  const metadata = {
    domain: dkimResult.domain || 'unknown',
    date: dateValue,
    eventName: eventName,
  };

  return { inputs, metadata };
}

/**
 * Main function: Generate proof from email file
 *
 * @param {ArrayBuffer|Uint8Array} emailContent - The email file content
 * @param {Function} onProgress - Progress callback (message: string, percent?: number)
 * @returns {Promise<{proof: string, publicInputs: string[], metadata: object}>}
 */
export async function generateEmailProof(emailContent, onProgress = () => {}) {
  try {
    // Convert to Buffer/Uint8Array if needed
    const emailBuffer = emailContent instanceof ArrayBuffer
      ? new Uint8Array(emailContent)
      : emailContent;

    // Step 1: Load circuit
    onProgress('Loading circuit...', 5);
    const circuit = await loadCircuit(onProgress);

    // Step 2: Prepare inputs
    onProgress('Parsing email...', 15);
    const { inputs, metadata } = await prepareCircuitInputs(emailBuffer, onProgress);

    onProgress(`Found event: "${metadata.eventName}"`, 25);

    // Step 3: Initialize backend
    onProgress('Initializing proof system...', 30);
    const { noir, backend } = await initializeBackend(circuit, onProgress);

    // Step 4: Execute circuit
    onProgress('Executing circuit...', 40);
    const { witness, returnValue } = await noir.execute(inputs);

    // Log outputs
    if (returnValue && returnValue.length >= 4) {
      console.log('Circuit outputs:', {
        pubkeyHash: returnValue[0],
        emailNullifier: returnValue[1],
        date: decodeBoundedVec(returnValue[2]),
        eventName: decodeBoundedVec(returnValue[3]),
      });
    }

    // Step 5: Generate proof
    onProgress('Generating proof (this takes ~30-60 seconds)...', 50);
    const startTime = Date.now();
    const proof = await backend.generateProof(witness, { keccak: true });
    const proofTime = ((Date.now() - startTime) / 1000).toFixed(1);

    onProgress(`Proof generated in ${proofTime}s`, 90);

    // Step 6: Format outputs for contract
    const proofHex = '0x' + Array.from(proof.proof)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Ensure public inputs are lowercase hex
    const publicInputs = proof.publicInputs.map(input =>
      typeof input === 'string' && input.startsWith('0x')
        ? input.toLowerCase()
        : input
    );

    onProgress('Proof ready!', 100);

    return {
      proof: proofHex,
      publicInputs,
      metadata: {
        ...metadata,
        proofTimeSeconds: parseFloat(proofTime),
        proofSizeKB: (proof.proof.length / 1024).toFixed(2),
      },
    };
  } catch (error) {
    console.error('Proof generation failed:', error);
    throw error;
  }
}

/**
 * Cleanup backend resources (call when done)
 */
export async function cleanupProver() {
  if (cachedBackend) {
    await cachedBackend.destroy();
    cachedBackend = null;
    cachedNoir = null;
  }
}

/**
 * Check if proof generation is supported in this browser
 */
export function isProofGenerationSupported() {
  // Check for WebAssembly support
  if (typeof WebAssembly === 'undefined') {
    return { supported: false, reason: 'WebAssembly not supported' };
  }

  // Check for BigInt support
  if (typeof BigInt === 'undefined') {
    return { supported: false, reason: 'BigInt not supported' };
  }

  return { supported: true };
}

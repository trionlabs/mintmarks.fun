/**
 * Browser-based Email Proof Generation for Mintmarks
 *
 * Handles:
 * 1. Parsing .eml / raw email content
 * 2. DKIM verification with DNS-over-HTTPS
 * 3. Circuit input preparation
 * 4. Noir proof generation using UltraHonk
 */

import { generateEmailVerifierInputs, verifyDKIMSignature } from '@zk-email/zkemail-nr'
import { UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'
import { initializeWasm } from './wasmLoader'
import type { EmailProofResult } from '../types'

// Circuit and backend cache
let cachedCircuit: Record<string, unknown> | null = null
let cachedBackend: UltraHonkBackend | null = null
let cachedNoir: Noir | null = null

/**
 * Progress callback type
 */
type ProgressCallback = (message: string, percent: number) => void

/**
 * Load the compiled circuit JSON
 */
async function loadCircuit(onProgress?: ProgressCallback): Promise<Record<string, unknown>> {
  if (cachedCircuit) {
    return cachedCircuit
  }

  onProgress?.('Loading circuit...', 5)
  const response = await fetch('/mintmarksfun_circuits.json')
  if (!response.ok) {
    throw new Error('Failed to load circuit. Make sure the circuit is compiled.')
  }
  cachedCircuit = await response.json()
  return cachedCircuit as Record<string, unknown>
}

/**
 * Initialize Noir and UltraHonk backend
 */
async function initializeBackend(
  circuit: Record<string, unknown>,
  onProgress?: ProgressCallback
): Promise<{ noir: Noir; backend: UltraHonkBackend }> {
  if (cachedNoir && cachedBackend) {
    return { noir: cachedNoir, backend: cachedBackend }
  }

  onProgress?.('Initializing WASM modules...', 10)
  await initializeWasm()

  onProgress?.('Initializing proof system...', 15)
  const noir = new Noir(circuit)
  const backend = new UltraHonkBackend(circuit.bytecode as string)

  cachedNoir = noir
  cachedBackend = backend

  return { noir, backend }
}

/**
 * Get the index and length of a header field (case-insensitive)
 * Skips DKIM-Signature headers
 */
function getConstrainedHeaderSequence(
  headers: Buffer,
  fieldName: string
): { index: string; length: string } {
  const headerStr = headers.toString()

  const regex = new RegExp(
    `[${fieldName[0].toUpperCase()}${fieldName[0].toLowerCase()}]${fieldName.slice(1).toLowerCase()}:.*?(?=\\r?\\n(?![\\t ]))`,
    'g'
  )

  // Find DKIM-Signature ranges to skip
  const dkimRanges: { start: number; end: number }[] = []
  const dkimRegex = /DKIM-Signature:.*?(?=\r?\n(?![\t ]))/gs
  let dkimMatch
  while ((dkimMatch = dkimRegex.exec(headerStr)) !== null) {
    dkimRanges.push({
      start: dkimMatch.index,
      end: dkimMatch.index + dkimMatch[0].length,
    })
  }

  // Find header outside DKIM ranges
  const matches = [...headerStr.matchAll(regex)]
  for (const match of matches) {
    const matchStart = match.index ?? 0
    const insideDkim = dkimRanges.some(
      (range) => matchStart >= range.start && matchStart <= range.end
    )

    if (!insideDkim) {
      return {
        index: matchStart.toString(),
        length: match[0].length.toString(),
      }
    }
  }

  throw new Error(`Header field "${fieldName}" not found outside DKIM headers`)
}

/**
 * Get sequence for header value (after "fieldname:")
 */
function getHeaderValueSequence(
  headerSequence: { index: string; length: string },
  fieldName: string
): { index: string; length: string } {
  const headerIndex = parseInt(headerSequence.index)
  const headerLength = parseInt(headerSequence.length)
  const prefixLength = fieldName.length + 1

  return {
    index: (headerIndex + prefixLength).toString(),
    length: (headerLength - prefixLength).toString(),
  }
}

/**
 * Extract event name from subject line
 * Luma emails: "Thanks for joining <Event Name>"
 */
function getEventNameSequence(
  headers: Buffer,
  subjectValueSequence: { index: string; length: string }
): { index: string; length: string } {
  const valueIndex = parseInt(subjectValueSequence.index)
  const valueLength = parseInt(subjectValueSequence.length)
  const subjectValue = headers.subarray(valueIndex, valueIndex + valueLength).toString()

  const prefix = 'Thanks for joining '
  const prefixIndex = subjectValue.indexOf(prefix)

  if (prefixIndex !== -1) {
    const eventNameOffset = prefixIndex + prefix.length
    return {
      index: (valueIndex + eventNameOffset).toString(),
      length: (valueLength - eventNameOffset).toString(),
    }
  }

  return subjectValueSequence
}

/**
 * Decode BoundedVec from Noir output
 */
function decodeBoundedVec(boundedVec: unknown): string {
  if (
    boundedVec &&
    typeof boundedVec === 'object' &&
    'storage' in boundedVec &&
    'len' in boundedVec
  ) {
    const vec = boundedVec as { storage: (string | number)[]; len: string | number }
    const length = parseInt(String(vec.len))
    const storage = vec.storage
    if (!Array.isArray(storage) || length === 0) return ''
    const bytes = storage.slice(0, length)
    return new TextDecoder().decode(new Uint8Array(bytes.map((b) => parseInt(String(b)))))
  }
  return ''
}

/**
 * Prepare circuit inputs from email content
 */
async function prepareCircuitInputs(
  emailBuffer: Uint8Array,
  onProgress?: ProgressCallback
): Promise<{
  inputs: Record<string, unknown>
  metadata: { domain: string; date: string; eventName: string }
}> {
  onProgress?.('Parsing email and verifying DKIM...', 20)

  const baseInputs = await generateEmailVerifierInputs(emailBuffer, {
    maxHeadersLength: 2048,
    ignoreBodyHashCheck: true,
  })

  const dkimResult = await verifyDKIMSignature(emailBuffer, undefined, undefined, true)
  const headers = dkimResult.headers

  onProgress?.('Extracting header fields...', 25)

  const dateHeaderSequence = getConstrainedHeaderSequence(headers, 'date')
  const dateValueSequence = getHeaderValueSequence(dateHeaderSequence, 'date')
  const subjectHeaderSequence = getConstrainedHeaderSequence(headers, 'subject')
  const subjectValueSequence = getHeaderValueSequence(subjectHeaderSequence, 'subject')
  const eventNameSequence = getEventNameSequence(headers, subjectValueSequence)

  const dateValue = headers
    .subarray(
      parseInt(dateValueSequence.index),
      parseInt(dateValueSequence.index) + parseInt(dateValueSequence.length)
    )
    .toString()
    .trim()

  const eventName = headers
    .subarray(
      parseInt(eventNameSequence.index),
      parseInt(eventNameSequence.index) + parseInt(eventNameSequence.length)
    )
    .toString()
    .trim()

  const inputs = {
    header: baseInputs.header,
    pubkey: baseInputs.pubkey,
    signature: baseInputs.signature,
    date_header_sequence: dateHeaderSequence,
    date_value_sequence: dateValueSequence,
    subject_header_sequence: subjectHeaderSequence,
    subject_value_sequence: subjectValueSequence,
    event_name_sequence: eventNameSequence,
  }

  return {
    inputs,
    metadata: {
      domain: dkimResult.domain || 'unknown',
      date: dateValue,
      eventName,
    },
  }
}

/**
 * Generate email proof from raw email content
 */
export async function generateEmailProof(
  emailContent: ArrayBuffer | Uint8Array,
  onProgress: ProgressCallback = () => {}
): Promise<EmailProofResult> {
  const emailBuffer =
    emailContent instanceof ArrayBuffer ? new Uint8Array(emailContent) : emailContent

  // Step 1: Load circuit
  onProgress('Loading circuit...', 5)
  const circuit = await loadCircuit(onProgress)

  // Step 2: Prepare inputs
  onProgress('Parsing email...', 15)
  const { inputs, metadata } = await prepareCircuitInputs(emailBuffer, onProgress)

  onProgress(`Found event: "${metadata.eventName}"`, 25)

  // Step 3: Initialize backend
  onProgress('Initializing proof system...', 30)
  const { noir, backend } = await initializeBackend(circuit, onProgress)

  // Step 4: Execute circuit
  onProgress('Executing circuit...', 40)
  const { witness, returnValue } = await noir.execute(inputs)

  if (returnValue && Array.isArray(returnValue) && returnValue.length >= 4) {
    console.log('[EmailProver] Circuit outputs:', {
      pubkeyHash: returnValue[0],
      emailNullifier: returnValue[1],
      date: decodeBoundedVec(returnValue[2]),
      eventName: decodeBoundedVec(returnValue[3]),
    })
  }

  // Step 5: Generate proof
  onProgress('Generating proof (30-60 seconds)...', 50)
  const startTime = Date.now()
  const proof = await backend.generateProof(witness, { keccak: true })
  const proofTime = ((Date.now() - startTime) / 1000).toFixed(1)

  onProgress(`Proof generated in ${proofTime}s`, 90)

  // Step 6: Format outputs
  const proofHex =
    '0x' +
    Array.from(proof.proof as Uint8Array)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('')

  const publicInputs = (proof.publicInputs as string[]).map((input: string) =>
    typeof input === 'string' && input.startsWith('0x') ? input.toLowerCase() : String(input)
  )

  const nullifier = publicInputs[1]?.toLowerCase() ?? ''

  onProgress('Proof ready!', 100)

  return {
    proof: proofHex,
    publicInputs,
    nullifier,
    metadata: {
      ...metadata,
      proofTimeSeconds: parseFloat(proofTime),
      proofSizeKB: (proof.proof.length / 1024).toFixed(2),
    },
  }
}

/**
 * Check if proof generation is supported
 */
export function isProofGenerationSupported(): { supported: boolean; reason?: string } {
  if (typeof WebAssembly === 'undefined') {
    return { supported: false, reason: 'WebAssembly not supported' }
  }
  if (typeof BigInt === 'undefined') {
    return { supported: false, reason: 'BigInt not supported' }
  }
  return { supported: true }
}

/**
 * Cleanup resources
 */
export async function cleanupProver(): Promise<void> {
  if (cachedBackend) {
    await cachedBackend.destroy()
    cachedBackend = null
    cachedNoir = null
  }
}


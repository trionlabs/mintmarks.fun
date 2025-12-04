/**
 * WASM Module Loader for Noir ZK Proofs
 * 
 * Handles initialization of ACVM and ABI WASM modules
 * with proper caching and error handling.
 */

let wasmInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize WASM modules for Noir proof generation
 * Safe to call multiple times - will only initialize once
 */
export async function initializeWasm(): Promise<void> {
  if (wasmInitialized) {
    return
  }

  // Prevent concurrent initialization
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // Dynamic import of WASM init functions
      const [initACVM, initAbi] = await Promise.all([
        import('@noir-lang/acvm_js/web').then((m) => m.default),
        import('@noir-lang/noirc_abi/web').then((m) => m.default),
      ])

      // Initialize with explicit WASM paths
      await Promise.all([
        initACVM(new URL('/wasm/acvm_js_bg.wasm', window.location.origin)),
        initAbi(new URL('/wasm/noirc_abi_wasm_bg.wasm', window.location.origin)),
      ])

      wasmInitialized = true
      if (import.meta.env.DEV) {
        console.log('[WASM] Modules initialized successfully')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[WASM] Failed to initialize modules:', error)
      }
      initPromise = null
      throw new Error(`WASM initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })()

  return initPromise
}

/**
 * Check if WASM modules are initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInitialized
}

/**
 * Reset WASM state (for testing)
 */
export function resetWasmState(): void {
  wasmInitialized = false
  initPromise = null
}


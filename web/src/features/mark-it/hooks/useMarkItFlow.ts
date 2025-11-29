/**
 * Mark It Flow Hook
 * 
 * Orchestrates the entire Mark It flow with PARALLEL email proof:
 * 
 * ┌─────────────────────────────────────────────┐
 * │  EMAIL PROOF (runs in background from start)│
 * │  [Terminal View - shows logs]               │
 * └─────────────────────────────────────────────┘
 * 
 * User Steps (sequential):
 * 1. Connect Wallet
 * 2. Verify Passport (waits for email proof)
 * 3. Select Network & Mint NFT
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPublicClient, http, encodeFunctionData, decodeErrorResult, BaseError } from 'viem'
import { useWallet } from '@/wallet'
import { getEmailRawForProof } from '@/services/gmail'
import { useAuth } from '@/contexts/AuthContext'
import {
  MINTMARKS_ABI,
  ZKPASSPORT_CONFIG,
} from '@/config/sepolia'
import {
  MINT_NETWORKS,
  getDefaultMintNetwork,
  isNetworkConfigured,
  type MintNetworkId,
} from '@/config/mintNetworks'
import { generateEmailProof } from '../lib/emailProver'
import { DEMO_CONFIG, DEMO_MOCK_DATA, STEP_PROGRESS, TERMINAL_MESSAGES } from '../config'
import type {
  MarkItStep,
  MarkItFlowState,
  UseMarkItFlowReturn,
  PassportProofResult,
  TerminalLogEntry,
  EmailProofStatus,
} from '../types'
import type { EmailMetadata } from '@/types/gmail'

/**
 * Create a public client for a specific network
 */
function createNetworkClient(networkId: MintNetworkId) {
  const network = MINT_NETWORKS[networkId]
  return createPublicClient({
    chain: network.viemChain,
    transport: http(network.rpcUrl),
  })
}

/**
 * Initial flow state
 */
function getInitialState(isDemo: boolean): MarkItFlowState {
  const defaultNetwork = getDefaultMintNetwork()
  
  return {
    step: 'wallet',
    progress: 0,
    email: null,
    // Email proof (parallel)
    emailProof: null,
    emailProofStatus: 'idle',
    emailProofProgress: 0,
    terminalLogs: [],
    // Passport
    passportProof: null,
    passportSubStep: 'generating-qr',  // Will be set properly when entering passport step
    passportQrUrl: null,
    // Mint
    mintResult: null,
    mintSubStep: 'preparing',  // Start with 'preparing' like the old version
    transactionHash: null,
    // Network selection
    selectedNetwork: defaultNetwork.id,
    // Error & Demo
    error: null,
    isDemo,
  }
}

/**
 * Calculate overall progress based on step
 */
function calculateProgress(step: MarkItStep, subProgress: number = 0): number {
  const stepRange = STEP_PROGRESS[step]
  return Math.round(stepRange.start + (stepRange.end - stepRange.start) * (subProgress / 100))
}

/**
 * Main Mark It Flow Hook
 */
export function useMarkItFlow(): UseMarkItFlowReturn {
  // Check for demo mode
  const isDemo = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('demo') === 'true'

  const [state, setState] = useState<MarkItFlowState>(() => getInitialState(isDemo))
  
  // External hooks
  const { isConnected, address, sendTransaction } = useWallet()
  const { accessToken } = useAuth()
  
  // Refs for cleanup
  const zkPassportRef = useRef<{ cleanup?: () => void } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const proofStartedRef = useRef(false)
  const passportVerificationStartedRef = useRef(false)
  
  // Ref to store passport proof (prevents race condition between callbacks)
  const passportProofRef = useRef<PassportProofResult | null>(null)
  
  // Ref to store prepared transaction data for confirmMint
  const preparedTxRef = useRef<{
    to: `0x${string}`
    data: `0x${string}`
    chainId: number
  } | null>(null)

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<MarkItFlowState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Add terminal log entry
   */
  const addTerminalLog = useCallback((message: string, type: TerminalLogEntry['type'], progress?: number) => {
    const entry: TerminalLogEntry = {
      timestamp: new Date(),
      message,
      type,
      progress,
    }
    setState((prev) => ({
      ...prev,
      terminalLogs: [...prev.terminalLogs, entry],
    }))
  }, [])

  /**
   * Update email proof status with terminal log
   */
  const updateProofStatus = useCallback((status: EmailProofStatus, progress: number) => {
    const message = TERMINAL_MESSAGES[status] || status
    const type: TerminalLogEntry['type'] = status === 'complete' ? 'success' : status === 'error' ? 'error' : 'progress'
    
    addTerminalLog(message, type, progress)
    updateState({
      emailProofStatus: status,
      emailProofProgress: progress,
    })
  }, [addTerminalLog, updateState])

  /**
   * Generate email proof (runs in parallel)
   */
  const generateProof = useCallback(async () => {
    if (!state.email) {
      addTerminalLog('❌ No email selected', 'error')
      return
    }

    // Check if this is an uploaded file or needs Gmail API
    const uploadedFile = (state.email as EmailMetadata & { _uploadedFile?: File })._uploadedFile
    const needsGmailApi = !uploadedFile

    if (needsGmailApi && !accessToken) {
      addTerminalLog('❌ Not authenticated with Gmail', 'error')
      updateState({ emailProofStatus: 'error' })
      return
    }

    abortRef.current = new AbortController()

    try {
      addTerminalLog('🚀 Starting email proof generation...', 'info')

      if (state.isDemo) {
        // Demo mode: simulate proof generation
        updateProofStatus('loading-email', 10)
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.emailLoadDelay))

        updateProofStatus('initializing-wasm', 25)
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.wasmInitDelay))

        updateProofStatus('loading-circuit', 45)
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.circuitLoadDelay))

        updateProofStatus('generating-proof', 70)
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.proofGenerateDelay))

        updateProofStatus('complete', 100)
        updateState({ emailProof: DEMO_MOCK_DATA.emailProof })
        return
      }

      // Real mode: generate actual proof
      let emailBuffer: Uint8Array

      if (uploadedFile) {
        updateProofStatus('loading-email', 5)
        addTerminalLog('📁 Reading uploaded .eml file...', 'info')
        const arrayBuffer = await uploadedFile.arrayBuffer()
        emailBuffer = new Uint8Array(arrayBuffer)
      } else {
        updateProofStatus('loading-email', 5)
        addTerminalLog('📨 Fetching email from Gmail API...', 'info')
        const { buffer } = await getEmailRawForProof(accessToken!, state.email.id)
        emailBuffer = buffer
      }

      addTerminalLog(`📦 Email loaded (${(emailBuffer.length / 1024).toFixed(1)} KB)`, 'info')
      updateProofStatus('generating-proof', 15)

      // Generate proof with progress callback
      const result = await generateEmailProof(emailBuffer, (message, percent) => {
        addTerminalLog(`⏳ ${message}`, 'progress', percent)
        updateState({ emailProofProgress: percent })
      })

      addTerminalLog(`✅ Proof generated in ${result.metadata.proofTimeSeconds}s`, 'success')
      addTerminalLog(`📊 Proof size: ${result.metadata.proofSizeKB} KB`, 'info')
      updateProofStatus('complete', 100)
      updateState({ emailProof: result })

    } catch (error) {
      console.error('[MarkIt] Email proof generation failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate email proof'
      addTerminalLog(`❌ Error: ${errorMsg}`, 'error')
      updateState({ emailProofStatus: 'error' })
    }
  }, [state.email, state.isDemo, accessToken, addTerminalLog, updateProofStatus, updateState])

  /**
   * Start the flow with an email
   * Email proof starts IMMEDIATELY in parallel
   */
  const start = useCallback((email: EmailMetadata) => {
    proofStartedRef.current = false
    
    setState({
      ...getInitialState(isDemo),
      email,
      step: isConnected ? 'passport' : 'wallet',
      progress: isConnected ? STEP_PROGRESS.passport.start : 0,
      emailProofStatus: 'idle',
      terminalLogs: [{
        timestamp: new Date(),
        message: `📧 Selected: ${email.subject || 'Unknown email'}`,
        type: 'info',
      }],
    })
  }, [isConnected, isDemo])

  /**
   * Start passport verification
   */
  const startPassportVerification = useCallback(async () => {
    if (!address || !state.emailProof) {
      passportVerificationStartedRef.current = false
      updateState({ error: 'Wallet not connected or no email proof' })
      return
    }

    try {
      if (state.isDemo) {
        // Demo mode: simulate passport verification
        updateState({
          passportSubStep: 'generating-qr',
          passportQrUrl: 'https://demo.zkpassport.app/verify?demo=true',
        })
        await new Promise((r) => setTimeout(r, 500))

        updateState({ passportSubStep: 'waiting-scan' })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.passportVerifyDelay))

        updateState({
          passportProof: DEMO_MOCK_DATA.passportProof,
          passportSubStep: 'complete',
          step: 'mint',
          progress: calculateProgress('mint', 0),
        })
        return
      }

      // Real mode: start ZKPassport verification
      updateState({ passportSubStep: 'generating-qr' })

      const { ZKPassport } = await import('@zkpassport/sdk')
      const zkPassport = new ZKPassport(ZKPASSPORT_CONFIG.domain)

      const queryBuilder = await zkPassport.request({
        name: 'Mintmarks',
        logo: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://mintmarks.fun/logo.png',
        purpose: 'Verify your identity to mint your event attendance NFT',
        scope: ZKPASSPORT_CONFIG.scope,
        mode: 'compressed-evm',
        devMode: ZKPASSPORT_CONFIG.devMode,
      })

      // Use the selected network ID as the chain binding
      // This ensures the proof is generated for the correct chain
      // Note: ZKPassport expects snake_case (e.g. ethereum_sepolia), so we replace hyphens
      const chainBinding = state.selectedNetwork.replace(/-/g, '_')
      
      const { url, onProofGenerated, onResult } = queryBuilder
        .gte('age', 18)
        .bind('user_address', address)
        .bind('chain', chainBinding)
        .bind('custom_data', state.emailProof.nullifier)
        .done()

      updateState({
        passportQrUrl: url,
        passportSubStep: 'waiting-scan',
      })

      // Store cleanup function
      zkPassportRef.current = {
        cleanup: () => {
          // ZKPassport doesn't expose cleanup, but we can null the ref
        },
      }

      onProofGenerated((proof: unknown) => {
        const verifierParams = zkPassport.getSolidityVerifierParameters({
          proof,
          scope: ZKPASSPORT_CONFIG.scope,
          devMode: ZKPASSPORT_CONFIG.devMode,
        }) as PassportProofResult

        // Store in ref for mint() to use (prevents stale closure)
        passportProofRef.current = verifierParams

        updateState({
          passportProof: verifierParams,
          passportSubStep: 'verifying',
        })
      })

      onResult(({ verified }: { verified: boolean; uniqueIdentifier?: string }) => {
        if (verified) {
          // Use ref to ensure passport proof is included
          // Set to 'ready-to-mint' so user sees the button and must click to start minting
          updateState({
            passportSubStep: 'complete',
            step: 'mint',
            mintSubStep: 'ready-to-mint', // User must click button to start minting
            progress: calculateProgress('mint', 0),
            // Always include passport proof from ref
            passportProof: passportProofRef.current,
          })
        } else {
          updateState({
            error: 'Passport verification failed',
            passportSubStep: 'error',
          })
        }
      })
    } catch (error) {
      console.error('[MarkIt] Passport verification failed:', error)
      passportVerificationStartedRef.current = false
      updateState({
        error: error instanceof Error ? error.message : 'Failed to start passport verification',
        passportSubStep: 'error',
      })
    }
  }, [address, state.emailProof, state.isDemo, updateState])

  /**
   * Set the network to mint on
   */
  const setNetwork = useCallback((network: MintNetworkId) => {
    updateState({ selectedNetwork: network })
    // Clear prepared transaction when network changes
    preparedTxRef.current = null
  }, [updateState])

  /**
   * Mint the NFT
   */
  const mint = useCallback(async () => {
    // Use ref as fallback for passport proof (prevents stale closure)
    const passportProof = state.passportProof || passportProofRef.current
    
    if (!state.emailProof || !passportProof || !address) {
      console.log('[MarkIt] mint() missing data:', {
        hasEmailProof: !!state.emailProof,
        hasPassportProof: !!passportProof,
        hasPassportProofInState: !!state.passportProof,
        hasPassportProofInRef: !!passportProofRef.current,
        hasAddress: !!address,
      })
      updateState({ error: 'Missing required data for minting' })
      return
    }
    
    console.log('[MarkIt] mint() starting with passport proof from:', state.passportProof ? 'state' : 'ref')

    // Get selected network configuration
    const selectedNetwork = MINT_NETWORKS[state.selectedNetwork]
    console.log('[MarkIt] Selected network:', selectedNetwork.name, selectedNetwork.chainId)

    try {
      if (state.isDemo) {
        // Demo mode: simulate minting
        updateState({ mintSubStep: 'preparing' })
        await new Promise((r) => setTimeout(r, 500))

        updateState({ mintSubStep: 'confirming' })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.mintDelay))

        updateState({
          mintResult: DEMO_MOCK_DATA.mintResult,
          mintSubStep: 'complete',
          transactionHash: DEMO_MOCK_DATA.mintResult.transactionHash,
          step: 'success',
          progress: 100,
        })
        return
      }

      // Real mode: mint on-chain
      updateState({ mintSubStep: 'checking-nullifier' })

      // Validate contract is configured for selected network
      if (!isNetworkConfigured(state.selectedNetwork)) {
        throw new Error(`Contract not deployed on ${selectedNetwork.name}. Please select a different network.`)
      }

      const mintmarksAddress = selectedNetwork.contractAddress!
      
      // Create client for selected network
      const networkClient = createNetworkClient(state.selectedNetwork)

      // Check if nullifier is already used
      const isUsed = await networkClient.readContract({
        address: mintmarksAddress,
        abi: MINTMARKS_ABI,
        functionName: 'emailNullifierUsed',
        args: [state.emailProof.publicInputs[1] as `0x${string}`],
      })
      
      console.log('[MarkIt] Nullifier used:', isUsed)

      if (isUsed) {
        updateState({
          error: `This email has already been used to mint on ${selectedNetwork.name}`,
          mintSubStep: 'error',
        })
        return
      }

      updateState({ mintSubStep: 'simulating' })

      // Encode function data - cast passport proof to expected type
      // Use local passportProof variable (from state or ref)
      const passportProofForContract = {
        version: passportProof.version as `0x${string}`,
        proofVerificationData: {
          vkeyHash: passportProof.proofVerificationData.vkeyHash as `0x${string}`,
          proof: passportProof.proofVerificationData.proof as `0x${string}`,
          publicInputs: passportProof.proofVerificationData.publicInputs as `0x${string}`[],
        },
        committedInputs: passportProof.committedInputs as `0x${string}`,
        serviceConfig: {
          validityPeriodInSeconds: BigInt(passportProof.serviceConfig.validityPeriodInSeconds),
          domain: passportProof.serviceConfig.domain,
          scope: passportProof.serviceConfig.scope,
          devMode: passportProof.serviceConfig.devMode,
        },
      }

      // Simulate the transaction first to catch errors early
      console.log('[MarkIt] Simulating transaction on', selectedNetwork.name)
      try {
        await networkClient.simulateContract({
          address: mintmarksAddress,
          abi: MINTMARKS_ABI,
          functionName: 'mint',
          args: [
            state.emailProof.proof as `0x${string}`,
            state.emailProof.publicInputs as `0x${string}`[],
            passportProofForContract,
          ],
          account: address,
        })
        console.log('[MarkIt] Simulation successful!')
      } catch (simError) {
        console.error('[MarkIt] Simulation failed:', simError)
        
        // Try to decode the error
        let errorMessage = 'Transaction simulation failed'
        
        if (simError instanceof BaseError) {
          const revertError = simError.walk((err: unknown) => 
            err !== null && typeof err === 'object' && 'data' in err && typeof (err as { data: unknown }).data === 'object'
          )
          
          if (revertError && 'data' in revertError) {
            try {
              const decoded = decodeErrorResult({
                abi: MINTMARKS_ABI,
                data: (revertError as { data: `0x${string}` }).data,
              })
              errorMessage = `Contract error: ${decoded.errorName}`
              console.error('[MarkIt] Decoded error:', decoded)
            } catch {
              // Couldn't decode, use generic message
            }
          }
          
          // Also check for common error patterns
          const errStr = simError.message || simError.toString()
          if (errStr.includes('InvalidEmailProof')) {
            errorMessage = 'Email proof verification failed. The proof may be invalid or the verifier contract may not recognize the format.'
          } else if (errStr.includes('InvalidPassportProof')) {
            errorMessage = 'Passport proof verification failed. Please re-verify your passport.'
          } else if (errStr.includes('InvalidPassportScope')) {
            errorMessage = 'Passport scope/domain mismatch. Expected domain: mintmarks.fun or localhost'
          } else if (errStr.includes('InvalidBoundAddress')) {
            errorMessage = 'Bound address mismatch. The passport proof was generated for a different wallet.'
          } else if (errStr.includes('InvalidBoundChain')) {
            errorMessage = 'Bound chain mismatch. The passport proof was generated for a different chain.'
          } else if (errStr.includes('InvalidBoundEmailNullifier')) {
            errorMessage = 'Email nullifier mismatch. The passport proof was generated for a different email.'
          } else if (errStr.includes('EmailNullifierAlreadyUsed')) {
            errorMessage = 'This email has already been used to mint.'
          } else if (errStr.includes('PassportIdAlreadyUsed')) {
            errorMessage = 'This passport has already been used to mint.'
          }
        }
        
        updateState({
          error: errorMessage,
          mintSubStep: 'error',
        })
        return
      }

      const data = encodeFunctionData({
        abi: MINTMARKS_ABI,
        functionName: 'mint',
        args: [
          state.emailProof.proof as `0x${string}`,
          state.emailProof.publicInputs as `0x${string}`[],
          passportProofForContract,
        ],
      })

      // Store prepared transaction for confirmMint
      preparedTxRef.current = {
        to: mintmarksAddress,
        data,
        chainId: selectedNetwork.chainId,
      }

      console.log('[MarkIt] Transaction prepared, waiting for user confirmation')
      console.log('[MarkIt] To:', mintmarksAddress)
      console.log('[MarkIt] Network:', selectedNetwork.name)
      console.log('[MarkIt] Chain ID:', selectedNetwork.chainId)
      console.log('[MarkIt] Data length:', data.length)

      // Set state to ready-to-mint, waiting for user to click "Mint NFT" button
      updateState({ mintSubStep: 'ready-to-mint' })

    } catch (error) {
      console.error('[MarkIt] Mint preparation failed:', error)
      updateState({
        error: error instanceof Error ? error.message : 'Failed to prepare mint transaction',
        mintSubStep: 'error',
      })
    }
  }, [state.emailProof, state.passportProof, state.isDemo, state.selectedNetwork, address, updateState])

  /**
   * Confirm and send mint transaction
   * Called when user clicks "Mint NFT" button
   * If transaction is not prepared yet, prepares it first
   */
  const confirmMint = useCallback(async () => {
    // If transaction is not prepared, prepare it first
    if (!preparedTxRef.current) {
      // Check if we have all required data
      if (!state.emailProof || !state.passportProof || !address) {
        updateState({ error: 'Missing required data for minting' })
        return
      }
      
      // Prepare transaction first
      await mint()
      
      // If still not prepared (error occurred), return
      if (!preparedTxRef.current) {
        return
      }
    }

    if (!sendTransaction) {
      updateState({ error: 'Wallet not connected' })
      return
    }

    // Get network client for waiting on receipt
    const selectedNetwork = MINT_NETWORKS[state.selectedNetwork]
    const networkClient = createNetworkClient(state.selectedNetwork)

    try {
      updateState({ mintSubStep: 'confirming' })

      console.log('[MarkIt] Sending transaction on', selectedNetwork.name)
      const result = await sendTransaction(preparedTxRef.current)
      
      console.log('[MarkIt] Transaction sent:', result.hash)

      updateState({
        transactionHash: result.hash,
        mintSubStep: 'pending',
      })

      // Wait for confirmation on the correct network
      const receipt = await networkClient.waitForTransactionReceipt({ hash: result.hash })

      if (receipt.status === 'success') {
        updateState({
          mintResult: {
            transactionHash: result.hash,
            eventName: state.emailProof?.metadata.eventName ?? 'Unknown Event',
          },
          mintSubStep: 'complete',
          step: 'success',
          progress: 100,
        })
      } else {
        updateState({
          error: 'Transaction failed',
          mintSubStep: 'error',
        })
      }

      // Clear prepared tx
      preparedTxRef.current = null
    } catch (error) {
      console.error('[MarkIt] Transaction failed:', error)
      updateState({
        error: error instanceof Error ? error.message : 'Failed to send transaction',
        mintSubStep: 'error',
      })
    }
  }, [sendTransaction, state.emailProof, state.selectedNetwork, updateState, mint])

  /**
   * Move to next step
   * Uses functional update to avoid stale closure issues
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      const steps: MarkItStep[] = ['wallet', 'passport', 'mint', 'success']
      const currentIndex = steps.indexOf(prev.step)
      
      if (currentIndex < steps.length - 1) {
        const nextStepValue = steps[currentIndex + 1]
        
        // Special handling for wallet → passport transition
        if (prev.step === 'wallet' && nextStepValue === 'passport') {
          // Reset passport verification state and use CURRENT emailProofStatus
          return {
            ...prev,
            step: nextStepValue,
            progress: calculateProgress(nextStepValue, 0),
            passportSubStep: prev.emailProofStatus === 'complete' ? 'generating-qr' : 'waiting-proof',
            // Reset passport state for fresh verification
            passportQrUrl: null,
            passportProof: null,
          }
        } else {
          return {
            ...prev,
            step: nextStepValue,
            progress: calculateProgress(nextStepValue, 0),
          }
        }
      }
      return prev
    })
  }, [])

  /**
   * Go back to previous step
   * Resets step-specific state to allow fresh verification
   */
  const goBack = useCallback(() => {
    setState((prev) => {
      const steps: MarkItStep[] = ['wallet', 'passport', 'mint', 'success']
      const currentIndex = steps.indexOf(prev.step)
      
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1]
        
        // Reset passport state when going back from passport/mint
        const resetPassport = prev.step === 'passport' || prev.step === 'mint'
        
        return {
          ...prev,
          step: prevStep,
          progress: calculateProgress(prevStep, 0),
          error: null,
          // Reset passport verification state for fresh start
          ...(resetPassport && {
            passportSubStep: 'waiting-proof',
            passportQrUrl: null,
            passportProof: null,
          }),
        }
      }
      return prev
    })
    
    // Reset passport verification ref
    passportVerificationStartedRef.current = false
  }, [])

  /**
   * Cancel and reset
   */
  const cancel = useCallback(() => {
    abortRef.current?.abort()
    zkPassportRef.current?.cleanup?.()
    proofStartedRef.current = false
    setState(getInitialState(isDemo))
  }, [isDemo])

  /**
   * Retry current step
   */
  const retry = useCallback(() => {
    updateState({ error: null })
    
    switch (state.step) {
      case 'passport':
        updateState({ passportSubStep: 'waiting-proof' })
        if (state.emailProofStatus === 'complete') {
          startPassportVerification()
        }
        break
      case 'mint':
        updateState({ mintSubStep: 'preparing' })
        mint()
        break
    }
  }, [state.step, state.emailProofStatus, startPassportVerification, mint, updateState])

  /**
   * Set error
   */
  const setError = useCallback((error: string) => {
    updateState({ error })
  }, [updateState])

  // 🔥 START EMAIL PROOF IMMEDIATELY when flow starts (parallel execution)
  useEffect(() => {
    if (
      state.email &&
      state.emailProofStatus === 'idle' &&
      !proofStartedRef.current
    ) {
      proofStartedRef.current = true
      generateProof()
    }
  }, [state.email, state.emailProofStatus, generateProof])

  // NOTE: Auto-advance removed - user must click "Continue" on wallet step
  // This allows user to review/change wallet before proceeding

  // Auto-trigger passport verification when proof is ready and at passport step
  useEffect(() => {
    if (
      state.step === 'passport' &&
      state.emailProofStatus === 'complete' &&
      state.emailProof &&
      isConnected &&
      !state.error &&
      !passportVerificationStartedRef.current
    ) {
      // If waiting for proof, start generating QR
      if (state.passportSubStep === 'waiting-proof') {
        passportVerificationStartedRef.current = true
        updateState({ passportSubStep: 'generating-qr' })
        startPassportVerification()
      }
      // If already generating QR but not started and no QR URL yet, start it
      else if (state.passportSubStep === 'generating-qr' && !state.passportQrUrl) {
        passportVerificationStartedRef.current = true
        startPassportVerification()
      }
    }
    
    // Reset ref when leaving passport step
    if (state.step !== 'passport') {
      passportVerificationStartedRef.current = false
    }
  }, [state.step, state.passportSubStep, state.emailProofStatus, state.emailProof, state.passportQrUrl, isConnected, state.error, startPassportVerification, updateState])

  // NOTE: Mint is NOT automatic - user must click "Mint NFT" button
  // The button is shown when mintSubStep === 'ready-to-mint'
  // When clicked, it calls mint() which prepares the transaction

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      zkPassportRef.current?.cleanup?.()
    }
  }, [])

  return {
    ...state,
    start,
    nextStep,
    goBack,
    cancel,
    retry,
    setError,
    setNetwork,
    mint,
    confirmMint,
  }
}

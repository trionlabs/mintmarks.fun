/**
 * Mark It Flow Hook
 * 
 * Orchestrates the entire Mark It flow:
 * 1. Connect Wallet
 * 2. Generate Email Proof
 * 3. Verify Passport
 * 4. Mint NFT
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPublicClient, http, encodeFunctionData, decodeErrorResult, BaseError } from 'viem'
import { useWallet } from '@/wallet'
import { getEmailRawForProof } from '@/services/gmail'
import { useAuth } from '@/contexts/AuthContext'
import {
  ethereumSepolia,
  SEPOLIA_RPC_URL,
  MINTMARKS_ABI,
  ZKPASSPORT_CONFIG,
  areContractsConfigured,
  getMintmarksAddress,
} from '@/config/sepolia'
import { generateEmailProof } from '../lib/emailProver'
import { DEMO_CONFIG, DEMO_MOCK_DATA, STEP_PROGRESS } from '../config'
import type {
  MarkItStep,
  MarkItFlowState,
  UseMarkItFlowReturn,
  PassportProofResult,
} from '../types'
import type { EmailMetadata } from '@/types/gmail'

// Create public client for reading blockchain
const publicClient = createPublicClient({
  chain: ethereumSepolia,
  transport: http(SEPOLIA_RPC_URL),
})

/**
 * Initial flow state
 */
function getInitialState(isDemo: boolean): MarkItFlowState {
  return {
    step: 'wallet',
    progress: 0,
    email: null,
    emailProof: null,
    emailProofSubStep: 'loading-email',
    emailProofProgress: { message: '', percent: 0 },
    passportProof: null,
    passportSubStep: 'waiting-wallet',
    passportQrUrl: null,
    mintResult: null,
    mintSubStep: 'preparing',
    transactionHash: null,
    error: null,
    isDemo,
  }
}

/**
 * Calculate overall progress based on step and sub-step
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
   * Start the flow with an email
   */
  const start = useCallback((email: EmailMetadata) => {
    setState({
      ...getInitialState(isDemo),
      email,
      step: isConnected ? 'email-proof' : 'wallet',
      progress: isConnected ? STEP_PROGRESS['email-proof'].start : 0,
    })

    // If wallet is already connected, start email proof immediately
    if (isConnected && !isDemo) {
      // Will be triggered by effect
    }
  }, [isConnected, isDemo])

  /**
   * Generate email proof
   */
  const generateProof = useCallback(async () => {
    if (!state.email || !accessToken) {
      updateState({ error: 'No email selected or not authenticated' })
      return
    }

    abortRef.current = new AbortController()

    try {
      if (state.isDemo) {
        // Demo mode: simulate proof generation
        updateState({
          emailProofSubStep: 'loading-email',
          emailProofProgress: { message: 'Loading email...', percent: 10 },
        })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.emailLoadDelay))

        updateState({
          emailProofSubStep: 'initializing-wasm',
          emailProofProgress: { message: 'Initializing WASM...', percent: 20 },
        })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.wasmInitDelay))

        updateState({
          emailProofSubStep: 'loading-circuit',
          emailProofProgress: { message: 'Loading circuit...', percent: 35 },
        })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.circuitLoadDelay))

        updateState({
          emailProofSubStep: 'generating-proof',
          emailProofProgress: { message: 'Generating proof...', percent: 60 },
        })
        await new Promise((r) => setTimeout(r, DEMO_CONFIG.proofGenerateDelay))

        updateState({
          emailProof: DEMO_MOCK_DATA.emailProof,
          emailProofSubStep: 'complete',
          emailProofProgress: { message: 'Proof ready!', percent: 100 },
          step: 'passport',
          progress: calculateProgress('passport', 0),
        })
        return
      }

      // Real mode: generate actual proof
      updateState({
        emailProofSubStep: 'loading-email',
        emailProofProgress: { message: 'Loading email from Gmail...', percent: 5 },
      })

      // Fetch raw email and decode to buffer
      const { buffer: emailBuffer } = await getEmailRawForProof(accessToken, state.email.id)

      updateState({
        emailProofSubStep: 'generating-proof',
        emailProofProgress: { message: 'Starting proof generation...', percent: 10 },
      })

      // Generate proof with progress callback
      const result = await generateEmailProof(emailBuffer, (message, percent) => {
        updateState({
          emailProofProgress: { message, percent },
        })
      })

      updateState({
        emailProof: result,
        emailProofSubStep: 'complete',
        emailProofProgress: { message: 'Proof ready!', percent: 100 },
        step: 'passport',
        progress: calculateProgress('passport', 0),
      })
    } catch (error) {
      console.error('[MarkIt] Email proof generation failed:', error)
      updateState({
        error: error instanceof Error ? error.message : 'Failed to generate email proof',
        emailProofSubStep: 'error',
      })
    }
  }, [state.email, state.isDemo, accessToken, updateState])

  /**
   * Start passport verification
   */
  const startPassportVerification = useCallback(async () => {
    if (!address || !state.emailProof) {
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
        logo: 'https://mintmarks.fun/logo.png',
        purpose: 'Verify your identity to mint your event attendance NFT',
        scope: ZKPASSPORT_CONFIG.scope,
        mode: 'compressed-evm',
        devMode: ZKPASSPORT_CONFIG.devMode,
      })

      const { url, onProofGenerated, onResult } = queryBuilder
        .gte('age', 18)
        .bind('user_address', address)
        .bind('chain', 'ethereum_sepolia')
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
        console.log('[MarkIt] Passport proof generated:', proof)
        const verifierParams = zkPassport.getSolidityVerifierParameters({
          proof,
          scope: ZKPASSPORT_CONFIG.scope,
          devMode: ZKPASSPORT_CONFIG.devMode,
        }) as PassportProofResult

        updateState({
          passportProof: verifierParams,
          passportSubStep: 'verifying',
        })
      })

      onResult(({ verified }: { verified: boolean; uniqueIdentifier?: string }) => {
        if (verified) {
          updateState({
            passportSubStep: 'complete',
            step: 'mint',
            progress: calculateProgress('mint', 0),
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
      updateState({
        error: error instanceof Error ? error.message : 'Failed to start passport verification',
        passportSubStep: 'error',
      })
    }
  }, [address, state.emailProof, state.isDemo, updateState])

  /**
   * Mint the NFT
   */
  const mint = useCallback(async () => {
    if (!state.emailProof || !state.passportProof || !address) {
      updateState({ error: 'Missing required data for minting' })
      return
    }

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

      // Validate contracts are configured
      if (!areContractsConfigured()) {
        throw new Error('Contracts not configured. Check .env file.')
      }

      const mintmarksAddress = getMintmarksAddress()
      console.log('[MarkIt] Checking nullifier on contract:', mintmarksAddress)
      console.log('[MarkIt] Nullifier:', state.emailProof.publicInputs[1])

      // Check if nullifier is already used
      const isUsed = await publicClient.readContract({
        address: mintmarksAddress,
        abi: MINTMARKS_ABI,
        functionName: 'emailNullifierUsed',
        args: [state.emailProof.publicInputs[1] as `0x${string}`],
      })
      
      console.log('[MarkIt] Nullifier used:', isUsed)

      if (isUsed) {
        updateState({
          error: 'This email has already been used to mint',
          mintSubStep: 'error',
        })
        return
      }

      updateState({ mintSubStep: 'simulating' })

      // Encode function data - cast passport proof to expected type
      const passportProofForContract = {
        version: state.passportProof.version as `0x${string}`,
        proofVerificationData: {
          vkeyHash: state.passportProof.proofVerificationData.vkeyHash as `0x${string}`,
          proof: state.passportProof.proofVerificationData.proof as `0x${string}`,
          publicInputs: state.passportProof.proofVerificationData.publicInputs as `0x${string}`[],
        },
        committedInputs: state.passportProof.committedInputs as `0x${string}`,
        serviceConfig: {
          validityPeriodInSeconds: BigInt(state.passportProof.serviceConfig.validityPeriodInSeconds),
          domain: state.passportProof.serviceConfig.domain,
          scope: state.passportProof.serviceConfig.scope,
          devMode: state.passportProof.serviceConfig.devMode,
        },
      }

      // Debug log the exact data being sent
      console.log('[MarkIt] Email proof length:', state.emailProof.proof.length)
      console.log('[MarkIt] Email public inputs count:', state.emailProof.publicInputs.length)
      console.log('[MarkIt] Email public inputs (first 5):', state.emailProof.publicInputs.slice(0, 5))
      console.log('[MarkIt] Passport proof:', {
        version: passportProofForContract.version,
        vkeyHash: passportProofForContract.proofVerificationData.vkeyHash,
        proofLen: passportProofForContract.proofVerificationData.proof.length,
        publicInputsCount: passportProofForContract.proofVerificationData.publicInputs.length,
        domain: passportProofForContract.serviceConfig.domain,
        scope: passportProofForContract.serviceConfig.scope,
        devMode: passportProofForContract.serviceConfig.devMode,
      })

      // Simulate the transaction first to catch errors early
      console.log('[MarkIt] Simulating transaction...')
      try {
        await publicClient.simulateContract({
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
        chainId: ethereumSepolia.id,
      }

      console.log('[MarkIt] Transaction prepared, waiting for user confirmation')
      console.log('[MarkIt] To:', mintmarksAddress)
      console.log('[MarkIt] Chain ID:', ethereumSepolia.id)
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
  }, [state.emailProof, state.passportProof, state.isDemo, address, updateState])

  /**
   * Confirm and send mint transaction
   * Called when user clicks "Mint NFT" button
   */
  const confirmMint = useCallback(async () => {
    if (!preparedTxRef.current) {
      updateState({ error: 'No transaction prepared' })
      return
    }

    if (!sendTransaction) {
      updateState({ error: 'Wallet not connected' })
      return
    }

    try {
      updateState({ mintSubStep: 'confirming' })

      console.log('[MarkIt] Sending transaction...')
      const result = await sendTransaction(preparedTxRef.current)
      
      console.log('[MarkIt] Transaction sent:', result.hash)

      updateState({
        transactionHash: result.hash,
        mintSubStep: 'pending',
      })

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash })

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
  }, [sendTransaction, state.emailProof, updateState])

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    const steps: MarkItStep[] = ['wallet', 'email-proof', 'passport', 'mint', 'success']
    const currentIndex = steps.indexOf(state.step)
    
    if (currentIndex < steps.length - 1) {
      const nextStepValue = steps[currentIndex + 1]
      updateState({
        step: nextStepValue,
        progress: calculateProgress(nextStepValue, 0),
      })
    }
  }, [state.step, updateState])

  /**
   * Go back to previous step
   */
  const goBack = useCallback(() => {
    const steps: MarkItStep[] = ['wallet', 'email-proof', 'passport', 'mint', 'success']
    const currentIndex = steps.indexOf(state.step)
    
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1]
      updateState({
        step: prevStep,
        progress: calculateProgress(prevStep, 0),
        error: null,
      })
    }
  }, [state.step, updateState])

  /**
   * Cancel and reset
   */
  const cancel = useCallback(() => {
    abortRef.current?.abort()
    zkPassportRef.current?.cleanup?.()
    setState(getInitialState(isDemo))
  }, [isDemo])

  /**
   * Retry current step
   */
  const retry = useCallback(() => {
    updateState({ error: null })
    
    switch (state.step) {
      case 'email-proof':
        updateState({ emailProofSubStep: 'loading-email' })
        generateProof()
        break
      case 'passport':
        updateState({ passportSubStep: 'waiting-wallet' })
        startPassportVerification()
        break
      case 'mint':
        updateState({ mintSubStep: 'preparing' })
        mint()
        break
    }
  }, [state.step, generateProof, startPassportVerification, mint, updateState])

  /**
   * Set error
   */
  const setError = useCallback((error: string) => {
    updateState({ error })
  }, [updateState])

  // Auto-start email proof when wallet connects
  useEffect(() => {
    if (
      state.step === 'wallet' &&
      isConnected &&
      state.email &&
      !state.error
    ) {
      updateState({
        step: 'email-proof',
        progress: calculateProgress('email-proof', 0),
      })
    }
  }, [isConnected, state.step, state.email, state.error, updateState])

  // Auto-trigger email proof generation
  useEffect(() => {
    if (
      state.step === 'email-proof' &&
      state.emailProofSubStep === 'loading-email' &&
      state.email &&
      !state.error
    ) {
      generateProof()
    }
  }, [state.step, state.emailProofSubStep, state.email, state.error, generateProof])

  // Auto-trigger passport verification
  useEffect(() => {
    if (
      state.step === 'passport' &&
      state.passportSubStep === 'waiting-wallet' &&
      isConnected &&
      state.emailProof &&
      !state.error
    ) {
      startPassportVerification()
    }
  }, [state.step, state.passportSubStep, isConnected, state.emailProof, state.error, startPassportVerification])

  // Auto-trigger mint preparation (shows "Mint NFT" button when ready)
  useEffect(() => {
    if (
      state.step === 'mint' &&
      state.mintSubStep === 'preparing' &&
      state.emailProof &&
      state.passportProof &&
      !state.error
    ) {
      mint()
    }
  }, [state.step, state.mintSubStep, state.emailProof, state.passportProof, state.error, mint])

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
    confirmMint,
  }
}


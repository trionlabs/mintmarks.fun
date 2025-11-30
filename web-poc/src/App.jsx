import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
} from 'viem'
import { QRCodeSVG } from 'qrcode.react'
import { CHAIN, CONTRACTS, MINTMARKS_ABI, ZKPASSPORT_CONFIG, RPC_URL } from './config.js'
import { generateEmailProof, isProofGenerationSupported } from './lib/emailProver.js'
import Gallery from './components/Gallery.jsx'

// Styles
const styles = {
  tabs: {
    display: 'flex',
    gap: '0',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #333',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    padding: '1rem 2rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#e94560',
    borderBottom: '2px solid #e94560',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#e94560',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
  },
  card: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e94560',
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#e94560',
  },
  button: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    width: '100%',
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    background: '#444',
    cursor: 'not-allowed',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  },
  status: {
    padding: '0.5rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  success: {
    background: '#1a4d1a',
    color: '#4ade80',
  },
  error: {
    background: '#4d1a1a',
    color: '#f87171',
  },
  info: {
    background: '#1a3d4d',
    color: '#60a5fa',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    wordBreak: 'break-all',
  },
  stepNumber: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#e94560',
    textAlign: 'center',
    lineHeight: '24px',
    marginRight: '0.5rem',
    fontSize: '0.8rem',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'underline',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  progressFill: {
    height: '100%',
    background: '#e94560',
    transition: 'width 0.3s ease',
  },
  dropZone: {
    border: '2px dashed #e94560',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropZoneActive: {
    background: 'rgba(233, 69, 96, 0.1)',
    borderColor: '#fff',
  },
}

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('mint') // 'mint' | 'gallery'

  // Verification mode: 'email' (email only) or 'passport' (email + passport)
  const [verificationMode, setVerificationMode] = useState('email')

  // Wallet state
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)

  // Email proof state
  const [emailProof, setEmailProof] = useState(null)
  const [emailPublicInputs, setEmailPublicInputs] = useState(null)
  const [emailNullifier, setEmailNullifier] = useState(null)
  const [eventName, setEventName] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [proofProgress, setProofProgress] = useState({ message: '', percent: 0 })
  const [proofError, setProofError] = useState(null)

  // Existing mint state - tracks if user already has mint for this event
  const [existingMint, setExistingMint] = useState(null) // { hasMinted: bool, isVerified: bool, emailUsedByOther: bool }

  // Passport proof state
  const [passportProof, setPassportProof] = useState(null)
  const [passportUrl, setPassportUrl] = useState(null)

  // Minting state
  const [mintStatus, setMintStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)

  // Loading states
  const [loading, setLoading] = useState({
    wallet: false,
    proof: false,
    passport: false,
    mint: false,
  })

  // Drag state
  const [isDragging, setIsDragging] = useState(false)

  // Clients - memoized to avoid recreation on every render
  const publicClient = useMemo(() => createPublicClient({
    chain: CHAIN,
    transport: http(RPC_URL),
  }), [])

  // Step 1: Connect Wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask')
      return
    }

    setLoading((l) => ({ ...l, wallet: true }))
    try {
      const [address] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (parseInt(chainId, 16) !== CHAIN.id) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN.id.toString(16)}` }],
          })
        } catch (e) {
          alert(`Please switch to ${CHAIN.name}`)
          return
        }
      }

      setAccount(address)
      const bal = await publicClient.getBalance({ address })
      setBalance(formatEther(bal))
    } catch (err) {
      console.error('Wallet connection failed:', err)
    } finally {
      setLoading((l) => ({ ...l, wallet: false }))
    }
  }, [publicClient])

  // Step 2: Generate Email Proof
  const handleEmailUpload = useCallback(async (file) => {
    if (!file) return

    // Check browser support
    const support = isProofGenerationSupported()
    if (!support.supported) {
      setProofError(`Browser not supported: ${support.reason}`)
      return
    }

    setLoading((l) => ({ ...l, proof: true }))
    setProofError(null)
    setProofProgress({ message: 'Starting...', percent: 0 })

    try {
      const emailContent = await file.arrayBuffer()

      const result = await generateEmailProof(emailContent, (message, percent) => {
        setProofProgress({ message, percent: percent || 0 })
      })

      // Set proof and public inputs
      setEmailProof(result.proof)
      setEmailPublicInputs(result.publicInputs)

      // Extract nullifier (index 1) - ensure lowercase
      const nullifier = result.publicInputs[1].toLowerCase()
      setEmailNullifier(nullifier)

      // Set event name from metadata
      const eventNameFromProof = result.metadata.eventName
      setEventName(eventNameFromProof)

      // Get tokenId from contract (uses keccak256)
      const tokenIdBigInt = BigInt(await publicClient.readContract({
        address: CONTRACTS.mintmarks,
        abi: MINTMARKS_ABI,
        functionName: 'getTokenId',
        args: [eventNameFromProof],
      }))
      setTokenId(tokenIdBigInt.toString())

      // Check if this email nullifier is already used
      const emailNullifierFromProof = result.publicInputs[1]
      try {
        const isNullifierUsed = await publicClient.readContract({
          address: CONTRACTS.mintmarks,
          abi: MINTMARKS_ABI,
          functionName: 'emailNullifierUsed',
          args: [emailNullifierFromProof],
        })

        if (isNullifierUsed) {
          // Email already used - check if this user has the mint
          if (account) {
            const hasMinted = await publicClient.readContract({
              address: CONTRACTS.mintmarks,
              abi: MINTMARKS_ABI,
              functionName: 'hasMinted',
              args: [account, tokenIdBigInt],
            })

            if (hasMinted) {
              // This user has the mint - check if verified
              const isVerified = await publicClient.readContract({
                address: CONTRACTS.mintmarks,
                abi: MINTMARKS_ABI,
                functionName: 'getVerificationStatus',
                args: [account, tokenIdBigInt],
              })
              setExistingMint({ hasMinted: true, isVerified, emailUsedByOther: false })
            } else {
              // Email used but user doesn't have mint - could be different event or different user
              // Check if user has balance of this token (more reliable)
              const balance = await publicClient.readContract({
                address: CONTRACTS.mintmarks,
                abi: MINTMARKS_ABI,
                functionName: 'balanceOf',
                args: [account, tokenIdBigInt],
              })

              if (balance > 0n) {
                // User has the token - treat as existing mint
                const isVerified = await publicClient.readContract({
                  address: CONTRACTS.mintmarks,
                  abi: MINTMARKS_ABI,
                  functionName: 'getVerificationStatus',
                  args: [account, tokenIdBigInt],
                })
                setExistingMint({ hasMinted: true, isVerified, emailUsedByOther: false })
              } else {
                // Email used by someone else
                setExistingMint({ hasMinted: false, isVerified: false, emailUsedByOther: true })
              }
            }
          } else {
            // Not connected - just show email is used
            setExistingMint({ hasMinted: false, isVerified: false, emailUsedByOther: true })
          }
        } else {
          // Email not used yet - fresh mint
          setExistingMint(null)
        }
      } catch (e) {
        console.error('Failed to check email/mint status:', e)
        setExistingMint(null)
      }

      // Clear passport proof since it's bound to the email nullifier
      // User must re-verify passport for new email
      setPassportProof(null)
      setPassportUrl(null)

      setProofProgress({ message: 'Proof ready!', percent: 100 })
    } catch (err) {
      console.error('Failed to generate proof:', err)
      setProofError(err.message || 'Failed to generate proof')
      setProofProgress({ message: '', percent: 0 })
    } finally {
      setLoading((l) => ({ ...l, proof: false }))
    }
  }, [account, publicClient])

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file) handleEmailUpload(file)
  }, [handleEmailUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.eml') || file.type === 'message/rfc822')) {
      handleEmailUpload(file)
    } else {
      setProofError('Please upload an .eml file')
    }
  }, [handleEmailUpload])

  // Re-check existing mint status when account changes (wallet connected/switched)
  const recheckExistingMint = useCallback(async () => {
    if (!emailPublicInputs || !tokenId || !account) return

    const emailNullifierFromProof = emailPublicInputs[1]
    const tokenIdBigInt = BigInt(tokenId)

    try {
      const isNullifierUsed = await publicClient.readContract({
        address: CONTRACTS.mintmarks,
        abi: MINTMARKS_ABI,
        functionName: 'emailNullifierUsed',
        args: [emailNullifierFromProof],
      })

      if (isNullifierUsed) {
        const hasMinted = await publicClient.readContract({
          address: CONTRACTS.mintmarks,
          abi: MINTMARKS_ABI,
          functionName: 'hasMinted',
          args: [account, tokenIdBigInt],
        })

        if (hasMinted) {
          const isVerified = await publicClient.readContract({
            address: CONTRACTS.mintmarks,
            abi: MINTMARKS_ABI,
            functionName: 'getVerificationStatus',
            args: [account, tokenIdBigInt],
          })
          setExistingMint({ hasMinted: true, isVerified, emailUsedByOther: false })
        } else {
          const balance = await publicClient.readContract({
            address: CONTRACTS.mintmarks,
            abi: MINTMARKS_ABI,
            functionName: 'balanceOf',
            args: [account, tokenIdBigInt],
          })

          if (balance > 0n) {
            const isVerified = await publicClient.readContract({
              address: CONTRACTS.mintmarks,
              abi: MINTMARKS_ABI,
              functionName: 'getVerificationStatus',
              args: [account, tokenIdBigInt],
            })
            setExistingMint({ hasMinted: true, isVerified, emailUsedByOther: false })
          } else {
            setExistingMint({ hasMinted: false, isVerified: false, emailUsedByOther: true })
          }
        }
      } else {
        setExistingMint(null)
      }
    } catch (e) {
      console.error('Failed to recheck mint status:', e)
    }
  }, [account, emailPublicInputs, tokenId, publicClient])

  // Re-check mint status when account changes (e.g., wallet connected after uploading email)
  useEffect(() => {
    if (account && emailPublicInputs && tokenId) {
      recheckExistingMint()
    }
  }, [account, emailPublicInputs, tokenId, recheckExistingMint])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Step 3: Start ZKPassport Verification (optional - for passport-verified mode)
  // Requires email proof first to get tokenId for event-specific scope
  const startPassportVerification = useCallback(async () => {
    if (!account) {
      alert('Please connect wallet first')
      return
    }
    if (!tokenId) {
      alert('Please upload email first to determine the event')
      return
    }

    setLoading((l) => ({ ...l, passport: true }))
    try {
      const { ZKPassport } = await import('@zkpassport/sdk')
      const zkPassport = new ZKPassport(ZKPASSPORT_CONFIG.domain)

      const queryBuilder = await zkPassport.request({
        name: 'Mintmarks',
        logo: 'https://mintmarks.fun/logo.png',
        purpose: `Verify your identity to mint "${eventName}" attendance NFT`,
        scope: ZKPASSPORT_CONFIG.scope,
        mode: 'compressed-evm',
        devMode: ZKPASSPORT_CONFIG.devMode,
      })

      // No longer binding email nullifier - passport can be reused across emails
      const { url, onProofGenerated, onResult } = queryBuilder
        .gte('age', 18) // Required for valid proof structure
        .bind('user_address', account)
        .bind('chain', 'ethereum_sepolia')
        .done()

      setPassportUrl(url)

      onProofGenerated((proof) => {
        const verifierParams = zkPassport.getSolidityVerifierParameters({
          proof,
          scope: ZKPASSPORT_CONFIG.scope,
          devMode: ZKPASSPORT_CONFIG.devMode,
        })
        setPassportProof(verifierParams)
      })

      onResult(({ verified }) => {
        if (!verified) {
          console.error('Passport verification failed')
          setPassportProof(null)
        }
        setLoading((l) => ({ ...l, passport: false }))
      })
    } catch (err) {
      console.error('Passport verification failed:', err)
      setLoading((l) => ({ ...l, passport: false }))
    }
  }, [account, tokenId, eventName])

  // Upgrade existing email-only mint to passport-verified
  const upgrade = useCallback(async () => {
    if (!passportProof || !account || !tokenId) {
      alert('Missing passport proof, wallet, or token ID')
      return
    }

    setLoading((l) => ({ ...l, mint: true }))
    setMintStatus('Preparing upgrade transaction...')

    try {
      const tokenIdBigInt = BigInt(tokenId)

      // Simulate first
      setMintStatus('Simulating upgrade...')
      try {
        await publicClient.simulateContract({
          address: CONTRACTS.mintmarks,
          abi: MINTMARKS_ABI,
          functionName: 'upgradeToVerified',
          args: [tokenIdBigInt, passportProof],
          account,
        })
      } catch (simError) {
        console.error('Simulation failed:', simError)
        const revertReason = simError.cause?.reason ||
          simError.cause?.message ||
          simError.shortMessage ||
          simError.message
        setMintStatus(`Simulation failed: ${revertReason}`)
        return
      }

      const walletClient = createWalletClient({
        account,
        chain: CHAIN,
        transport: custom(window.ethereum),
      })

      setMintStatus('Sending upgrade transaction...')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.mintmarks,
        abi: MINTMARKS_ABI,
        functionName: 'upgradeToVerified',
        args: [tokenIdBigInt, passportProof],
      })

      setTxHash(hash)
      setMintStatus('Waiting for confirmation...')

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        setMintStatus('Upgraded to passport-verified successfully!')
        // Update existing mint state
        setExistingMint({ hasMinted: true, isVerified: true, emailUsedByOther: false })
      } else {
        setMintStatus('Transaction failed')
      }
    } catch (err) {
      console.error('Upgrade failed:', err)
      const reason = err.cause?.reason || err.shortMessage || err.message
      setMintStatus(`Error: ${reason}`)
    } finally {
      setLoading((l) => ({ ...l, mint: false }))
    }
  }, [passportProof, account, tokenId, publicClient])

  // Step 4: Mint - supports both email-only and passport-verified modes
  const mint = useCallback(async () => {
    // For email-only mode, only need email proof
    // For passport mode, need both email and passport proofs
    const needsPassport = verificationMode === 'passport'

    if (!emailProof || !emailPublicInputs || !account) {
      alert('Missing email proof or wallet connection')
      return
    }

    if (needsPassport && !passportProof) {
      alert('Missing passport proof for passport-verified mode')
      return
    }

    setLoading((l) => ({ ...l, mint: true }))
    setMintStatus('Preparing transaction...')

    try {
      const emailNullifierFromProof = emailPublicInputs[1]

      // Pre-check: is this email nullifier already used?
      setMintStatus('Checking eligibility...')
      const isNullifierUsed = await publicClient.readContract({
        address: CONTRACTS.mintmarks,
        abi: MINTMARKS_ABI,
        functionName: 'emailNullifierUsed',
        args: [emailNullifierFromProof],
      })

      if (isNullifierUsed) {
        setMintStatus('Error: This email has already been used to mint')
        console.error('Email nullifier already used:', emailNullifierFromProof)
        return
      }

      // Choose function based on mode
      const functionName = needsPassport ? 'mintWithPassport' : 'mint'
      const args = needsPassport
        ? [emailProof, emailPublicInputs, passportProof]
        : [emailProof, emailPublicInputs]

      setMintStatus('Simulating transaction...')
      try {
        await publicClient.simulateContract({
          address: CONTRACTS.mintmarks,
          abi: MINTMARKS_ABI,
          functionName,
          args,
          account,
        })
      } catch (simError) {
        console.error('Simulation failed:', simError)
        const revertReason = simError.cause?.reason ||
          simError.cause?.message ||
          simError.shortMessage ||
          simError.message
        setMintStatus(`Simulation failed: ${revertReason}`)
        return
      }

      const walletClient = createWalletClient({
        account,
        chain: CHAIN,
        transport: custom(window.ethereum),
      })

      setMintStatus('Sending transaction...')
      const hash = await walletClient.writeContract({
        address: CONTRACTS.mintmarks,
        abi: MINTMARKS_ABI,
        functionName,
        args,
      })

      setTxHash(hash)
      setMintStatus('Waiting for confirmation...')

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        const modeLabel = needsPassport ? '(passport verified)' : '(email only)'
        setMintStatus(`Minted successfully! ${modeLabel}`)
      } else {
        setMintStatus('Transaction failed')
      }
    } catch (err) {
      console.error('Mint failed:', err)
      const reason = err.cause?.reason || err.shortMessage || err.message
      setMintStatus(`Error: ${reason}`)
    } finally {
      setLoading((l) => ({ ...l, mint: false }))
    }
  }, [emailProof, emailPublicInputs, passportProof, account, publicClient, verificationMode])

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Mintmarks</h1>
        <p style={styles.subtitle}>
          Soulbound Proof of Attendance with Email + Passport Verification
        </p>
        <p style={styles.subtitle}>Network: {CHAIN.name}</p>
      </header>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'mint' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('mint')}
        >
          Mint
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'gallery' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
      </div>

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <Gallery account={account} />
      )}

      {/* Mint Tab */}
      {activeTab === 'mint' && (
        <>
          {/* Step 1: Wallet */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <span style={styles.stepNumber}>1</span>
          Connect Wallet
        </h2>
        {account ? (
          <div>
            <p style={styles.mono}>{account}</p>
            <p style={{ marginTop: '0.5rem' }}>Balance: {balance} ETH</p>
            <div style={{ ...styles.status, ...styles.success }}>Connected</div>
          </div>
        ) : (
          <button
            style={{
              ...styles.button,
              ...(loading.wallet ? styles.buttonDisabled : {}),
            }}
            onClick={connectWallet}
            disabled={loading.wallet}
          >
            {loading.wallet ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        )}
      </div>

      {/* Step 2: Email Proof */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <span style={styles.stepNumber}>2</span>
          Generate Email Proof
        </h2>
        <p style={{ marginBottom: '1rem', color: '#888', fontSize: '0.85rem' }}>
          Upload your Luma confirmation email (.eml file)
        </p>

        {!emailProof ? (
          <>
            <div
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneActive : {}),
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('email-input').click()}
            >
              <input
                id="email-input"
                type="file"
                accept=".eml,message/rfc822"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              {loading.proof ? (
                <div>
                  <p style={{ color: '#e94560', marginBottom: '0.5rem' }}>
                    {proofProgress.message}
                  </p>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${proofProgress.percent}%`,
                      }}
                    />
                  </div>
                  <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    This may take 30-60 seconds...
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ color: '#e94560', marginBottom: '0.5rem' }}>
                    Drop .eml file here or click to upload
                  </p>
                  <p style={{ color: '#666', fontSize: '0.75rem' }}>
                    Export from Gmail: Open email → More (⋮) → Download message
                  </p>
                </>
              )}
            </div>

            {proofError && (
              <div style={{ ...styles.status, ...styles.error }}>
                {proofError}
              </div>
            )}
          </>
        ) : (
          <div style={{ ...styles.status, ...styles.success }}>
            <p>Proof generated!</p>
            <p>Event: {eventName}</p>
            <p style={styles.mono}>Nullifier: {emailNullifier?.slice(0, 18)}...</p>
          </div>
        )}
      </div>

      {/* Step 3: Verification Mode Selection */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <span style={styles.stepNumber}>3</span>
          Choose Verification Level
        </h2>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            style={{
              ...styles.button,
              flex: 1,
              background: verificationMode === 'email' ? '#e94560' : '#333',
              marginTop: 0,
            }}
            onClick={() => setVerificationMode('email')}
          >
            Email Only
          </button>
          <button
            style={{
              ...styles.button,
              flex: 1,
              background: verificationMode === 'passport' ? '#4ade80' : '#333',
              marginTop: 0,
            }}
            onClick={() => setVerificationMode('passport')}
          >
            + Passport
          </button>
        </div>

        {verificationMode === 'email' ? (
          <div style={{ ...styles.status, ...styles.info }}>
            <p><strong>Email Only Mode</strong></p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Quick mint - proves event attendance only.
              Same person could mint with different emails.
            </p>
          </div>
        ) : (
          <>
            <div style={{ ...styles.status, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', marginBottom: '1rem' }}>
              <p><strong>Passport Verified Mode</strong></p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Proves attendance + unique personhood.
                Same passport can't mint same event twice.
              </p>
            </div>

            {!passportUrl ? (
              <button
                style={{
                  ...styles.button,
                  background: '#4ade80',
                  ...(!account || !tokenId || loading.passport
                    ? styles.buttonDisabled
                    : {}),
                }}
                onClick={startPassportVerification}
                disabled={!account || !tokenId || loading.passport}
              >
                {loading.passport ? 'Starting...' : !tokenId ? 'Upload email first' : 'Start Passport Verification'}
              </button>
            ) : !passportProof ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', color: '#888', fontSize: '0.85rem' }}>
                  Scan with ZKPassport app:
                </p>
                <div style={{
                  background: '#fff',
                  padding: '1rem',
                  borderRadius: '12px',
                  display: 'inline-block',
                }}>
                  <QRCodeSVG
                    value={passportUrl}
                    size={200}
                    level="M"
                    marginSize={0}
                  />
                </div>
                <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.75rem' }}>
                  Or on mobile:{' '}
                  <a
                    href={passportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Open in app
                  </a>
                </p>
                <p style={{ marginTop: '0.5rem', color: '#4ade80', fontSize: '0.85rem' }}>
                  Waiting for proof...
                </p>
              </div>
            ) : (
              <div style={{ ...styles.status, ...styles.success }}>
                Passport proof received!
              </div>
            )}
          </>
        )}
      </div>

      {/* Step 4: Mint */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <span style={styles.stepNumber}>4</span>
          Mint Soulbound NFT
        </h2>

        {/* Handle existing mint case */}
        {existingMint?.emailUsedByOther ? (
          // Email used by someone else
          <div style={{ ...styles.status, ...styles.error }}>
            <p><strong>Email Already Claimed</strong></p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              This email was already used to mint by another address.
              Each email can only be used once.
            </p>
          </div>
        ) : existingMint?.hasMinted ? (
          existingMint.isVerified ? (
            // Already passport verified
            <div style={{ ...styles.status, ...styles.success }}>
              <p><strong>Already Passport Verified!</strong></p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                You already have a passport-verified mint for "{eventName}".
              </p>
              <button
                style={{ ...styles.button, background: '#4ade80', marginTop: '1rem' }}
                onClick={() => setActiveTab('gallery')}
              >
                View in Gallery
              </button>
            </div>
          ) : (
            // Has email-only mint - offer upgrade
            <div>
              <div style={{ ...styles.status, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', marginBottom: '1rem' }}>
                <p><strong>Email-Only Mint Found</strong></p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  You have an email-only mint for "{eventName}".
                  Add passport verification below!
                </p>
              </div>

              {/* Passport verification for upgrade */}
              {!passportUrl ? (
                <button
                  style={{
                    ...styles.button,
                    background: '#4ade80',
                    ...(!account || !tokenId || loading.passport ? styles.buttonDisabled : {}),
                  }}
                  onClick={startPassportVerification}
                  disabled={!account || !tokenId || loading.passport}
                >
                  {loading.passport ? 'Starting...' : 'Verify Passport to Upgrade'}
                </button>
              ) : !passportProof ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: '1rem', color: '#888', fontSize: '0.85rem' }}>
                    Scan with ZKPassport app:
                  </p>
                  <div style={{
                    background: '#fff',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'inline-block',
                  }}>
                    <QRCodeSVG
                      value={passportUrl}
                      size={180}
                      level="M"
                      marginSize={0}
                    />
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#4ade80', fontSize: '0.85rem' }}>
                    Waiting for proof...
                  </p>
                </div>
              ) : (
                <button
                  style={{
                    ...styles.button,
                    background: '#4ade80',
                    ...(loading.mint ? styles.buttonDisabled : {}),
                  }}
                  onClick={upgrade}
                  disabled={loading.mint}
                >
                  {loading.mint ? 'Upgrading...' : `Upgrade "${eventName}" to Passport Verified`}
                </button>
              )}
            </div>
          )
        ) : (
          // Fresh mint
          <>
            {(() => {
              const needsPassport = verificationMode === 'passport'
              const canMint = emailProof && emailPublicInputs &&
                (!needsPassport || passportProof) && !loading.mint

              return (
                <button
                  style={{
                    ...styles.button,
                    background: canMint
                      ? (needsPassport ? '#4ade80' : '#e94560')
                      : '#444',
                    ...(!canMint ? styles.buttonDisabled : {}),
                  }}
                  onClick={mint}
                  disabled={!canMint}
                >
                  {loading.mint
                    ? 'Minting...'
                    : needsPassport
                    ? `Mint "${eventName || 'Event'}" (Verified)`
                    : `Mint "${eventName || 'Event'}" (Email Only)`}
                </button>
              )
            })()}
          </>
        )}

        {mintStatus && (
          <div
            style={{
              ...styles.status,
              ...(mintStatus.includes('success')
                ? styles.success
                : mintStatus.includes('Error') || mintStatus.includes('failed')
                ? styles.error
                : styles.info),
            }}
          >
            {mintStatus}
          </div>
        )}

        {txHash && (
          <div style={{ marginTop: '1rem' }}>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              View on Etherscan
            </a>
          </div>
        )}
      </div>

      {/* Contract Info */}
      <div style={{ ...styles.card, background: '#0d1321' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#888' }}>Contracts (Sepolia)</h3>
        <p style={{ ...styles.mono, fontSize: '0.75rem', color: '#666' }}>
          Mintmarks: {CONTRACTS.mintmarks}
        </p>
        <p style={{ ...styles.mono, fontSize: '0.75rem', color: '#666' }}>
          Email Verifier: {CONTRACTS.emailVerifier}
        </p>
        <p style={{ ...styles.mono, fontSize: '0.75rem', color: '#666' }}>
          ZKPassport: {CONTRACTS.zkPassportVerifier}
        </p>
      </div>
        </>
      )}
    </div>
  )
}

export default App

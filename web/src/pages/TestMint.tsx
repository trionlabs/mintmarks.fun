/**
 * TestMint Page - Test NFT Minting on Base Sepolia
 *
 * This page allows users to:
 * 1. Connect their wallet (CDP or External)
 * 2. Get testnet ETH from faucet
 * 3. Mint a test ERC-1155 NFT (0.00001 ETH fee)
 * 4. Verify wallet functionality
 *
 * NOTE: This page is only available in development mode.
 */

import { useState, useCallback, useEffect } from 'react'
import {
  encodeFunctionData,
  formatEther,
  createPublicClient,
  http,
} from 'viem'
import { baseSepolia } from 'viem/chains'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/contexts/ToastContext'
import { useWallet, ConnectWalletModal } from '@/wallet'
import {
  TEST_MINTMARKS,
  ACTIVE_NETWORK,
  isContractConfigured,
  getTransactionUrl,
} from '@/config/contracts'
import {
  Wallet,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle,
  Coins,
  Rocket,
  Copy,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// Constants
// ============================================

// Viem public client for reading blockchain data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

// Minimum balance required for minting (mint fee + estimated gas)
// 0.00001 ETH mint fee + ~0.0001 ETH gas buffer = ~0.00011 ETH
const MIN_BALANCE_FOR_MINT = 110000000000000n // 0.00011 ETH in wei

// ============================================
// Types
// ============================================

type MintStatus = 'idle' | 'pending' | 'success' | 'error'
type BalanceStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface MintResult {
  transactionHash: string
  tokenId?: number
}

// ============================================
// Component
// ============================================

export function TestMint() {
  // Unified wallet hook (supports CDP + External wallets)
  const {
    isConnected: isWalletConnected,
    address: walletAddress,
    sendTransaction,
    error: walletError,
  } = useWallet()
  const { showToast } = useToast()

  // Mint state
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle')
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // NFT Preview state
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)

  // Balance state
  const [balance, setBalance] = useState<bigint | null>(null)
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>('idle')

  // Derived state: check if balance is sufficient for minting
  const hasEnoughBalance = balance !== null && balance >= MIN_BALANCE_FOR_MINT
  const balanceFormatted = balance !== null ? formatEther(balance) : '0'

  // Check if contract is configured
  const contractConfigured = isContractConfigured(TEST_MINTMARKS.address)

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV

  // Show wrong network error from wallet
  const isWrongNetwork = walletError?.type === 'WRONG_NETWORK'

  // Fetch balance from blockchain
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null)
      setBalanceStatus('idle')
      return
    }

    setBalanceStatus('loading')
    try {
      const balanceWei = await publicClient.getBalance({
        address: walletAddress,
      })
      setBalance(balanceWei)
      setBalanceStatus('loaded')
    } catch {
      // Silently fail - balance status will show error state
      setBalanceStatus('error')
    }
  }, [walletAddress])

  // Fetch balance when address changes or on mount
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Refetch balance periodically (every 30 seconds) when wallet is connected
  useEffect(() => {
    if (!walletAddress) return

    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [walletAddress, fetchBalance])

  // Copy address to clipboard
  const copyAddress = useCallback(async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      showToast('Address copied to clipboard!', 'success')
    } catch {
      showToast('Failed to copy address', 'error')
    }
  }, [walletAddress, showToast])

  // Generate NFT preview image (simple SVG matching contract)
  const generateNftPreview = useCallback((tokenId: number) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea"/>
            <stop offset="100%" style="stop-color:#764ba2"/>
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f093fb"/>
            <stop offset="100%" style="stop-color:#f5576c"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bg)"/>
        <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="url(#accent)" stroke-width="3"/>
        <text x="200" y="80" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="28" font-weight="bold">TEST MINTMARKS</text>
        <line x1="60" y1="110" x2="340" y2="110" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
        <text x="200" y="180" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="48" font-weight="bold">#${tokenId}</text>
        <text x="200" y="240" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="14" opacity="0.8">Base Sepolia Testnet</text>
        <rect x="100" y="280" width="200" height="40" rx="20" fill="rgba(255,255,255,0.1)"/>
        <text x="200" y="305" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="12">Minted Successfully!</text>
        <text x="200" y="370" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="11" opacity="0.6">Wallet Test Successful ✓</text>
      </svg>
    `
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    return URL.createObjectURL(blob)
  }, [])

  // Handle mint using unified wallet
  const handleMint = useCallback(async () => {
    if (!walletAddress) {
      showToast('Please connect your wallet first', 'warning')
      return
    }

    if (!contractConfigured) {
      showToast('Contract not deployed yet. Please deploy first.', 'error')
      return
    }

    // Pre-mint balance check
    if (!hasEnoughBalance) {
      showToast(
        'Insufficient balance. Please get testnet ETH from the faucet first.',
        'warning'
      )
      return
    }

    setMintStatus('pending')
    setError(null)
    setMintResult(null)
    setNftImageUrl(null)

    try {
      // Encode the mint function call using viem
      const data = encodeFunctionData({
        abi: TEST_MINTMARKS.abi,
        functionName: 'mint',
      })

      // Send transaction via unified wallet (works with CDP or External)
      const result = await sendTransaction({
        to: TEST_MINTMARKS.address,
        value: TEST_MINTMARKS.mintFee,
        data,
      })

      // Generate a random token ID for preview (actual ID comes from contract)
      const estimatedTokenId = Math.floor(Date.now() / 1000) % 10000

      setMintStatus('success')
      setMintResult({
        transactionHash: result.hash,
        tokenId: estimatedTokenId,
      })
      setNftImageUrl(generateNftPreview(estimatedTokenId))
      showToast('NFT minted successfully! 🎉', 'success')

      // Refresh balance after successful mint
      fetchBalance()
    } catch (err) {
      setMintStatus('error')

      // Parse error message
      let message = 'Failed to mint NFT'
      if (err instanceof Error) {
        // Check for common errors
        if (
          err.message.includes('insufficient funds') ||
          err.message.includes('InsufficientFunds')
        ) {
          message =
            'Insufficient balance. Please get testnet ETH from the faucet first.'
        } else if (
          err.message.includes('user rejected') ||
          err.message.includes('User rejected')
        ) {
          message = 'Transaction was cancelled.'
        } else if (err.message.includes('network')) {
          message = 'Network error. Please check your connection.'
        } else {
          message = err.message
        }
      }

      setError(message)
      showToast(message, 'error')
    }
  }, [
    walletAddress,
    contractConfigured,
    hasEnoughBalance,
    sendTransaction,
    showToast,
    generateNftPreview,
    fetchBalance,
  ])

  // Reset state
  const handleReset = useCallback(() => {
    setMintStatus('idle')
    setMintResult(null)
    setError(null)
    setNftImageUrl(null)
  }, [])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (nftImageUrl) {
        URL.revokeObjectURL(nftImageUrl)
      }
    }
  }, [nftImageUrl])

  // Production guard
  if (!isDevelopment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Development Only</AlertTitle>
          <AlertDescription>
            This page is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 mb-2">
          <AlertTriangle className="h-3 w-3" />
          Development Only
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: 'var(--page-text-primary)' }}
        >
          Test NFT Minting
        </h1>
        <p style={{ color: 'var(--page-text-secondary)' }}>
          Verify your wallet is working on Base Sepolia
        </p>
      </div>

      {/* Contract Warning */}
      {!contractConfigured && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Not Configured</AlertTitle>
          <AlertDescription>
            Please deploy the contract and set{' '}
            <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
              VITE_TEST_MINTMARKS_ADDRESS
            </code>{' '}
            in your .env file.
          </AlertDescription>
        </Alert>
      )}

      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription>
            Please switch to {ACTIVE_NETWORK.name} to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Connect Wallet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{
                background: isWalletConnected
                  ? 'var(--Controls-Selected)'
                  : 'var(--Controls-Idle)',
                color: isWalletConnected
                  ? 'white'
                  : 'var(--page-text-secondary)',
              }}
            >
              {isWalletConnected ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                '1'
              )}
            </span>
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect with email (CDP) or browser wallet (MetaMask, Rabby)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isWalletConnected && walletAddress ? (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--glass-bg-primary)' }}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  <span
                    className="font-mono text-sm"
                    style={{ color: 'var(--page-text-primary)' }}
                  >
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Wallet connected on {ACTIVE_NETWORK.name}
              </p>
            </div>
          ) : (
            <ConnectWalletModal
              trigger={
                <Button className="w-full gap-2">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Step 2: Get Testnet ETH */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{
                background: hasEnoughBalance
                  ? 'var(--Controls-Selected)'
                  : 'var(--Controls-Idle)',
                color: hasEnoughBalance
                  ? 'white'
                  : 'var(--page-text-secondary)',
              }}
            >
              {hasEnoughBalance ? <CheckCircle className="h-4 w-4" /> : '2'}
            </span>
            Get Testnet ETH
          </CardTitle>
          <CardDescription>
            You need Base Sepolia ETH to pay for gas + mint fee (
            {TEST_MINTMARKS.mintFeeEth} ETH)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          {isWalletConnected && walletAddress && (
            <div
              className={`p-4 rounded-lg ${
                hasEnoughBalance
                  ? 'bg-green-500/10 dark:bg-green-500/10'
                  : 'bg-red-500/10 dark:bg-red-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      hasEnoughBalance
                        ? 'bg-green-500/20 dark:bg-green-500/20'
                        : 'bg-red-500/20 dark:bg-red-500/20'
                    }`}
                  >
                    <Coins
                      className={`h-5 w-5 ${hasEnoughBalance ? 'text-green-500' : 'text-red-500'}`}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--page-text-secondary)' }}
                    >
                      Your Balance
                    </p>
                    <p
                      className="font-mono font-bold text-lg"
                      style={{ color: 'var(--page-text-primary)' }}
                    >
                      {balanceStatus === 'loading' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : balanceStatus === 'error' ? (
                        'Error fetching'
                      ) : (
                        `${parseFloat(balanceFormatted).toFixed(6)} ETH`
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchBalance}
                  disabled={balanceStatus === 'loading'}
                  title="Refresh balance"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${balanceStatus === 'loading' ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>

              {/* Balance status message */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {hasEnoughBalance ? (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Sufficient balance for minting
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Need at least ~0.00011 ETH (mint fee + gas)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Faucet Section */}
          {(!hasEnoughBalance || !isWalletConnected) && (
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--glass-bg-secondary)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Coins className="h-8 w-8 text-yellow-500" />
                <div>
                  <p
                    className="font-medium"
                    style={{ color: 'var(--page-text-primary)' }}
                  >
                    Coinbase Faucet
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--page-text-secondary)' }}
                  >
                    Get free testnet ETH (requires Coinbase account)
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(ACTIVE_NETWORK.faucet, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Open Faucet
              </Button>
            </div>
          )}

          {walletAddress && !hasEnoughBalance && (
            <div
              className="text-sm"
              style={{ color: 'var(--page-text-muted)' }}
            >
              <p className="mb-1">Your wallet address (paste in faucet):</p>
              <code
                className="block p-2 rounded text-xs break-all cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'var(--glass-bg-primary)' }}
                onClick={copyAddress}
                title="Click to copy"
              >
                {walletAddress}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Mint Test NFT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{
                background:
                  mintStatus === 'success'
                    ? 'var(--Controls-Selected)'
                    : 'var(--Controls-Idle)',
                color:
                  mintStatus === 'success'
                    ? 'white'
                    : 'var(--page-text-secondary)',
              }}
            >
              {mintStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                '3'
              )}
            </span>
            Mint Test NFT
          </CardTitle>
          <CardDescription>
            Pay {TEST_MINTMARKS.mintFeeEth} ETH to mint a test ERC-1155 NFT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Idle State */}
          {mintStatus === 'idle' && (
            <>
              <div
                className="p-4 rounded-lg text-center"
                style={{ background: 'var(--glass-bg-secondary)' }}
              >
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                <p
                  className="font-medium mb-1"
                  style={{ color: 'var(--page-text-primary)' }}
                >
                  Test Mintmarks NFT
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  An on-chain SVG NFT to verify your wallet
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: 'var(--page-text-muted)' }}
                >
                  Cost: {TEST_MINTMARKS.mintFeeEth} ETH + gas (~$0.01 total)
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleMint}
                disabled={
                  !isWalletConnected ||
                  !contractConfigured ||
                  !hasEnoughBalance ||
                  isWrongNetwork
                }
              >
                <Rocket className="h-4 w-4" />
                {isWrongNetwork
                  ? 'Wrong Network'
                  : !hasEnoughBalance && isWalletConnected
                    ? 'Insufficient Balance'
                    : 'Mint Test NFT'}
              </Button>

              {/* Balance status hint */}
              {isWalletConnected && !hasEnoughBalance && !isWrongNetwork && (
                <p className="text-xs text-center text-red-500">
                  Get testnet ETH from the faucet above to enable minting
                </p>
              )}
              {isWalletConnected && hasEnoughBalance && !isWrongNetwork && (
                <p className="text-xs text-center text-green-500">
                  Ready to mint! Click the button above.
                </p>
              )}
            </>
          )}

          {/* Pending State */}
          {mintStatus === 'pending' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <div className="text-center">
                <p
                  className="font-medium"
                  style={{ color: 'var(--page-text-primary)' }}
                >
                  Minting your NFT...
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {mintStatus === 'success' && mintResult && (
            <div className="space-y-4">
              {/* NFT Preview */}
              {nftImageUrl && (
                <div className="flex justify-center">
                  <div
                    className="w-48 h-48 rounded-xl overflow-hidden shadow-lg"
                    style={{ border: '2px solid var(--Controls-Selected)' }}
                  >
                    <img
                      src={nftImageUrl}
                      alt="Minted NFT Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg text-center bg-green-500/10 dark:bg-green-500/10">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium text-green-600 dark:text-green-400">
                  NFT Minted Successfully! 🎉
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Your wallet is working correctly on Base Sepolia
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    window.open(
                      getTransactionUrl(mintResult.transactionHash),
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  View on BaseScan
                </Button>

                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={handleReset}
                >
                  <ArrowRight className="h-4 w-4" />
                  Mint Another
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {mintStatus === 'error' && error && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Mint Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              {/* Show faucet link if insufficient balance */}
              {error.includes('Insufficient') && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    window.open(ACTIVE_NETWORK.faucet, '_blank')
                  }
                >
                  <Coins className="h-4 w-4" />
                  Get Testnet ETH
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <div
        className="text-center text-sm space-y-1"
        style={{ color: 'var(--page-text-muted)' }}
      >
        <p className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          {ACTIVE_NETWORK.name} • Chain ID: {ACTIVE_NETWORK.chainId}
        </p>
        {contractConfigured && (
          <p>
            Contract:{' '}
            <a
              href={`${ACTIVE_NETWORK.blockExplorer}/address/${TEST_MINTMARKS.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              {TEST_MINTMARKS.address.slice(0, 6)}...
              {TEST_MINTMARKS.address.slice(-4)}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

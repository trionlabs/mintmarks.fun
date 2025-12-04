/**
 * @fileoverview Test Center - Comprehensive Testing Page
 * 
 * Two-panel layout for testing:
 * 1. LEFT: Wallet Connection Tests (modal dismiss, state management, mutual exclusion)
 * 2. RIGHT: NFT Minting Tests (test mint operations)
 * 
 * Includes:
 * - Test scenarios with expected outcomes
 * - Edge case documentation
 * - Real-time state display
 * - Console logging hints
 * 
 * USAGE: Navigate to /test-center (dev only)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { SignInModal } from '@coinbase/cdp-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'
import { useIsSignedIn } from '@coinbase/cdp-hooks'
import {
  encodeFunctionData,
  formatEther,
  createPublicClient,
  http,
} from 'viem'
import { baseSepolia } from 'viem/chains'
import { useWallet } from '@/wallet'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { 
  getAuthStateSummary, 
  setCdpActive, 
  clearCdpActive,
  clearAllCdpState,
  clearWagmiState,
} from '@/wallet/utils/walletAuthState'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wallet,
  Mail,
  Database,
  Zap,
  Sparkles,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronDown,
  Play,
  Square,
  RotateCcw,
  TestTube,
  Coins,
  Unlink,
  Send,
  Globe,
  ArrowRightLeft,
} from 'lucide-react'
import {
  TEST_MINTMARKS,
  ACTIVE_NETWORK,
  NETWORKS,
  isContractConfigured,
  getTransactionUrl,
} from '@/config/contracts'

// ============================================
// Constants
// ============================================

const IS_DEV = import.meta.env.DEV

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

const MIN_BALANCE_FOR_MINT = 110000000000000n // 0.00011 ETH

// ============================================
// Types
// ============================================

interface AuthStateSummary {
  cdpMarkerSet: boolean
  cdpSdkState: boolean
  cdpActive: boolean
  shouldReconnect: boolean
  cdpKeys: string[]
  wagmiKeys: string[]
}

interface TestScenario {
  id: string
  title: string
  description: string
  steps: string[]
  expected: string
  category: 'connection' | 'dismiss' | 'exclusion' | 'persistence' | 'network' | 'error' | 'minting'
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
}

type MintStatus = 'idle' | 'pending' | 'success' | 'error'

// ============================================
// Test Scenarios Data
// ============================================

const TEST_SCENARIOS: TestScenario[] = [
  // Connection Tests
  {
    id: 'cdp-connect',
    title: 'CDP Email Connection',
    description: 'Connect using email (CDP wallet)',
    steps: [
      'Click "Connect Email" button',
      'Complete email verification in modal',
      'Wait for connection'
    ],
    expected: 'CDP marker set, wallet connected, source = "cdp"',
    category: 'connection',
    status: 'pending',
  },
  {
    id: 'external-connect',
    title: 'External Wallet Connection',
    description: 'Connect using browser wallet (MetaMask/Rabby)',
    steps: [
      'Click "Connect External" button',
      'Approve connection in wallet popup',
      'Wait for connection'
    ],
    expected: 'Wallet connected, source = "external", wagmi state saved',
    category: 'connection',
    status: 'pending',
  },
  
  // Modal Dismiss Tests
  {
    id: 'cdp-dismiss',
    title: '🐛 CDP Modal Dismiss',
    description: 'User closes CDP modal without completing auth',
    steps: [
      'Click "Connect Email" button',
      'Wait for CDP modal to appear',
      'Click outside modal OR press ESC to close',
      'Try clicking "Connect Email" again'
    ],
    expected: 'Modal closes, state resets, button is clickable again',
    category: 'dismiss',
    status: 'pending',
  },
  {
    id: 'external-dismiss',
    title: '🐛 External Modal Dismiss',
    description: 'User closes RainbowKit modal without connecting',
    steps: [
      'Click "Connect External" button',
      'Wait for RainbowKit modal',
      'Close modal without selecting wallet',
      'Try clicking "Connect External" again'
    ],
    expected: 'Modal closes, state resets, button is clickable again',
    category: 'dismiss',
    status: 'pending',
  },
  
  // Mutual Exclusion Tests
  {
    id: 'mutual-exclusion-cdp-priority',
    title: 'Mutual Exclusion (CDP Priority)',
    description: 'When both wallets connect, CDP takes priority',
    steps: [
      'Connect external wallet first',
      'Then connect CDP (email)',
      'Observe console logs'
    ],
    expected: 'External auto-disconnects, CDP becomes active, console shows "[useWalletMutualExclusion]"',
    category: 'exclusion',
    status: 'pending',
  },
  
  // Persistence Tests
  {
    id: 'cdp-reconnect-prevention',
    title: 'CDP Prevents External Auto-Reconnect',
    description: 'When CDP is active, external wallet should NOT auto-reconnect on page reload',
    steps: [
      'Connect CDP (email)',
      'Verify CDP marker is set',
      'Reload page',
      'Check "Should Wagmi Reconnect" status'
    ],
    expected: '"Should Wagmi Reconnect" = false, external stays disconnected',
    category: 'persistence',
    status: 'pending',
  },
  {
    id: 'external-reconnect',
    title: 'External Wallet Auto-Reconnect',
    description: 'External wallet should reconnect on page reload (when CDP not active)',
    steps: [
      'Clear all state',
      'Connect external wallet',
      'Reload page'
    ],
    expected: 'External wallet auto-reconnects, "Should Wagmi Reconnect" = true',
    category: 'persistence',
    status: 'pending',
  },
  {
    id: 'external-disconnect-persist',
    title: 'External Disconnect Persistence (shimDisconnect)',
    description: 'Explicit disconnect should persist across reloads',
    steps: [
      'Connect external wallet',
      'Disconnect external wallet',
      'Reload page'
    ],
    expected: 'External stays disconnected (shimDisconnect working)',
    category: 'persistence',
    status: 'pending',
  },
  {
    id: 'cdp-logout-enables-external',
    title: 'CDP Logout → External Available',
    description: 'After CDP logout, external wallet can reconnect',
    steps: [
      'Connect CDP (email)',
      'Logout from CDP',
      'Verify CDP marker cleared',
      'Reload page',
      'Connect external wallet'
    ],
    expected: 'CDP marker cleared, external can connect normally',
    category: 'persistence',
    status: 'pending',
  },
  
  // Network Tests (NEW)
  {
    id: 'network-switch-external',
    title: '🌐 Network Switch (External)',
    description: 'Switch network with external wallet',
    steps: [
      'Connect external wallet on Base Sepolia',
      'Use network dropdown OR wallet to switch to Ethereum Sepolia',
      'Check UI updates (icon, name, balance)'
    ],
    expected: 'Network icon changes, balance refreshes for new network',
    category: 'network',
    status: 'pending',
  },
  {
    id: 'network-cdp-multichain',
    title: '🌐 CDP Multichain Display',
    description: 'CDP wallet shows correct network selection',
    steps: [
      'Connect CDP wallet',
      'Open network dropdown in header',
      'Select different network (Ethereum Sepolia)',
      'Check balance updates'
    ],
    expected: 'Balance fetches from selected network, "Multichain" badge visible',
    category: 'network',
    status: 'pending',
  },
  {
    id: 'network-tx-auto-switch',
    title: '🌐 Transaction Auto-Switch',
    description: 'External wallet auto-switches for transaction',
    steps: [
      'Connect external wallet on Base Sepolia',
      'Send test TX to Ethereum Sepolia',
      'Approve chain switch in wallet'
    ],
    expected: 'Wallet prompts chain switch, TX succeeds on target chain',
    category: 'network',
    status: 'pending',
  },
  
  // Error Recovery Tests (NEW)
  {
    id: 'error-401-recovery',
    title: '⚠️ 401 Error Recovery',
    description: 'Stale CDP session auto-clears on 401',
    steps: [
      'Connect CDP wallet',
      'Wait for session to expire (or manually clear CDP cookies)',
      'Trigger CDP API call',
      'Check console for "[NetworkInterceptor]"'
    ],
    expected: 'CDP state auto-cleared, user can re-auth or use external',
    category: 'error',
    status: 'pending',
  },
  {
    id: 'error-wrong-otp',
    title: '⚠️ Wrong OTP Entry',
    description: 'Wrong OTP should NOT clear state',
    steps: [
      'Click "Connect Email"',
      'Enter wrong OTP code',
      'Check console - should NOT see "clearing stale state"',
      'Enter correct OTP'
    ],
    expected: 'State preserved, user can retry with correct OTP',
    category: 'error',
    status: 'pending',
  },
  
  // Minting Tests
  {
    id: 'mint-with-cdp',
    title: 'Mint NFT with CDP Wallet',
    description: 'Test minting with email wallet',
    steps: [
      'Connect CDP wallet',
      'Ensure sufficient balance (use faucet)',
      'Click "Mint Test NFT"',
      'Approve transaction'
    ],
    expected: 'Transaction succeeds, NFT minted, balance decreases',
    category: 'minting',
    status: 'pending',
  },
  {
    id: 'mint-with-external',
    title: 'Mint NFT with External Wallet',
    description: 'Test minting with browser wallet',
    steps: [
      'Connect external wallet',
      'Ensure sufficient balance',
      'Click "Mint Test NFT"',
      'Approve in wallet popup'
    ],
    expected: 'Transaction succeeds, NFT minted',
    category: 'minting',
    status: 'pending',
  },
  {
    id: 'mint-insufficient-balance',
    title: 'Mint with Insufficient Balance',
    description: 'Error handling for low balance',
    steps: [
      'Connect wallet with < 0.00011 ETH',
      'Try to mint'
    ],
    expected: 'Clear error message about insufficient funds',
    category: 'minting',
    status: 'pending',
  },
]

// ============================================
// Helper Components
// ============================================

function StatusBadge({ value, label, size = 'md' }: { value: boolean; label: string; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'p-1.5 text-xs' : 'p-2 text-sm'
  return (
    <div className={`flex items-center gap-2 rounded-lg bg-card border border-border ${sizeClasses}`}>
      {value ? (
        <CheckCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-green-500' : 'w-4 h-4 text-green-500'} />
      ) : (
        <XCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-red-500' : 'w-4 h-4 text-red-500'} />
      )}
      <span>{label}</span>
    </div>
  )
}

function TestScenarioCard({ 
  scenario, 
  isExpanded, 
  onToggle,
  onRun,
  onPass,
  onFail,
  onReset,
}: { 
  scenario: TestScenario
  isExpanded: boolean
  onToggle: () => void
  onRun: () => void
  onPass: () => void
  onFail: () => void
  onReset: () => void
}) {
  const statusColors = {
    pending: 'border-border',
    running: 'border-yellow-500 bg-yellow-500/5',
    passed: 'border-green-500 bg-green-500/5',
    failed: 'border-red-500 bg-red-500/5',
    skipped: 'border-muted',
  }
  
  const statusIcons = {
    pending: <Square className="w-4 h-4 text-muted-foreground" />,
    running: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
    passed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    skipped: <Square className="w-4 h-4 text-muted-foreground" />,
  }

  return (
    <div className={`rounded-lg border ${statusColors[scenario.status]} transition-all`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
      >
        {statusIcons[scenario.status]}
        <span className="flex-1 font-medium text-sm">{scenario.title}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground pt-2">{scenario.description}</p>
          
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Steps:</h4>
            <ol className="list-decimal list-inside text-xs space-y-0.5">
              {scenario.steps.map((step, i) => (
                <li key={i} className="text-muted-foreground">{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="p-2 bg-green-500/10 rounded text-xs">
            <span className="font-semibold text-green-600">Expected: </span>
            <span className="text-green-700">{scenario.expected}</span>
          </div>
          
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onRun} className="h-7 text-xs">
              <Play className="w-3 h-3 mr-1" /> Run
            </Button>
            <Button size="sm" variant="outline" onClick={onPass} className="h-7 text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" /> Pass
            </Button>
            <Button size="sm" variant="outline" onClick={onFail} className="h-7 text-xs text-red-600">
              <XCircle className="w-3 h-3 mr-1" /> Fail
            </Button>
            <Button size="sm" variant="ghost" onClick={onReset} className="h-7 text-xs">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function TestCenter() {
  // Block in production
  if (!IS_DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Development Only</h1>
          <p className="text-muted-foreground">This page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  // ============================================
  // State
  // ============================================
  
  const [authState, setAuthState] = useState<AuthStateSummary | null>(null)
  const [scenarios, setScenarios] = useState<TestScenario[]>(TEST_SCENARIOS)
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  
  // CDP Modal State
  const [showCdpModal, setShowCdpModal] = useState(false)
  const [isConnectingCdp, setIsConnectingCdp] = useState(false)
  const [isConnectingExternal, setIsConnectingExternal] = useState(false)
  const cdpButtonRef = useRef<HTMLButtonElement>(null)
  
  // Minting State
  const [balance, setBalance] = useState<bigint | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle')
  const [mintError, setMintError] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  
  // Test Transaction State
  const [testTxStatus, setTestTxStatus] = useState<MintStatus>('idle')
  const [testTxError, setTestTxError] = useState<string | null>(null)
  const [lastTestTxHash, setLastTestTxHash] = useState<string | null>(null)
  const [lastTestTxNetwork, setLastTestTxNetwork] = useState<string | null>(null)
  
  // Hooks
  const wallet = useWallet()
  const { isAuthenticated: isGmailConnected, logout: logoutGmail } = useAuth()
  const { openConnectModal } = useConnectModal()
  const { isConnected: isExternalConnected } = useAccount()
  const { disconnect: disconnectExternal } = useDisconnect()
  const { isSignedIn: isCdpConnected } = useIsSignedIn()
  const { showToast } = useToast()
  
  const contractConfigured = isContractConfigured(TEST_MINTMARKS.address)
  const hasEnoughBalance = balance !== null && balance >= MIN_BALANCE_FOR_MINT

  // ============================================
  // Effects
  // ============================================
  
  // Refresh auth state
  const refreshState = useCallback(() => {
    setAuthState(getAuthStateSummary())
  }, [])

  useEffect(() => {
    // Small delay to ensure localStorage is updated by useCdpAuthMarkerSync
    const timer = setTimeout(() => {
      refreshState()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [wallet.isConnected, wallet.source, wallet.address, wallet.chainId, isCdpConnected, isExternalConnected, isGmailConnected, refreshState])
  
  // Auto-click CDP button
  useEffect(() => {
    if (showCdpModal && cdpButtonRef.current) {
      const timer = setTimeout(() => {
        cdpButtonRef.current?.click()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showCdpModal])
  
  // Reset connecting state when wallet connects
  useEffect(() => {
    if (wallet.isConnected) {
      setIsConnectingCdp(false)
      setIsConnectingExternal(false)
      setShowCdpModal(false)
    }
  }, [wallet.isConnected])
  
  // Modal dismiss detection - click outside
  useEffect(() => {
    if (!showCdpModal) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[role="dialog"]') === null) {
        setTimeout(() => {
          if (!isCdpConnected) {
            setShowCdpModal(false)
            setIsConnectingCdp(false)
            console.log('[TestCenter] CDP modal dismissed without auth')
          }
        }, 100)
      }
    }
    
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 200)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showCdpModal, isCdpConnected])
  
  // Fallback timeout for modal dismiss
  useEffect(() => {
    if (!showCdpModal || !isConnectingCdp) return
    
    const fallbackTimer = setTimeout(() => {
      if (!isCdpConnected) {
        setShowCdpModal(false)
        setIsConnectingCdp(false)
        console.log('[TestCenter] CDP connection timeout')
      }
    }, 30000)
    
    return () => clearTimeout(fallbackTimer)
  }, [showCdpModal, isConnectingCdp, isCdpConnected])
  
  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!wallet.address) {
      setBalance(null)
      return
    }
    
    setBalanceLoading(true)
    try {
      const bal = await publicClient.getBalance({ address: wallet.address as `0x${string}` })
      setBalance(bal)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [wallet.address])
  
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // ============================================
  // Handlers
  // ============================================
  
  // Connection handlers
  const handleConnectCdp = () => {
    if (isConnectingCdp || isConnectingExternal) return
    setIsConnectingCdp(true)
    setShowCdpModal(true)
    console.log('[TestCenter] Starting CDP connection')
  }
  
  const handleConnectExternal = () => {
    if (isConnectingCdp || isConnectingExternal) return
    setIsConnectingExternal(true)
    setTimeout(() => {
      openConnectModal?.()
      // Reset after modal opens (RainbowKit handles the rest)
      setTimeout(() => setIsConnectingExternal(false), 500)
    }, 100)
    console.log('[TestCenter] Starting external connection')
  }
  
  const handleCdpComplete = () => {
    setShowCdpModal(false)
    setIsConnectingCdp(false)
    refreshState()
    console.log('[TestCenter] CDP auth completed')
  }
  
  const handleDisconnect = async () => {
    if (wallet.source === 'cdp') {
      await logoutGmail()
    } else {
      disconnectExternal()
    }
    refreshState()
  }
  
  // State manipulation handlers
  const handleSetCdpMarker = () => {
    setCdpActive()
    refreshState()
  }
  
  const handleClearCdpMarker = () => {
    clearCdpActive()
    refreshState()
  }
  
  const handleClearAllCdp = () => {
    clearAllCdpState()
    refreshState()
  }
  
  const handleClearWagmi = () => {
    clearWagmiState()
    refreshState()
  }
  
  const handleClearAll = () => {
    clearAllCdpState()
    clearWagmiState()
    refreshState()
  }
  
  // Minting handler
  const handleMint = async () => {
    if (!wallet.address || !contractConfigured || !hasEnoughBalance) return
    
    setMintStatus('pending')
    setMintError(null)
    setLastTxHash(null)
    
    try {
      const data = encodeFunctionData({
        abi: TEST_MINTMARKS.abi,
        functionName: 'mint',
      })
      
      const result = await wallet.sendTransaction({
        to: TEST_MINTMARKS.address,
        value: TEST_MINTMARKS.mintFee,
        data,
      })
      
      setMintStatus('success')
      setLastTxHash(result.hash)
      showToast('NFT minted successfully! 🎉', 'success')
      fetchBalance()
    } catch (err) {
      setMintStatus('error')
      let message = 'Failed to mint NFT'
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          message = 'Insufficient balance. Get testnet ETH first.'
        } else if (err.message.includes('user rejected')) {
          message = 'Transaction cancelled.'
        } else {
          message = err.message.slice(0, 100)
        }
      }
      setMintError(message)
      showToast(message, 'error')
    }
  }
  
  // Test Transaction handlers
  const handleTestTransaction = async (targetChainId: number) => {
    if (!wallet.address) return
    
    const network = Object.values(NETWORKS).find(n => n.chainId === targetChainId)
    if (!network) return
    
    setTestTxStatus('pending')
    setTestTxError(null)
    setLastTestTxHash(null)
    setLastTestTxNetwork(network.name)
    
    try {
      // Send 0 ETH to self - minimal test transaction
      const result = await wallet.sendTransaction({
        to: wallet.address,
        value: 0n,
        chainId: targetChainId,
      })
      
      setTestTxStatus('success')
      setLastTestTxHash(result.hash)
      showToast(`Test TX sent on ${network.name}! 🎉`, 'success')
      fetchBalance()
    } catch (err) {
      setTestTxStatus('error')
      let message = 'Transaction failed'
      if (err instanceof Error) {
        if (err.message.includes('user rejected') || err.message.includes('User rejected')) {
          message = 'Transaction cancelled by user'
        } else if (err.message.includes('insufficient funds')) {
          message = 'Insufficient balance for gas'
        } else if (err.message.includes('switch')) {
          message = 'Failed to switch network'
        } else {
          message = err.message.slice(0, 100)
        }
      }
      setTestTxError(message)
      showToast(message, 'error')
    }
  }
  
  // Send TX on current chain (auto-detect)
  const handleTestTransactionCurrentChain = async () => {
    if (!wallet.chainId) {
      showToast('No chain detected', 'error')
      return
    }
    await handleTestTransaction(wallet.chainId)
  }
  
  // Scenario handlers
  const updateScenarioStatus = (id: string, status: TestScenario['status']) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }
  
  const resetAllScenarios = () => {
    setScenarios(prev => prev.map(s => ({ ...s, status: 'pending' as const })))
  }
  
  // Filter scenarios
  const filteredScenarios = activeCategory === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.category === activeCategory)
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'connection', label: 'Connection' },
    { id: 'dismiss', label: '🐛 Dismiss' },
    { id: 'exclusion', label: 'Exclusion' },
    { id: 'persistence', label: 'Persistence' },
    { id: 'network', label: '🌐 Network' },
    { id: 'error', label: '⚠️ Error' },
    { id: 'minting', label: 'Minting' },
  ]
  
  const passedCount = scenarios.filter(s => s.status === 'passed').length
  const failedCount = scenarios.filter(s => s.status === 'failed').length

  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TestTube className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Test Center</h1>
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full">DEV ONLY</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-500 font-medium">{passedCount} passed</span>
              <span className="text-muted-foreground mx-2">/</span>
              <span className="text-red-500 font-medium">{failedCount} failed</span>
              <span className="text-muted-foreground mx-2">/</span>
              <span className="text-muted-foreground">{scenarios.length} total</span>
            </div>
            <Button variant="outline" size="sm" onClick={refreshState}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={resetAllScenarios}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset All
            </Button>
            <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Two Panels */}
      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-2 gap-4">
        
        {/* LEFT PANEL: Wallet Connection Tests */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Connection Status
            </h2>
            
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatusBadge value={wallet.isConnected} label="Wallet Connected" size="sm" />
              <StatusBadge value={wallet.source === 'cdp'} label="CDP Active" size="sm" />
              <StatusBadge value={wallet.source === 'external'} label="External Active" size="sm" />
              <StatusBadge value={isGmailConnected} label="Gmail Connected" size="sm" />
            </div>
            
            {/* Wallet Details */}
            {wallet.isConnected && (
              <div className="p-2 bg-muted rounded-lg text-xs mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Source:</span> <span className="font-mono">{wallet.source}</span></div>
                  <div><span className="text-muted-foreground">Chain:</span> <span className="font-mono">{wallet.chainId}</span></div>
                </div>
                <div className="mt-1 truncate">
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="font-mono">{wallet.address}</span>
                </div>
              </div>
            )}
            
            {/* Connection Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                onClick={handleConnectCdp}
                disabled={isCdpConnected || isConnectingCdp || isConnectingExternal}
              >
                {isConnectingCdp ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-1" />
                )}
                Connect Email
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleConnectExternal}
                disabled={isExternalConnected || isConnectingCdp || isConnectingExternal}
              >
                {isConnectingExternal ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 mr-1" />
                )}
                Connect External
              </Button>
              {wallet.isConnected && (
                <Button size="sm" variant="destructive" onClick={handleDisconnect}>
                  <Unlink className="w-4 h-4 mr-1" /> Disconnect
                </Button>
              )}
            </div>
          </div>
          
          {/* Auth State */}
          {authState && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Auth State (localStorage)
              </h2>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatusBadge value={authState.cdpMarkerSet} label={`CDP Marker`} size="sm" />
                <StatusBadge value={authState.cdpSdkState} label="CDP SDK State" size="sm" />
                <StatusBadge value={authState.cdpActive} label="CDP Active" size="sm" />
                <StatusBadge value={authState.shouldReconnect} label="Should Reconnect" size="sm" />
              </div>
              
              {/* Keys Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">CDP Keys:</span>{' '}
                  <span className="font-mono">{authState.cdpKeys.length}</span>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Wagmi Keys:</span>{' '}
                  <span className="font-mono">{authState.wagmiKeys.length}</span>
                </div>
              </div>
              
              {/* State Actions */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleSetCdpMarker} className="h-7 text-xs">
                    Set CDP Marker
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearCdpMarker} className="h-7 text-xs">
                    Clear CDP Marker
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearAllCdp} className="h-7 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> Clear CDP State
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearWagmi} className="h-7 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> Clear Wagmi
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearAll} className="h-7 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Test Scenarios */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Test Scenarios
              </h2>
            </div>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Scenario List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredScenarios.map(scenario => (
                <TestScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isExpanded={expandedScenario === scenario.id}
                  onToggle={() => setExpandedScenario(
                    expandedScenario === scenario.id ? null : scenario.id
                  )}
                  onRun={() => updateScenarioStatus(scenario.id, 'running')}
                  onPass={() => updateScenarioStatus(scenario.id, 'passed')}
                  onFail={() => updateScenarioStatus(scenario.id, 'failed')}
                  onReset={() => updateScenarioStatus(scenario.id, 'pending')}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* RIGHT PANEL: Transaction & Minting Tests */}
        <div className="space-y-4">
          
          {/* Test Transactions Section */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Test Transactions
            </h2>
            
            <p className="text-xs text-muted-foreground mb-4">
              Send 0 ETH to yourself to test wallet transaction flow. Tests chain switching for external wallets.
            </p>
            
            {/* Current Wallet Info */}
            {wallet.isConnected && (
              <div className="p-3 bg-muted rounded-lg mb-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Wallet Type:</span>{' '}
                    <span className={`font-medium ${wallet.source === 'cdp' ? 'text-purple-500' : 'text-blue-500'}`}>
                      {wallet.source === 'cdp' ? 'CDP (Multichain)' : 'External'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Chain:</span>{' '}
                    <span className="font-mono">
                      {wallet.chainId ? Object.values(NETWORKS).find(n => n.chainId === wallet.chainId)?.name || wallet.chainId : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Transaction Buttons */}
            <div className="space-y-3">
              {/* Current Chain Button */}
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Send on Current Chain</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Sends TX on whatever chain the wallet is currently connected to.
                </p>
                <Button
                  size="sm"
                  onClick={handleTestTransactionCurrentChain}
                  disabled={!wallet.isConnected || testTxStatus === 'pending'}
                  className="w-full"
                >
                  {testTxStatus === 'pending' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send 0 ETH (Current Chain)</>
                  )}
                </Button>
              </div>
              
              {/* Specific Chain Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Base Sepolia */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">B</span>
                    </div>
                    <span className="text-xs font-medium">Base Sepolia</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestTransaction(NETWORKS.baseSepolia.chainId)}
                    disabled={!wallet.isConnected || testTxStatus === 'pending'}
                    className="w-full h-8 text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" /> Send TX
                  </Button>
                </div>
                
                {/* Ethereum Sepolia */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">E</span>
                    </div>
                    <span className="text-xs font-medium">Ethereum Sepolia</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestTransaction(NETWORKS.ethereumSepolia.chainId)}
                    disabled={!wallet.isConnected || testTxStatus === 'pending'}
                    className="w-full h-8 text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" /> Send TX
                  </Button>
                </div>
              </div>
              
              {/* Info about chain switching */}
              <div className="p-2 bg-blue-500/10 rounded text-xs">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-blue-600">Chain Behavior:</span>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• <strong>CDP:</strong> Multichain native - TX sent directly to target chain</li>
                      <li>• <strong>External:</strong> Will prompt to switch chain if different</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Test TX Result */}
            {testTxStatus === 'success' && lastTestTxHash && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">TX Sent on {lastTestTxNetwork}!</span>
                </div>
                <a
                  href={`${(Object.values(NETWORKS).find(n => n.name === lastTestTxNetwork) ?? ACTIVE_NETWORK).blockExplorer}/tx/${lastTestTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {testTxStatus === 'error' && testTxError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">{testTxError}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* NFT Minting Section */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              NFT Minting Test
            </h2>
            
            {/* Contract Info */}
            <div className="p-3 bg-muted rounded-lg mb-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Contract:</span>{' '}
                  <span className={contractConfigured ? 'text-green-500' : 'text-red-500'}>
                    {contractConfigured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Network:</span>{' '}
                  <span className="font-mono">{ACTIVE_NETWORK.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mint Fee:</span>{' '}
                  <span className="font-mono">{TEST_MINTMARKS.mintFeeEth} ETH</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Balance:</span>{' '}
                  <span className="font-mono">0.00011 ETH</span>
                </div>
              </div>
              {contractConfigured && (
                <div className="mt-2 truncate">
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="font-mono">{TEST_MINTMARKS.address}</span>
                </div>
              )}
            </div>
            
            {/* Balance & Faucet */}
            <div className="p-3 bg-muted rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Balance</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchBalance}
                  disabled={!wallet.address || balanceLoading}
                  className="h-6 text-xs"
                >
                  {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </Button>
              </div>
              
              {wallet.address ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold font-mono">
                    {balance !== null ? `${formatEther(balance).slice(0, 10)} ETH` : '---'}
                  </div>
                  {balance !== null && (
                    <StatusBadge 
                      value={hasEnoughBalance} 
                      label={hasEnoughBalance ? 'Sufficient for mint' : 'Insufficient - need faucet'} 
                      size="sm" 
                    />
                  )}
                  <a
                    href="https://www.alchemy.com/faucets/base-sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Get testnet ETH from faucet <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Connect wallet to see balance</p>
              )}
            </div>
            
            {/* Mint Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleMint}
              disabled={!wallet.isConnected || !contractConfigured || !hasEnoughBalance || mintStatus === 'pending'}
            >
              {mintStatus === 'pending' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Mint Test NFT ({TEST_MINTMARKS.mintFeeEth} ETH)
                </>
              )}
            </Button>
            
            {/* Mint Result */}
            {mintStatus === 'success' && lastTxHash && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Mint Successful!</span>
                </div>
                <a
                  href={getTransactionUrl(lastTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            
            {mintStatus === 'error' && mintError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">{mintError}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Console Hint */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-600 text-sm">Console Logging</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Open DevTools (F12) → Console. Look for:
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li><code className="bg-muted px-1 rounded">[TestCenter]</code> - This page</li>
                  <li><code className="bg-muted px-1 rounded">[useWalletMutualExclusion]</code> - Wallet exclusion</li>
                  <li><code className="bg-muted px-1 rounded">[useCdpAuthMarkerSync]</code> - CDP marker sync</li>
                  <li><code className="bg-muted px-1 rounded">[NetworkInterceptor]</code> - 401 detection</li>
                  <li><code className="bg-muted px-1 rounded">[main]</code> - Reconnect decision</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Edge Cases Documentation */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Edge Cases to Test
            </h2>
            
            <div className="space-y-3 text-xs">
              <div className="p-2 bg-orange-500/10 rounded">
                <h4 className="font-semibold text-orange-600 mb-1">🐛 Modal Dismiss Bug</h4>
                <p className="text-muted-foreground">
                  Click email/external → Close modal without completing → Buttons should be re-enabled
                </p>
              </div>
              
              <div className="p-2 bg-blue-500/10 rounded">
                <h4 className="font-semibold text-blue-600 mb-1">🔄 Race Condition</h4>
                <p className="text-muted-foreground">
                  Rapidly switch between CDP and external connection attempts
                </p>
              </div>
              
              <div className="p-2 bg-purple-500/10 rounded">
                <h4 className="font-semibold text-purple-600 mb-1">💾 State Persistence</h4>
                <p className="text-muted-foreground">
                  Connect → Reload → Check if correct wallet reconnects (or stays disconnected)
                </p>
              </div>
              
              <div className="p-2 bg-green-500/10 rounded">
                <h4 className="font-semibold text-green-600 mb-1">⚡ 401 Error Handling</h4>
                <p className="text-muted-foreground">
                  Stale CDP session should auto-clear on API 401 errors
                </p>
              </div>
              
              <div className="p-2 bg-red-500/10 rounded">
                <h4 className="font-semibold text-red-600 mb-1">💸 Insufficient Balance</h4>
                <p className="text-muted-foreground">
                  Try minting with {"<"} 0.00011 ETH - should show clear error
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CDP SignInModal - rendered outside main content */}
      {showCdpModal && (
        <SignInModal onSuccess={handleCdpComplete}>
          <button 
            ref={cdpButtonRef}
            className="sr-only"
            aria-hidden="true"
          />
        </SignInModal>
      )}
    </div>
  )
}

export default TestCenter


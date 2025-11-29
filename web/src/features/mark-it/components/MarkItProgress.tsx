/**
 * Mark It Progress Indicator
 * 
 * Vertical stepper with clickable steps for navigation.
 * Shows status: connected, verified, etc.
 */

import { Wallet, Fingerprint, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarkItStep } from '../types'

interface MarkItProgressProps {
  currentStep: MarkItStep
  progress: number
  walletAddress?: string | null
  isWalletConnected?: boolean
  isPassportVerified?: boolean
  onStepClick?: (step: MarkItStep) => void
}

const STEPS: { 
  id: MarkItStep
  number: number
  label: string
  icon: React.ElementType
}[] = [
  { id: 'wallet', number: 1, label: 'Connect', icon: Wallet },
  { id: 'passport', number: 2, label: 'ZKPassport', icon: Fingerprint },
  { id: 'mint', number: 3, label: 'Mint', icon: Sparkles },
]

export function MarkItProgress({ 
  currentStep, 
  walletAddress,
  isWalletConnected = false,
  isPassportVerified = false,
  onStepClick,
}: MarkItProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
  
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  // Determine which steps are accessible (sequential logic)
  const canAccessStep = (stepId: MarkItStep): boolean => {
    if (stepId === 'wallet') {
      return true // Always accessible
    }
    if (stepId === 'passport') {
      return isWalletConnected // Only if wallet is connected
    }
    if (stepId === 'mint') {
      return isPassportVerified // Only if passport is verified
    }
    return false
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full overflow-x-auto no-scrollbar">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isPast = index < currentIndex
        const Icon = step.icon
        
        const isCompleted = (step.id === 'wallet' && isWalletConnected) || 
                           (step.id === 'passport' && isPassportVerified)
        
        // Step is clickable only if accessible AND (it's the current step OR it's completed)
        const isAccessible = canAccessStep(step.id)
        const isClickable = onStepClick && isAccessible && (isActive || isCompleted || isPast)

        // Special handling for wallet step - show address if connected
        const showWalletAddress = step.id === 'wallet' && isWalletConnected && walletAddress
        const showPassportStatus = step.id === 'passport' && isPassportVerified

        return (
          <div key={step.id} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Step button - minimal design */}
            <button
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap',
                isClickable && 'cursor-pointer hover:opacity-90 active:opacity-80',
                !isClickable && 'cursor-default opacity-60',
                isActive && 'shadow-sm',
              )}
              style={{
                background: isActive 
                  ? 'var(--foreground)' 
                  : isCompleted
                    ? 'var(--status-confirmed-bg)'
                    : 'var(--background)',
                color: isActive 
                  ? 'var(--background)' 
                  : isCompleted
                    ? 'var(--status-confirmed)'
                    : 'var(--page-text-secondary)',
                border: isActive 
                  ? 'none' 
                  : '1px solid var(--border)',
              }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center flex-shrink-0">
                {isCompleted && !isActive ? (
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                ) : (
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </div>
              
              {/* Content - minimal: show address for wallet, label for others */}
              {showWalletAddress ? (
                <span className="font-mono text-[10px] sm:text-xs">
                  {formatAddress(walletAddress!)}
                </span>
              ) : showPassportStatus ? (
                <span className="text-[10px] sm:text-xs opacity-70">verified</span>
              ) : (
                <span className="text-[10px] sm:text-xs">
                  {step.number}. {step.label}
                </span>
              )}
            </button>
            
            {/* Horizontal connector line - thinner */}
            {index < STEPS.length - 1 && (
              <div 
                className="h-[1px] w-2 sm:w-3 transition-colors duration-300 flex-shrink-0"
                style={{ 
                  background: isCompleted || (isPast && index < currentIndex - 1)
                    ? 'var(--status-confirmed)'
                    : 'var(--border)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}


/**
 * Mark It Progress Indicator
 * 
 * Shows the current step in the Mark It flow with visual progress.
 */

import { Wallet, FileCheck, Shield, Sparkles, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarkItStep } from '../types'

interface MarkItProgressProps {
  currentStep: MarkItStep
  progress: number
}

const STEPS: { id: MarkItStep; label: string; icon: React.ElementType }[] = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'email-proof', label: 'Proof', icon: FileCheck },
  { id: 'passport', label: 'Identity', icon: Shield },
  { id: 'mint', label: 'Mint', icon: Sparkles },
]

export function MarkItProgress({ currentStep, progress }: MarkItProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
  const isComplete = currentStep === 'success'

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep
          const isPast = index < currentIndex || isComplete
          const Icon = isPast && !isActive ? CheckCircle : step.icon

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Icon container */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isPast && 'bg-green-500/20',
                  isActive && 'ring-2 ring-offset-2',
                )}
                style={{
                  background: isPast
                    ? 'var(--status-confirmed-bg)'
                    : isActive
                      ? 'var(--Controls-Selected)'
                      : 'var(--Controls-Idle)',
                  color: isPast
                    ? 'var(--status-confirmed)'
                    : isActive
                      ? 'white'
                      : 'var(--page-text-muted)',
                  // Ring color handled via className
                }}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium transition-colors',
                  isActive && 'font-semibold'
                )}
                style={{
                  color: isActive
                    ? 'var(--page-text-primary)'
                    : 'var(--page-text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--Controls-Idle)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: isComplete
              ? 'var(--status-confirmed)'
              : 'var(--Controls-Selected)',
          }}
        />
      </div>

      {/* Progress text */}
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--page-text-muted)' }}>
          {isComplete ? 'Complete!' : `Step ${currentIndex + 1} of 4`}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--page-text-muted)' }}>
          {progress}%
        </span>
      </div>
    </div>
  )
}


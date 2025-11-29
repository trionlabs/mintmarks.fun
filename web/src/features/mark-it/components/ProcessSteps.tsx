/**
 * Process Steps Component
 * 
 * Displays numbered steps for the Mark It flow process.
 */

interface ProcessStep {
  number: number
  label: string
}

interface ProcessStepsProps {
  steps?: ProcessStep[]
  className?: string
}

const DEFAULT_STEPS: ProcessStep[] = [
  { number: 1, label: 'Connect your wallet' },
  { number: 2, label: 'Generate ZK proof of your email (30-60s)' },
  { number: 3, label: 'Verify your identity with ZKPassport' },
  { number: 4, label: 'Mint your soulbound NFT' },
]

export function ProcessSteps({ 
  steps = DEFAULT_STEPS,
  className = '',
}: ProcessStepsProps) {
  return (
    <div
      className={`rounded-lg p-3 sm:p-4 ${className}`}
      style={{ background: 'var(--glass-bg-secondary)' }}
    >
      <div 
        className="flex flex-col"
        style={{ 
          gap: '0.5rem',
        }}
      >
        {steps.map((step) => (
          <div 
            key={`step-${step.number}`}
            className="flex items-center"
            style={{ 
              gap: '0.75rem',
            }}
          >
            <span
              className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
              style={{ 
                background: 'var(--Controls-Selected)', 
                color: 'white',
                width: '1.25rem',
                height: '1.25rem',
                fontSize: '0.625rem',
              }}
            >
              {step.number}
            </span>
            <span 
              style={{ 
                color: 'var(--page-text-primary)',
                fontSize: '0.75rem',
                lineHeight: '1.25rem',
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


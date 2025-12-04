import { motion } from 'framer-motion'
import { Mail, Sparkles, Wallet, CheckCircle, Zap, Shield, Fingerprint } from 'lucide-react'

// Badge style constants - extracted for performance (no re-creation on render)
const BADGE_STYLES = {
  verify: {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success-border)',
    text: 'var(--status-success)'
  },
  zkpassport: {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success-border)',
    text: 'var(--status-success)'
  },
  generate: {
    bg: 'var(--badge-noir-bg)',
    border: 'var(--badge-noir-border)',
    text: 'var(--badge-noir)'
  },
  mint: {
    bg: 'var(--status-info-bg)',
    border: 'var(--status-info-border)',
    text: 'var(--status-info)'
  },
  default: {
    bg: 'var(--glass-bg-secondary)',
    border: 'var(--glass-border)',
    text: 'var(--page-text-muted)'
  }
} as const


interface HowItWorksSectionProps {
  markType: 'standard' | 'unique'
  onMarkTypeChange: (type: 'standard' | 'unique') => void
}

export function HowItWorksSection({ markType, onMarkTypeChange }: HowItWorksSectionProps) {
  // zkPassport step - only shown when markType is 'unique'
  const zkPassportStep = {
    id: 'zkpassport',
    step: '02',
    icon: Shield,
    title: 'Verify Uniqueness',
    description: 'Prove you are a unique human with zkPassport. One Mark per person, preventing spam and ensuring authenticity.',
    tech: ['zkPassport', 'Proof of Personhood'],
    demoContent: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative">
            {/* Passport Card - Minimal */}
            <div className="w-40 h-24 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{
                boxShadow: 'var(--glass-shadow)',
              }}
            >
            {/* Passport Icon + ID */}
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" style={{ color: 'var(--page-icon-primary)' }} />
              <div className="flex-1 h-1.5 bg-[var(--glass-border)] rounded-full" />
            </div>
            
            {/* Fingerprint Icon */}
            <div className="flex items-center justify-center flex-1">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "easeInOut"
                }}
              >
                <Fingerprint className="w-10 h-10" style={{ color: 'var(--page-icon-primary)' }} />
              </motion.div>
            </div>
            
            {/* Scan Line Effect */}
            <motion.div
              animate={{ x: [-44, 44] }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut",
                repeatType: "reverse"
              }}
              className="absolute inset-y-0 w-0.5 opacity-40"
              style={{ 
                background: `linear-gradient(to bottom, transparent, var(--card-badge-verify), transparent)`
              }}
            />
          </div>
          
          {/* Verified Badge - Unique Human */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 1.5, 
              repeat: Infinity, 
              repeatDelay: 2, 
              duration: 0.4, 
              ease: "backOut" 
            }}
            className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border-2"
            style={{ 
              backgroundColor: 'var(--card-badge-verify)', 
              borderColor: 'var(--card-badge-verify-border)'
            }}
          >
            <CheckCircle className="w-6 h-6 text-white" style={{ color: 'white' }} />
          </motion.div>
        </div>
      </div>
    )
  }

  const baseSteps = [
    {
      id: 'verify',
      step: '01',
      icon: Mail,
      title: 'Verify Email',
      description: 'We cryptographically prove you received the email without reading your inbox.',
      tech: ['ZK Email', 'DKIM'],
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Email Card - Minimal */}
            <div className="w-36 h-24 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              {/* Email Icon + Header */}
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" style={{ color: 'var(--page-icon-primary)' }} />
                <div className="flex-1 h-1.5 bg-[var(--glass-border)] rounded-full" />
              </div>
              
              {/* Body Lines */}
              <div className="space-y-1.5">
                <div className="h-1 bg-[var(--glass-border)] rounded-full w-full" />
                <div className="h-1 bg-[var(--glass-border)] rounded-full w-2/3" />
              </div>
              
              {/* Simple Scan Line */}
              <motion.div
                animate={{ y: [-28, 28] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "easeInOut",
                  repeatType: "reverse"
                }}
                className="absolute inset-x-0 h-0.5 opacity-40"
                style={{ 
                  background: `linear-gradient(to right, transparent, var(--card-badge-verify), transparent)`
                }}
              />
            </div>
            
            {/* Verified Badge - Simple */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 1.2, 
                repeat: Infinity, 
                repeatDelay: 2, 
                duration: 0.4, 
                ease: "backOut" 
              }}
              className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2"
              style={{ 
                backgroundColor: 'var(--card-badge-verify)', 
                borderColor: 'var(--card-badge-verify-border)'
              }}
            >
              <CheckCircle className="w-6 h-6 text-white" style={{ color: 'white' }} />
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: 'generate',
      step: markType === 'unique' ? '03' : '02',
      icon: Sparkles,
      title: 'Generate Art',
      description: 'Email metadata transforms into unique, generative artwork powered by AI.',
      tech: ['Gemini AI'],
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Art Generation Card - Minimal */}
            <div className="w-32 h-32 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl flex items-center justify-center overflow-hidden"
              style={{
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              {/* Center Icon - Simple Rotate */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 8, 
                  ease: "linear" 
                }}
              >
                <Sparkles className="w-12 h-12" style={{ color: 'var(--page-icon-primary)' }} />
              </motion.div>
            </div>
            
            {/* AI Badge - Purple in light, white in dark */}
            <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-lg border text-xs font-bold"
              style={{ 
                backgroundColor: 'var(--badge-noir-bg)',
                borderColor: 'var(--badge-noir-border)',
                color: 'var(--badge-noir)'
              }}
            >
              AI
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'mint',
      step: markType === 'unique' ? '04' : '03',
      icon: Wallet,
      title: 'Mint on Base',
      description: 'Store your Mark permanently on Base blockchain. Fast, cheap, and forever.',
      tech: ['Base L2'],
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* NFT Card - Minimal */}
            <div className="w-24 h-32 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl flex items-center justify-center overflow-hidden"
              style={{
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <Sparkles className="w-10 h-10" style={{ color: 'var(--page-icon-primary)' }} />
            </div>
            
            {/* Simple Upload Arrow */}
            <motion.div
              animate={{ 
                y: [0, -50],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut",
                repeatDelay: 0.5
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
            >
              <Zap className="w-6 h-6" style={{ color: 'var(--page-icon-primary)' }} />
            </motion.div>
            
            {/* BASE Badge - Blue */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 1.5, 
                repeat: Infinity, 
                repeatDelay: 1.5, 
                duration: 0.3, 
                ease: "backOut" 
              }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg border text-[10px] font-bold"
              style={{ 
                backgroundColor: 'var(--status-info-bg)',
                borderColor: 'var(--status-info-border)',
                color: 'var(--status-info)'
              }}
            >
              BASE
            </motion.div>
            
            {/* Mint Badge - Simple */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 1.8, 
                repeat: Infinity, 
                repeatDelay: 1.2, 
                duration: 0.3, 
                ease: "backOut" 
              }}
              className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2"
              style={{ 
                backgroundColor: 'var(--card-badge-mint)', 
                borderColor: 'var(--card-badge-mint-border)'
              }}
            >
              <CheckCircle className="w-5 h-5 text-white" style={{ color: 'white' }} />
            </motion.div>
          </div>
        </div>
      )
    }
  ]

  // Conditionally insert zkPassport step if markType is 'unique'
  const steps = markType === 'unique' 
    ? [baseSteps[0], zkPassportStep, baseSteps[1], baseSteps[2]]
    : baseSteps

  const stepCount = steps.length

  return (
    <section id="how-it-works" className="home-section relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
      {/* Section Header - Compact */}
      <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-[0.9] mb-2 sm:mb-3">
              <span style={{ color: 'var(--page-text-primary)' }}>Create Your </span>
              <span 
                className="light:text-[var(--status-success)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
              >Mark</span>
              <span style={{ color: 'var(--page-text-primary)' }}> in {stepCount} Steps</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg max-w-xl leading-relaxed font-light" style={{ color: 'var(--page-text-secondary)' }}>
              Turn your digital footprint into a permanent legacy.
            </p>
          </div>

          {/* Mark Type Toggle - Modern, Minimal, Prominent */}
          <div 
            className="flex items-center gap-1.5 rounded-full p-1 sm:p-1.5 border backdrop-blur-md flex-shrink-0 self-start lg:self-auto"
            style={{
              backgroundColor: 'var(--glass-bg-primary)',
              borderColor: 'var(--glass-border-hover)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <button
              onClick={() => onMarkTypeChange('standard')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 ease-out min-h-[44px]"
              style={{
                backgroundColor: markType === 'standard' 
                  ? 'var(--glass-bg-hover)' 
                  : 'transparent',
                color: markType === 'standard' 
                  ? 'var(--page-text-primary)' 
                  : 'var(--page-text-muted)',
                boxShadow: markType === 'standard' 
                  ? 'var(--glass-shadow-hover)' 
                  : 'none',
                border: markType === 'standard'
                  ? '1px solid var(--glass-border-hover)'
                  : '1px solid transparent',
                backdropFilter: markType === 'standard' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                WebkitBackdropFilter: markType === 'standard' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                transform: markType === 'standard' ? 'scale(1.02)' : 'scale(1)',
                fontWeight: markType === 'standard' ? '600' : '500'
              }}
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Standard</span>
            </button>
            <button
              onClick={() => onMarkTypeChange('unique')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 ease-out min-h-[44px]"
              style={{
                backgroundColor: markType === 'unique' 
                  ? 'var(--glass-bg-hover)' 
                  : 'transparent',
                color: markType === 'unique' 
                  ? 'var(--page-text-primary)' 
                  : 'var(--page-text-muted)',
                boxShadow: markType === 'unique' 
                  ? 'var(--glass-shadow-hover)' 
                  : 'none',
                border: markType === 'unique'
                  ? '1px solid var(--glass-border-hover)'
                  : '1px solid transparent',
                backdropFilter: markType === 'unique' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                WebkitBackdropFilter: markType === 'unique' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                transform: markType === 'unique' ? 'scale(1.02)' : 'scale(1)',
                fontWeight: markType === 'unique' ? '600' : '500'
              }}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Unique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Grid - Responsive columns optimized for MacBook */}
      {/* Mobile: 1 col, Tablet: 2 cols, lg (1024px): 3 cols, xl (1280px+): 4 cols (unique) or 3 cols (standard) */}
      <div className={`grid grid-cols-1 ${markType === 'unique' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-5 sm:gap-6 md:gap-7 lg:gap-8 relative`}>
        {steps.map((step) => (
          <div
            key={step.id}
            className="glass-card-interactive rounded-2xl lg:rounded-3xl overflow-hidden group relative"
          >
            {/* Vertical Split: Top Animation, Bottom Text - Compact */}
            <div className="flex flex-col min-h-[300px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px]">
              
              {/* Top: Animation - Compact */}
              <div className="glass-inset p-4 sm:p-5 md:p-6 lg:p-7 flex items-center justify-center border-b min-h-[120px] sm:min-h-[130px] md:min-h-[140px] lg:min-h-[150px]"
                style={{
                  borderBottomColor: 'var(--glass-border)',
                  borderBottomWidth: '1px',
                }}
              >
                {step.demoContent}
              </div>

              {/* Bottom: Content - Compact */}
              <div className="p-4 sm:p-5 md:p-6 lg:p-7 flex flex-col flex-1">
                {/* Step Badge + Icon */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass-inset flex items-center justify-center">
                    <span className="text-xs font-black" style={{ color: 'var(--page-text-primary)' }}>
                      {step.step}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg glass-inset">
                    <step.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--page-icon-primary)' }} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl lg:text-xl font-bold tracking-tight leading-tight mb-2" style={{ color: 'var(--page-text-primary)' }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--page-text-secondary)' }}>
                  {step.description}
                </p>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {step.tech.map((t) => {
                    const colors = BADGE_STYLES[step.id as keyof typeof BADGE_STYLES] ?? BADGE_STYLES.default
                    
                    return (
                      <div key={t} className="inline-flex items-center px-3 py-1.5 rounded-lg border"
                        style={{ 
                          backgroundColor: colors.bg,
                          borderColor: colors.border
                        }}
                      >
                        <span className="text-xs font-mono font-medium" style={{ color: colors.text }}>
                          {t}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Connecting Arrows - Between Cards (Dynamic based on step count) - Only shown on xl screens with 4 cols */}
        {markType === 'unique' && Array.from({ length: stepCount - 1 }).map((_, index) => {
          // Only show arrows on xl screens where we have 4 columns (25% each)
          const columnPercentage = 25
          return (
            <div key={index} className="hidden xl:block absolute top-1/2 -translate-y-1/2 z-10" style={{ left: `calc(${(index + 1) * columnPercentage}% - 1rem)` }}>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full glass-inset flex items-center justify-center shadow-sm"
              >
                <span className="text-lg font-bold" style={{ color: 'var(--page-text-primary)' }}>→</span>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

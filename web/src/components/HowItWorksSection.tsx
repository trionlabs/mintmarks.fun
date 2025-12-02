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

// Animation variants for optimized rendering
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

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
          <div className="w-44 h-28 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-5 flex flex-col gap-2.5 shadow-sm relative overflow-hidden">
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
            <div className="w-40 h-28 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-5 flex flex-col gap-2.5 shadow-sm relative overflow-hidden">
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
            <div className="w-36 h-36 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-sm flex items-center justify-center overflow-hidden">
              {/* Center Icon - Simple Rotate */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 8, 
                  ease: "linear" 
                }}
              >
                <Sparkles className="w-14 h-14" style={{ color: 'var(--page-icon-primary)' }} />
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
            <div className="w-28 h-36 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-sm flex items-center justify-center overflow-hidden">
              <Sparkles className="w-12 h-12" style={{ color: 'var(--page-icon-primary)' }} />
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
              className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border text-xs font-bold"
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
    <section id="how-it-works" className="relative max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-20 sm:py-32 md:py-40 lg:py-52 xl:py-64">
      {/* Section Header */}
      <div className="mb-12 sm:mb-16 md:mb-20 lg:mb-24 xl:mb-28">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8 mb-6">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.85] mb-4 sm:mb-5 md:mb-6">
              <span style={{ color: 'var(--page-text-primary)' }}>Create Your </span>
              <span 
                className="light:text-[var(--status-success)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
              >Mark</span>
              <span style={{ color: 'var(--page-text-primary)' }}> in {stepCount} Steps</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light" style={{ color: 'var(--page-text-secondary)' }}>
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

      {/* Dynamic Grid - 3 or 4 columns based on mark type */}
      {/* Mobile: 1 col, Tablet (iPad): 2 cols, Desktop: 3 or 4 cols */}
      <div className={`grid grid-cols-1 ${markType === 'unique' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6 sm:gap-7 md:gap-8 lg:gap-10 relative`}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            className="glass-primary rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-lg group relative"
          >
            {/* Vertical Split: Top Animation, Bottom Text */}
            <div className="flex flex-col min-h-[400px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[550px]">
              
              {/* Top: Animation */}
              <div className="glass-inset p-6 sm:p-8 md:p-9 lg:p-12 flex items-center justify-center border-b border-[var(--glass-border)] min-h-[200px] sm:min-h-[220px] md:min-h-[240px] lg:min-h-[280px]">
                {step.demoContent}
              </div>

              {/* Bottom: Content */}
              <div className="p-6 sm:p-7 md:p-8 lg:p-10 flex flex-col">
                {/* Step Badge + Icon */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-xl glass-inset flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-black" style={{ color: 'var(--page-text-primary)' }}>
                      {step.step}
                    </span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-xl glass-inset">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--page-icon-primary)' }} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl md:text-2xl lg:text-2xl font-bold tracking-tight leading-tight mb-3 sm:mb-4" style={{ color: 'var(--page-text-primary)' }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base md:text-[15px] lg:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6" style={{ color: 'var(--page-text-secondary)' }}>
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
          </motion.div>
        ))}

        {/* Connecting Arrows - Between Cards (Dynamic based on step count) - Hidden on tablet, shown on desktop */}
        {Array.from({ length: stepCount - 1 }).map((_, index) => {
          const columnPercentage = markType === 'unique' ? 25 : 33.33
          return (
            <div key={index} className="hidden lg:block absolute top-1/2 -translate-y-1/2 z-10" style={{ left: `calc(${(index + 1) * columnPercentage}% - 1rem)` }}>
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

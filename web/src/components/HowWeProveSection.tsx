import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Shield, Database, CheckCircle, Eye, EyeOff, Fingerprint, Binary, ExternalLink } from 'lucide-react'

// Provider badge style constants - extracted for performance
const PROVIDER_BADGE_STYLES = {
  Google: {
    bg: 'var(--status-success-bg)',
    border: 'var(--status-success-border)',
    text: 'var(--status-success)'
  },
  Noir: {
    bg: 'var(--badge-noir-bg)',
    border: 'var(--badge-noir-border)',
    text: 'var(--badge-noir)'
  },
  zkPassport: {
    bg: 'var(--status-pending-bg)',
    border: 'var(--status-pending-border)',
    text: 'var(--status-pending)'
  },
  Base: {
    bg: 'var(--status-info-bg)',
    border: 'var(--status-info-border)',
    text: 'var(--status-info)'
  }
} as const

const PROVIDER_URLS: Record<string, string | null> = {
  Noir: 'https://noir-lang.org/',
  zkPassport: 'https://zkpassport.id/',
  Base: 'https://www.base.org/',
  Google: null
}

// Dot badge color mapping
const DOT_BADGE_COLORS: Record<string, string> = {
  dkim: 'var(--card-badge-dkim)',
  'zk-proof': 'var(--card-badge-zk-proof)',
  nullifier: 'var(--card-badge-nullifier)',
  blockchain: 'var(--card-badge-blockchain)'
}

// Animation variants for optimized rendering
const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const bottomCTAVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

export function HowWeProveSection() {
  const [activeProof, setActiveProof] = useState(0)

  const proofSteps = [
    {
      id: 'dkim',
      icon: Mail,
      title: 'DKIM Signature',
      subtitle: 'Email Authenticity',
      description: 'Every Gmail has a cryptographic signature from Google servers. This proves the email is real and unmodified.',
      techBadge: 'RSA-2048',
      providerBadge: 'Google',
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="relative"
          >
            <div className="w-44 h-52 bg-[var(--glass-bg)] backdrop-blur-xl rounded-3xl border border-[var(--glass-border)] p-6 flex flex-col gap-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6" style={{ color: 'var(--page-icon-primary)' }} />
                <div className="flex-1 h-2 bg-[var(--glass-border)] rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-1.5 bg-[var(--glass-border)] rounded-full w-full" />
                <div className="h-1.5 bg-[var(--glass-border)] rounded-full w-3/4" />
                <div className="h-1.5 bg-[var(--glass-border)] rounded-full w-1/2" />
              </div>
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  duration: 0.6,
                  ease: "backOut"
                }}
              className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2"
              style={{ 
                backgroundColor: 'var(--card-badge-dkim)',
                borderColor: 'var(--card-badge-dkim-border)'
              }}
            >
              <CheckCircle className="w-8 h-8 text-white" style={{ color: 'white' }} />
            </motion.div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 'zk-proof',
      icon: Shield,
      title: 'Zero-Knowledge Proof',
      subtitle: 'Privacy Guaranteed',
      description: 'We generate a mathematical proof that you own the email without revealing its content. Your inbox stays private.',
      techBadge: 'UltraHonk',
      providerBadge: 'Noir',
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative flex items-center gap-8">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <div className="w-24 h-28 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-4 flex flex-col gap-2">
                <Eye className="w-6 h-6 mx-auto" style={{ color: 'var(--page-text-secondary)' }} />
                <div className="space-y-2">
                  <div className="h-1 bg-[var(--glass-border)] rounded-full w-full" />
                  <div className="h-1 bg-[var(--glass-border)] rounded-full w-2/3" />
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-3xl font-bold"
              style={{ color: 'var(--page-text-muted)' }}
            >
              →
            </motion.div>

            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <div className="w-24 h-28 bg-[var(--glass-bg-hover)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border-hover)] p-4 flex flex-col items-center justify-center shadow-xl">
                <Lock className="w-8 h-8 mb-2" style={{ color: 'var(--page-text-primary)' }} />
                <Binary className="w-6 h-6" style={{ color: 'var(--page-text-muted)' }} />
              </div>
            </motion.div>
          </div>

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2"
          >
            <EyeOff className="w-8 h-8" style={{ color: 'var(--page-text-muted)' }} />
          </motion.div>
        </div>
      )
    },
    {
      id: 'nullifier',
      icon: Fingerprint,
      title: 'Unique Nullifier',
      subtitle: 'One Email, One Mark',
      description: 'Each email generates a unique hash. This prevents the same email from being minted twice while keeping your identity private.',
      techBadge: 'Keccak-256',
      providerBadge: 'zkPassport',
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div className="relative">
            <div className="w-40 h-40 rounded-3xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Fingerprint className="w-24 h-24" style={{ color: 'var(--page-icon-primary)' }} />
              </motion.div>

              <motion.div
                animate={{ y: [-40, 40, -40] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-x-0 h-1 shadow-lg opacity-40"
                style={{ 
                  background: `linear-gradient(to right, transparent, var(--card-badge-nullifier), transparent)`,
                  boxShadow: `0 0 10px var(--card-badge-nullifier)`
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1,
                repeat: Infinity,
                repeatDelay: 1,
                duration: 0.5
              }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 backdrop-blur-xl rounded-xl border shadow-lg"
              style={{ 
                backgroundColor: 'var(--glass-bg-hover)',
                borderColor: 'var(--glass-border-hover)'
              }}
            >
              <span className="text-sm font-mono" style={{ color: 'var(--page-text-primary)' }}>
                0x7f3a...c92d
              </span>
            </motion.div>
          </motion.div>
        </div>
      )
    },
    {
      id: 'blockchain',
      icon: Database,
      title: 'On-Chain Storage',
      subtitle: 'Forever Verified',
      description: 'The proof is stored on Base blockchain. Anyone can verify your Mark is authentic, but your email content stays secret.',
      techBadge: 'ERC-1155',
      providerBadge: 'Base',
      demoContent: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <motion.div
              animate={{
                y: [0, -50, -50],
                opacity: [1, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
            >
              <div className="w-16 h-16 bg-[var(--glass-bg-hover)] backdrop-blur-xl rounded-xl border border-[var(--glass-border-hover)] flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8" style={{ color: 'var(--page-icon-primary)' }} />
              </div>
            </motion.div>

            <div className="w-44 h-44 rounded-3xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] p-5 flex flex-col gap-3 shadow-2xl">
              <div className="flex items-center gap-3 mb-1">
                <Database className="w-6 h-6" style={{ color: 'var(--page-icon-primary)' }} />
                <div className="text-sm font-bold" style={{ color: 'var(--page-text-primary)' }}>
                  BASE NETWORK
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--glass-bg-hover)',
                      borderColor: 'var(--glass-border-hover)'
                    }}
                  />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 1.5,
                repeat: Infinity,
                repeatDelay: 1.5,
                duration: 0.5,
                ease: "backOut"
              }}
              className="absolute -top-4 -right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2"
              style={{ 
                backgroundColor: 'var(--card-badge-blockchain)',
                borderColor: 'var(--card-badge-blockchain-border)'
              }}
            >
              <CheckCircle className="w-7 h-7 text-white" style={{ color: 'white' }} />
            </motion.div>
          </div>
        </div>
      )
    }
  ]

  return (
    <section className="relative max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-20 sm:py-32 md:py-40 lg:py-52 xl:py-64">
      {/* Section Header - Minimal & Tight */}
      <div className="mb-10 sm:mb-12 md:mb-16 lg:mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.85] mb-3 sm:mb-4">
          <span style={{ color: 'var(--page-text-primary)' }}>How We </span>
          <span 
            className="light:text-[var(--status-success)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
          >Prove</span>
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light" style={{ color: 'var(--page-text-secondary)' }}>
          Your privacy is guaranteed by mathematics, not trust.
        </p>
      </div>

      {/* Unified Container with Tabs */}
      <div className="glass-primary rounded-2xl sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden">
        {/* Tab Navigation - Ultra Minimal */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6 lg:py-8 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {proofSteps.map((proof, index) => (
              <button
                key={proof.id}
                onClick={() => setActiveProof(index)}
                className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex-shrink-0 transition-all duration-300 border min-h-[44px]"
                style={{
                  backgroundColor: activeProof === index ? 'var(--glass-bg-hover)' : 'transparent',
                  borderColor: activeProof === index ? 'var(--glass-border-hover)' : 'transparent',
                }}
              >
                <proof.icon 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  style={{ 
                    color: activeProof === index ? 'var(--page-text-primary)' : 'var(--page-text-muted)' 
                  }} 
                />
                <span 
                  className="text-xs sm:text-sm lg:text-base font-semibold tracking-tight whitespace-nowrap"
                  style={{ 
                    color: activeProof === index ? 'var(--page-text-primary)' : 'var(--page-text-muted)' 
                  }}
                >
                  {proof.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProof}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            {/* Left: Content */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-9 lg:p-14 xl:p-16 flex flex-col min-h-[400px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[600px]">
              
              {/* Header */}
              <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                  <div className="p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl glass-inset">
                    {(() => {
                      const IconComponent = proofSteps[activeProof].icon
                      return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: 'var(--page-icon-primary)' }} />
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1] mb-1 sm:mb-1.5" style={{ color: 'var(--page-text-primary)' }}>
                      {proofSteps[activeProof].title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base font-medium uppercase tracking-wider" style={{ color: 'var(--page-text-muted)' }}>
                      {proofSteps[activeProof].subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-auto" style={{ color: 'var(--page-text-secondary)' }}>
                {proofSteps[activeProof].description}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mt-8 sm:mt-10 md:mt-12 lg:mt-16 xl:mt-20 pt-6 sm:pt-8 md:pt-10 lg:pt-12 border-t border-[var(--glass-border)]">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--glass-bg-secondary)',
                    borderColor: 'var(--glass-border)'
                  }}
                >
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--page-text-secondary)' }}>
                    {proofSteps[activeProof].techBadge}
                  </span>
                </div>

                {(() => {
                  const badge = proofSteps[activeProof].providerBadge
                  const url = PROVIDER_URLS[badge] ?? null
                  const styles = PROVIDER_BADGE_STYLES[badge as keyof typeof PROVIDER_BADGE_STYLES] ?? {
                    bg: 'var(--glass-bg-hover)',
                    border: 'var(--glass-border-hover)',
                    text: 'var(--page-text-primary)'
                  }
                  
                  const badgeContent = (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200"
                      style={{ 
                        backgroundColor: styles.bg,
                        borderColor: styles.border,
                        ...(url && { cursor: 'pointer' })
                      }}
                    >
                      <span className="text-xs font-bold tracking-wider uppercase" style={{ color: styles.text }}>
                        {badge}
                      </span>
                      {url && (
                        <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: styles.text, opacity: 0.7 }} />
                      )}
                    </div>
                  )

                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      {badgeContent}
                    </a>
                  ) : badgeContent
                })()}
              </div>
            </div>

            {/* Right: Animation */}
            <div className="lg:col-span-5 flex items-center justify-center glass-inset p-6 sm:p-8 md:p-9 lg:p-14 min-h-[300px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[600px] border-t lg:border-t-0 lg:border-l border-[var(--glass-border)]">
              {proofSteps[activeProof].demoContent}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots - Improved touch targets */}
        <div className="flex items-center justify-center gap-1 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 lg:py-8 border-t border-[var(--glass-border)]">
          {proofSteps.map((proof, idx) => (
            <button
              key={idx}
              onClick={() => setActiveProof(idx)}
              aria-label={`Go to step ${idx + 1}: ${proof.title}`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-300"
            >
              <span
                className="transition-all duration-300 rounded-full"
                style={{
                  width: idx === activeProof ? '32px' : '12px',
                  height: '12px',
                  backgroundColor: idx === activeProof 
                    ? (DOT_BADGE_COLORS[proof.id] ?? 'var(--page-badge-accent)')
                    : 'var(--glass-border)',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Explanation */}
      <motion.div
        variants={bottomCTAVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="mt-16 sm:mt-20 md:mt-24 lg:mt-32 xl:mt-40 text-center"
      >
        <div className="glass-badge inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl backdrop-blur-xl">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex-shrink-0" style={{ color: 'var(--page-icon-primary)' }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg" style={{ color: 'var(--page-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              Zero-Knowledge = Zero Trust Needed.
            </span>{' '}
            Your data never leaves your device unencrypted.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

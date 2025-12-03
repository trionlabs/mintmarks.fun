import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Users, Shield, User, Code, ChevronDown, CheckCircle2 } from 'lucide-react'

type Perspective = 'users' | 'builders'

// Animation variants for list item animations
const exampleVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
}

const expandVariants = {
  hidden: { opacity: 0, height: 0, x: -10 },
  visible: { opacity: 1, height: 'auto', x: 0 },
  exit: { opacity: 0, height: 0, x: -10 }
}

export function WhatYouCanDoSection() {
  const [activePerspective, setActivePerspective] = useState<Perspective>('users')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleExpand = (utilityId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [utilityId]: !prev[utilityId]
    }))
  }

  const utilities = [
    {
      id: 'perks',
      icon: Gift,
      title: 'Unlock Perks',
      users: {
        description: 'Access exclusive benefits, early access to events, and special rewards based on your verified Mark collection.',
        examples: [
          '20% off Devcon tickets with previous attendance Mark',
          'Access ETHGlobal hacker lounge (verified attendees)',
          'Tesla owner benefits & referral program access',
          '30% off Substack annual subscription renewal',
          'Free merch for zkSync Era deployers',
          'Priority access for Optimism RetroPGF voters',
          'Concert VIP upgrade for verified ticket holders',
          'Alumni discounts with university email proof'
        ]
      },
      builders: {
        description: 'Build token-gated experiences and exclusive benefits for Mark holders. Create unstoppable perks.',
        examples: [
          'Gate Discord server by event attendance proof',
          'Launch early access for newsletter subscribers',
          'Build exclusive merch store for community members',
          'Create tiered benefits by Mark collection size',
          'Airdrop tokens to verified event participants',
          'VIP content access for long-time supporters',
          'Loyalty rewards program for repeat attendees',
          'Referral bonuses for Mark holder advocates'
        ]
      }
    },
    {
      id: 'communities',
      icon: Users,
      title: 'Verifiable Communities',
      users: {
        description: 'Join private groups where only verified Mark holders can participate. Build trust networks.',
        examples: [
          'Luma event attendees-only Telegram group',
          'EthCC speakers private networking forum',
          'NFT project holders exclusive Discord channel',
          'Gitcoin grant recipients collaboration network',
          'Stanford alumni verified community portal',
          'Y Combinator founders private group',
          'Published authors peer review network',
          'Verified journalists industry discussions'
        ]
      },
      builders: {
        description: 'Create exclusive spaces for your audience. Build verifiable social gates and trust layers.',
        examples: [
          'Launch Discord for verified podcast listeners',
          'Create subscriber-exclusive Telegram channel',
          'Build alumni network with email verification',
          'Gate forum access by event participation',
          'Verified customer feedback and beta groups',
          'Token-holder governance discussion channels',
          'Industry professional networking platforms',
          'Geographic community groups with proof of location'
        ]
      }
    },
    {
      id: 'identity',
      icon: Shield,
      title: 'Verifiable Credentials',
      users: {
        description: 'Build privacy-preserving credentials with ZK proofs. Prove your experience without revealing sensitive data.',
        examples: [
          'Prove event attendance without sharing email',
          'Verify newsletter subscription anonymously',
          'Show purchase history without transaction details',
          'Prove membership without revealing identity',
          'Aggregate credentials into zkPassport',
          'Build composable on-chain reputation',
          'Verify work experience privately',
          'Create portable trust across platforms'
        ]
      },
      builders: {
        description: 'Build credential systems powered by ZK-Email. Create privacy-first verification infrastructure.',
        examples: [
          'Issue verifiable credentials via email receipts',
          'Build zkPassport integrations for identity',
          'Create sybil-resistant voting systems',
          'Design privacy-preserving KYC alternatives',
          'Launch credential aggregation platforms',
          'Build composable reputation protocols',
          'Create anonymous proof-of-personhood',
          'Verify qualifications without data exposure'
        ]
      }
    }
  ]

  return (
    <section id="whats-possible" className="home-section relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
      {/* Section Header - Compact */}
      <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6 mb-4">
          <div className="flex-1 space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-[0.9]">
              <span style={{ color: 'var(--page-text-primary)' }}>What's Possible with</span>
              <br />
              <span 
                className="light:text-[var(--status-info)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
              >ZK-Email Marks</span>
            </h2>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-light tracking-wide" style={{ color: 'var(--page-text-muted)' }}>
              Private. Verifiable. Composable.
            </h3>
          </div>

          {/* Perspective Toggle - Modern, Minimal, Prominent */}
          <div 
            className="flex items-center gap-1.5 rounded-full p-1 sm:p-1.5 border backdrop-blur-md flex-shrink-0 self-start lg:self-auto"
            style={{
              backgroundColor: 'var(--glass-bg-primary)',
              borderColor: 'var(--glass-border-hover)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <button
              onClick={() => setActivePerspective('users')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 ease-out min-h-[44px]"
              style={{
                backgroundColor: activePerspective === 'users' 
                  ? 'var(--glass-bg-hover)' 
                  : 'transparent',
                color: activePerspective === 'users' 
                  ? 'var(--page-text-primary)' 
                  : 'var(--page-text-muted)',
                boxShadow: activePerspective === 'users' 
                  ? 'var(--glass-shadow-hover)' 
                  : 'none',
                border: activePerspective === 'users'
                  ? '1px solid var(--glass-border-hover)'
                  : '1px solid transparent',
                backdropFilter: activePerspective === 'users' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                WebkitBackdropFilter: activePerspective === 'users' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                transform: activePerspective === 'users' ? 'scale(1.02)' : 'scale(1)',
                fontWeight: activePerspective === 'users' ? '600' : '500'
              }}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Users</span>
            </button>
            <button
              onClick={() => setActivePerspective('builders')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 ease-out min-h-[44px]"
              style={{
                backgroundColor: activePerspective === 'builders' 
                  ? 'var(--glass-bg-hover)' 
                  : 'transparent',
                color: activePerspective === 'builders' 
                  ? 'var(--page-text-primary)' 
                  : 'var(--page-text-muted)',
                boxShadow: activePerspective === 'builders' 
                  ? 'var(--glass-shadow-hover)' 
                  : 'none',
                border: activePerspective === 'builders'
                  ? '1px solid var(--glass-border-hover)'
                  : '1px solid transparent',
                backdropFilter: activePerspective === 'builders' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                WebkitBackdropFilter: activePerspective === 'builders' 
                  ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' 
                  : 'none',
                transform: activePerspective === 'builders' ? 'scale(1.02)' : 'scale(1)',
                fontWeight: activePerspective === 'builders' ? '600' : '500'
              }}
            >
              <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Builders</span>
            </button>
          </div>
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed font-light" style={{ color: 'var(--page-text-secondary)' }}>
          {activePerspective === 'users' 
            ? 'Your Marks unlock new possibilities in the digital world.'
            : 'Build powerful experiences on top of verified credentials.'
          }
        </p>
      </div>

      {/* 3-Column Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {utilities.map((utility) => {
          const content = utility[activePerspective]
          
          return (
            <div
              key={`${utility.id}-${activePerspective}`}
              className="glass-card-interactive rounded-xl lg:rounded-2xl overflow-hidden group"
            >
              <div className="p-4 sm:p-5 lg:p-6 flex flex-col min-h-[280px] sm:min-h-[300px] md:min-h-[320px] lg:min-h-[360px]">
                
                {/* Header - Compact */}
                <div className="mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg glass-inset inline-flex mb-2 sm:mb-3 transition-all duration-300">
                    <utility.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--page-icon-primary)' }} />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--page-text-primary)' }}>
                    {utility.title}
                  </h3>
                </div>

                {/* Description - Compact */}
                <p className="text-xs sm:text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--page-text-secondary)' }}>
                  {content.description}
                </p>

                {/* Examples - Compact (show 3 instead of 4) */}
                <div className="space-y-1.5 sm:space-y-2 mb-auto">
                  {content.examples.slice(0, 3).map((example, idx) => (
                    <motion.div
                      key={example}
                      variants={exampleVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.15 + idx * 0.04, duration: 0.3, ease: "easeOut" }}
                      className="flex items-start gap-1.5 sm:gap-2 group/item cursor-default"
                      whileHover={{ x: 1, transition: { duration: 0.15 } }}
                    >
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 flex-shrink-0 transition-colors duration-200" 
                        style={{ color: 'var(--page-text-muted)' }} 
                      />
                      <span className="text-[11px] sm:text-xs leading-relaxed transition-colors duration-200 line-clamp-1" style={{ color: 'var(--page-text-secondary)' }}>
                        {example}
                      </span>
                    </motion.div>
                  ))}

                  <AnimatePresence>
                    {expandedCards[utility.id] && content.examples.slice(4).map((example, idx) => (
                      <motion.div
                        key={example}
                        variants={expandVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ delay: idx * 0.04, duration: 0.25, ease: "easeOut" }}
                        className="flex items-start gap-2.5 group/item cursor-default"
                        whileHover={{ x: 1, transition: { duration: 0.15 } }}
                      >
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-200" 
                          style={{ color: 'var(--page-text-muted)' }} 
                        />
                        <span className="text-sm leading-relaxed transition-colors duration-200" style={{ color: 'var(--page-text-secondary)' }}>
                          {example}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {content.examples.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(utility.id)
                      }}
                      className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md transition-all duration-300 hover:bg-[var(--glass-bg-hover)] group/btn w-full min-h-[32px]"
                    >
                      <span className="text-[10px] sm:text-xs font-semibold tracking-wide" style={{ color: 'var(--page-text-muted)' }}>
                        {expandedCards[utility.id] 
                          ? 'Show Less' 
                          : `+${content.examples.length - 3} more`
                        }
                      </span>
                      <motion.div
                        animate={{ rotate: expandedCards[utility.id] ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--page-text-muted)' }} />
                      </motion.div>
                    </button>
                  )}
                </div>

                {/* Badge - Compact */}
                <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
                  <div className="inline-flex items-center px-2 py-1 rounded-md border"
                    style={{ 
                      backgroundColor: 'var(--glass-bg-hover)',
                      borderColor: 'var(--glass-border-hover)'
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--page-text-primary)' }}>
                      {activePerspective === 'users' ? 'For You' : 'Build It'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA - Compact */}
      <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 text-center">
        <div className="glass-badge inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg backdrop-blur-xl">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" style={{ color: 'var(--page-icon-primary)' }} />
          <p className="text-xs sm:text-sm" style={{ color: 'var(--page-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              Email Marks are unstoppable.
            </span>
            {' '}
            <span style={{ color: 'var(--page-text-muted)' }}>
              Private. Composable.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

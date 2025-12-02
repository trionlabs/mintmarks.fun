import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Users, Shield, User, Code, ChevronDown, CheckCircle2 } from 'lucide-react'

type Perspective = 'users' | 'builders'

// Animation variants for optimized rendering
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const exampleVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
}

const expandVariants = {
  hidden: { opacity: 0, height: 0, x: -10 },
  visible: { opacity: 1, height: 'auto', x: 0 },
  exit: { opacity: 0, height: 0, x: -10 }
}

const bottomCTAVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
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
    <section className="relative max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-20 sm:py-32 md:py-40 lg:py-52 xl:py-64">
      {/* Section Header */}
      <div className="mb-12 sm:mb-16 md:mb-20 lg:mb-24">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8 mb-6 sm:mb-7 md:mb-8">
          <div className="flex-1 space-y-2 sm:space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.85]">
              <span style={{ color: 'var(--page-text-primary)' }}>What's Possible with</span>
              <br />
              <span 
                className="light:text-[var(--status-info)] dark:text-[var(--page-headline-accent)] dark:mix-blend-screen"
              >ZK-Email Marks</span>
            </h2>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-wide" style={{ color: 'var(--page-text-muted)' }}>
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

      {/* 3-Column Grid - Mobile: 1 col, Tablet (iPad): 2 cols, Desktop: 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
        {utilities.map((utility, index) => {
          const content = utility[activePerspective]
          
          return (
            <motion.div
              key={`${utility.id}-${activePerspective}`}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
              className="glass-primary rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
            >
              <div className="p-6 sm:p-7 md:p-8 lg:p-10 flex flex-col min-h-[350px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[500px]">
                
                {/* Header */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl glass-inset inline-flex mb-3 sm:mb-4 transition-all duration-300 group-hover:scale-[1.02]">
                    <utility.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: 'var(--page-icon-primary)' }} />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--page-text-primary)' }}>
                    {utility.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base leading-relaxed mb-4 sm:mb-5 md:mb-6" style={{ color: 'var(--page-text-secondary)' }}>
                  {content.description}
                </p>

                {/* Examples */}
                <div className="space-y-2 sm:space-y-2.5 mb-auto">
                  {content.examples.slice(0, 4).map((example, idx) => (
                    <motion.div
                      key={example}
                      variants={exampleVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.15 + idx * 0.04, duration: 0.3, ease: "easeOut" }}
                      className="flex items-start gap-2 sm:gap-2.5 group/item cursor-default"
                      whileHover={{ x: 2, transition: { duration: 0.15 } }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 transition-colors duration-200" 
                        style={{ color: 'var(--page-text-muted)' }} 
                      />
                      <span className="text-xs sm:text-sm leading-relaxed transition-colors duration-200" style={{ color: 'var(--page-text-secondary)' }}>
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
                        whileHover={{ x: 2, transition: { duration: 0.15 } }}
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

                  {content.examples.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(utility.id)
                      }}
                      className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-[var(--glass-bg-hover)] group/btn w-full min-h-[44px]"
                    >
                      <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--page-text-muted)' }}>
                        {expandedCards[utility.id] 
                          ? 'Show Less' 
                          : `Show ${content.examples.length - 4} More Examples`
                        }
                      </span>
                      <motion.div
                        animate={{ rotate: expandedCards[utility.id] ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--page-text-muted)' }} />
                      </motion.div>
                    </button>
                  )}
                </div>

                {/* Badge */}
                <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-[var(--glass-border)]">
                  <div className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--glass-bg-hover)',
                      borderColor: 'var(--glass-border-hover)'
                    }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--page-text-primary)' }}>
                      {activePerspective === 'users' ? 'For You' : 'Build It'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        variants={bottomCTAVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="mt-12 sm:mt-16 md:mt-20 lg:mt-28 text-center"
      >
        <div className="glass-badge inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl backdrop-blur-xl">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex-shrink-0" style={{ color: 'var(--page-icon-primary)' }} />
          <p className="text-xs sm:text-sm md:text-base lg:text-lg" style={{ color: 'var(--page-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              Email Marks are unstoppable.
            </span>
            {' '}
            <span style={{ color: 'var(--page-text-muted)' }}>
              Private. Composable.
            </span>
          </p>
        </div>
      </motion.div>
    </section>
  )
}

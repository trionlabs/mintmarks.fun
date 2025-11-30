/**
 * ComponentShowcase - Visual showcase of all UI components
 * 
 * Displays all button, card, and glass variants for visual comparison.
 * Use this page to verify theme consistency across components.
 */

import { useState } from 'react'
import {
  ArrowRight,
  Mail,
  Sparkles,
  Check,
  Loader2,
  Shield,
  Zap,
  Wallet,
  Calendar,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'


// ============================================
// Section Component
// ============================================
function Section({
  title,
  description,
  children,
  dark = false,
}: {
  title: string
  description: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div className={`py-12 px-6 ${dark ? 'hero-section' : ''}`} style={dark ? { background: 'var(--hero-page-bg)' } : {}}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'glass-text-primary'}`}>
            {title}
          </h2>
          <p className={`text-sm ${dark ? 'text-blue-200' : 'glass-text-secondary'}`}>
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

// ============================================
// Demo Email Card (for card showcase)
// ============================================
function DemoEmailCard({ variant }: { variant: 'default' | 'figma' | 'figma-hover' | 'glass' | 'hero' | 'hero-glow' | 'hero-outline' }) {
  return (
    <Card variant={variant} className="max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--Controls-Idle)' }}
          >
            <Bookmark className="h-5 w-5" style={{ color: 'var(--Controls-Selected)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'var(--source-luma-bg)', color: 'var(--source-luma)' }}
              >
                Luma
              </span>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'var(--status-attended-bg)', color: 'var(--status-attended)' }}
              >
                Attended
              </span>
            </div>
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--page-text-primary)' }}>
              Thanks for joining The Zama World's Fair
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3 w-3" style={{ color: 'var(--page-text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--page-text-muted)' }}>
                Tue, Nov 18, 2025
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Main Showcase Page
// ============================================
export function ComponentShowcase() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="py-12 px-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 glass-text-primary">
            Component Showcase
          </h1>
          <p className="text-lg glass-text-secondary max-w-2xl">
            Visual comparison of all UI components with their variants.
            Use this page to verify theme consistency.
          </p>
        </div>
      </div>

      {/* ============================================
          BUTTONS - Light Background
          ============================================ */}
      <Section
        title="Default Buttons"
        description="Background, border, blur ve blend mode ile"
      >
        <div className="space-y-6">
          {/* Row 1: Default variant */}
          <div className="flex flex-wrap items-center gap-4">
            <Button>Default Button</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              With Icon
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Outline Buttons"
        description="Transparent background, border ve blur ile"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline">Outline Button</Button>
          <Button variant="outline" size="sm">Small</Button>
          <Button variant="outline" size="lg">Large</Button>
          <Button variant="outline" disabled>Disabled</Button>
        </div>
      </Section>

      <Section
        title="Secondary Buttons"
        description="Background, border ve blur ile"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="secondary" size="sm">Small</Button>
          <Button variant="secondary" size="lg">Large</Button>
          <Button variant="secondary" disabled>Disabled</Button>
        </div>
      </Section>

      <Section
        title="Ghost Buttons"
        description="Transparent background, nav colors ile"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="ghost" size="sm">Small</Button>
          <Button variant="ghost" size="lg">Large</Button>
          <Button variant="ghost" disabled>Disabled</Button>
        </div>
      </Section>

      <Section
        title="Destructive & Link Buttons"
        description="Özel durumlar için"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="destructive">Destructive</Button>
          <Button variant="destructive" size="sm">Small</Button>
          <Button variant="link">Link Button</Button>
        </div>
      </Section>

      {/* ============================================
          BUTTONS - Dark/Hero Background
          ============================================ */}
      <Section
        title="Hero Buttons"
        description="Dark blue arka plan üzerinde kullanım için"
        dark
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="hero">Hero Primary</Button>
            <Button variant="hero" size="sm">Small</Button>
            <Button variant="hero" size="lg">Large</Button>
            <Button variant="hero" className="gap-4">
              Start Now
              <div className="bg-blue-600 text-white rounded-full p-1.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="hero-outline">Hero Outline</Button>
            <Button variant="hero-outline" size="sm">Small</Button>
            <Button variant="hero-outline" size="lg">Large</Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="hero-glass">Hero Glass</Button>
            <Button variant="hero-glass" size="sm">Small</Button>
            <Button variant="hero-glass" size="lg">Large</Button>
            <Button variant="hero-glass" size="icon">
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Section>

      {/* ============================================
          CARDS - Light Background
          ============================================ */}
      <Section
        title="Card Variants (Light)"
        description="Glassmorphic kart stilleri"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <DemoEmailCard variant="default" />
            <p className="text-xs text-center glass-text-muted">variant="default"</p>
          </div>

          <div className="space-y-2">
            <DemoEmailCard variant="figma" />
            <p className="text-xs text-center glass-text-muted">variant="figma"</p>
          </div>

          <div className="space-y-2">
            <DemoEmailCard variant="figma-hover" />
            <p className="text-xs text-center glass-text-muted">variant="figma-hover"</p>
          </div>

          <div className="space-y-2">
            <DemoEmailCard variant="glass" />
            <p className="text-xs text-center glass-text-muted">variant="glass"</p>
          </div>
        </div>
      </Section>

      {/* ============================================
          CARDS - Dark Background
          ============================================ */}
      <Section
        title="Hero Card Variants"
        description="Dark blue arka plan üzerinde glassmorphic kartlar"
        dark
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Card variant="hero" className="p-6">
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                Hero Card
              </h3>
              <p style={{ color: 'var(--hero-text-muted)' }}>
                Basic glassmorphic card with white/transparent styling.
              </p>
            </Card>
            <p className="text-xs text-center text-blue-200">variant="hero"</p>
          </div>

          <div className="space-y-2">
            <Card variant="hero-glow" className="p-6">
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                Hero Glow
              </h3>
              <p style={{ color: 'var(--hero-text-muted)' }}>
                Card with animated glow effect on hover.
              </p>
            </Card>
            <p className="text-xs text-center text-blue-200">variant="hero-glow"</p>
          </div>

          <div className="space-y-2">
            <Card variant="hero-outline" className="p-6">
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--hero-text-primary)' }}>
                Hero Outline
              </h3>
              <p style={{ color: 'var(--hero-text-muted)' }}>
                Transparent with white border, subtle glass.
              </p>
            </Card>
            <p className="text-xs text-center text-blue-200">variant="hero-outline"</p>
          </div>
        </div>
      </Section>

      {/* ============================================
          GLASS UTILITIES
          ============================================ */}
      <Section
        title="Glass Utility Classes"
        description="Doğrudan kullanılabilir CSS utility class'ları"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="glass-primary rounded-xl p-6 text-center">
              <p className="font-medium glass-text-primary">glass-primary</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="glass-secondary rounded-xl p-6 text-center">
              <p className="font-medium glass-text-primary">glass-secondary</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="glass-tertiary rounded-xl p-6 text-center">
              <p className="font-medium glass-text-primary">glass-tertiary</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="glass-card glass-card-hover rounded-xl p-6 text-center cursor-pointer">
              <p className="font-medium glass-text-primary">glass-card + hover</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================
          BADGES & PILLS
          ============================================ */}
      <Section
        title="Badges & Status"
        description="Source ve status badge'leri"
      >
        <div className="space-y-6">
          {/* Source Badges - Minimal with subtle color */}
          <div>
            <p className="text-sm font-medium mb-3 glass-text-secondary">Source Badges</p>
            <div className="flex flex-wrap gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--source-luma-bg)', color: 'var(--source-luma)', borderColor: 'var(--source-luma-border)' }}
              >
                Luma
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--source-substack-bg)', color: 'var(--source-substack)', borderColor: 'var(--source-substack-border)' }}
              >
                Substack
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--source-eventbrite-bg)', color: 'var(--source-eventbrite)', borderColor: 'var(--source-eventbrite-border)' }}
              >
                Eventbrite
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--source-amazon-bg)', color: 'var(--source-amazon)', borderColor: 'var(--source-amazon-border)' }}
              >
                Amazon
              </span>
            </div>
          </div>

          {/* Status Badges - Minimal with subtle color */}
          <div>
            <p className="text-sm font-medium mb-3 glass-text-secondary">Status Badges</p>
            <div className="flex flex-wrap gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--status-confirmed-bg)', color: 'var(--status-confirmed)', borderColor: 'var(--status-confirmed-border)' }}
              >
                Confirmed
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending)', borderColor: 'var(--status-pending-border)' }}
              >
                Pending
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--status-attended-bg)', color: 'var(--status-attended)', borderColor: 'var(--status-attended-border)' }}
              >
                Attended
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{ background: 'var(--status-minted-bg)', color: 'var(--status-minted)', borderColor: 'var(--status-minted-border)' }}
              >
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Minted
                </span>
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================
          FEATURE CARDS
          ============================================ */}
      <Section
        title="Feature Cards"
        description="Icon + text kombinasyonu ile özellik kartları"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--Controls-Idle)' }}>
                <Shield className="h-6 w-6" style={{ color: 'var(--Controls-Selected)' }} />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Privacy First
              </h3>
              <p className="glass-text-secondary text-sm">
                Zero-knowledge proofs verify your attendance without revealing your email content.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--Controls-Idle)' }}>
                <Zap className="h-6 w-6" style={{ color: 'var(--Controls-Selected)' }} />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Fast & Cheap
              </h3>
              <p className="glass-text-secondary text-sm">
                Mint on Base L2 for minimal gas fees and instant confirmations.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'var(--Controls-Idle)' }}>
                <Sparkles className="h-6 w-6" style={{ color: 'var(--Controls-Selected)' }} />
              </div>
              <h3 className="glass-text-primary font-semibold mb-2">
                Unique Collectibles
              </h3>
              <p className="glass-text-secondary text-sm">
                Each Mark is a unique NFT representing your real-world commitments.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ============================================
          BUTTON STATES
          ============================================ */}
      <Section
        title="Button States"
        description="Loading, disabled ve interactive states"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>

          <Button onClick={() => setLoading(!loading)}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Click to Toggle Loading'
            )}
          </Button>

          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>

          <Button variant="secondary" className="gap-2">
            <Mail className="h-4 w-4" />
            Connect Gmail
          </Button>
        </div>
      </Section>

      {/* ============================================
          COLOR PALETTE
          ============================================ */}
      <Section
        title="Color Palette"
        description="Tema renkleri ve CSS variable'ları"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Primary */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg" style={{ background: 'var(--primary)' }} />
            <p className="text-xs text-center glass-text-muted">--primary</p>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg" style={{ background: 'var(--Controls-Selected)' }} />
            <p className="text-xs text-center glass-text-muted">--Controls-Selected</p>
          </div>

          {/* Success */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg" style={{ background: 'var(--mint-success)' }} />
            <p className="text-xs text-center glass-text-muted">--mint-success</p>
          </div>

          {/* Destructive */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg" style={{ background: 'var(--destructive)' }} />
            <p className="text-xs text-center glass-text-muted">--destructive</p>
          </div>

          {/* Glass BG */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg border" style={{ background: 'var(--glass-bg-primary)', borderColor: 'var(--glass-border)' }} />
            <p className="text-xs text-center glass-text-muted">--glass-bg-primary</p>
          </div>

          {/* Glass Border */}
          <div className="space-y-2">
            <div className="h-16 rounded-lg border-4" style={{ borderColor: 'var(--glass-border)' }} />
            <p className="text-xs text-center glass-text-muted">--glass-border</p>
          </div>
        </div>
      </Section>

      {/* ============================================
          TYPOGRAPHY
          ============================================ */}
      <Section
        title="Typography"
        description="Text stilleri ve renkler"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1 glass-text-muted">glass-text-primary</p>
            <p className="text-2xl font-bold glass-text-primary">Primary Text - Headlines & Titles</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1 glass-text-muted">glass-text-secondary</p>
            <p className="text-lg glass-text-secondary">Secondary Text - Descriptions & Body Copy</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1 glass-text-muted">glass-text-muted</p>
            <p className="text-sm glass-text-muted">Muted Text - Captions, Hints & Meta Info</p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="py-8 px-6 border-t text-center" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-sm glass-text-muted">
          MintMarks Component Showcase • Theme System v1.0
        </p>
      </div>
    </div>
  )
}

export default ComponentShowcase


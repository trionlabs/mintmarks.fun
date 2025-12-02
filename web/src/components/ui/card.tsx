import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'relative text-card-foreground transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Ultra transparent glass with blend mode
        default: `
          glass-primary
          rounded-xl
          mix-blend-normal
          hover:bg-[var(--glass-bg-hover)]
          hover:shadow-[var(--glass-shadow-hover)]
          hover:border-[var(--glass-border-hover)]
        `,
        // Figma style - subtle
        figma: `
          glass-secondary
          rounded-xl
          hover:bg-[var(--glass-bg-hover)]
          hover:border-[var(--glass-border-hover)]
        `,
        // Figma with subtle shadow
        'figma-blur': `
          glass-secondary
          rounded-xl
          shadow-[var(--glass-shadow)]
          hover:bg-[var(--glass-bg-hover)]
          hover:shadow-[var(--glass-shadow-hover)]
        `,
        // Figma with hover lift (only for email cards)
        // Note: glass-email-card utility will override backdrop-filter
        'figma-hover': `
          rounded-xl
          hover:-translate-y-0.5
        `,
        // Full glass effect - ultra transparent
        glass: `
          glass-primary
          rounded-xl
          hover:bg-[var(--glass-bg-hover)]
          hover:shadow-[var(--glass-shadow-hover)]
        `,
        // Minimal - most transparent
        minimal: `
          glass-tertiary
          rounded-lg
          hover:bg-[var(--glass-bg-hover)]
        `,
        // Hero Glass - White/transparent on dark blue backgrounds
        hero: `
          bg-[var(--hero-glass-bg)]
          [backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          [-webkit-backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          border border-[var(--hero-glass-border)]
          rounded-2xl
          shadow-[var(--hero-glass-shadow)]
          text-[var(--hero-text-primary)]
          hover:bg-[var(--hero-glass-bg-hover)]
          hover:border-[var(--hero-glass-border-hover)]
          hover:shadow-[var(--hero-glass-shadow-hover)]
          hover:-translate-y-0.5
        `,
        // Hero Glass with glow effect
        'hero-glow': `
          bg-[var(--hero-glass-bg)]
          [backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          [-webkit-backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          border border-[var(--hero-glass-border)]
          rounded-2xl
          shadow-[var(--hero-glass-shadow)]
          text-[var(--hero-text-primary)]
          relative
          before:absolute before:inset-[-2px] before:rounded-2xl
          before:bg-gradient-to-br before:from-white/10 before:via-white/5 before:to-white/10
          before:blur-xl before:opacity-0 before:-z-10
          before:transition-opacity before:duration-300
          hover:before:opacity-100
          hover:-translate-y-0.5
        `,
        // Hero Glass - Outline only
        'hero-outline': `
          bg-transparent
          [backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          [-webkit-backdrop-filter:blur(var(--glass-blur))_saturate(var(--glass-saturate))]
          border border-[var(--hero-glass-border)]
          rounded-2xl
          text-[var(--hero-text-primary)]
          hover:bg-[var(--hero-glass-bg)]
          hover:border-[var(--hero-glass-border-hover)]
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4 md:p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'font-semibold leading-none tracking-tight text-[var(--page-text-primary)]',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-[var(--page-text-secondary)]', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 md:p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 md:p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }

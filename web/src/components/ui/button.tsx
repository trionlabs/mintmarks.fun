import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium
   transition-all duration-300 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50
   [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // Default - Solid with subtle glass effect
        default: `
          bg-[var(--figma-cta1-bg)] text-[var(--figma-cta1-text)]
          border-2 border-[var(--figma-cta1-border)]
          backdrop-blur-sm
          shadow-[0_4px_14px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
          hover:shadow-[0_6px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]
          hover:bg-[var(--figma-cta1-hover-bg)] hover:-translate-y-0.5
          active:bg-[var(--figma-cta1-active-bg)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        `,
        // Outline - Pure blur, transparent background
        outline: `
          bg-[var(--button-outline-bg)]
          border border-[var(--button-outline-border)]
          text-[var(--button-outline-text)]
          backdrop-blur-[32px]
          hover:bg-[var(--button-outline-hover-bg)]
          hover:border-[var(--button-outline-hover-border)]
          hover:text-[var(--button-outline-hover-text)]
          hover:-translate-y-0.5
          active:translate-y-0
        `,
        // Ghost - Subtle glass on hover
        ghost: `
          bg-transparent
          border border-transparent
          text-[var(--button-ghost-text)]
          hover:bg-[var(--glass-bg-tertiary)]
          hover:backdrop-blur-md
          hover:border-[var(--glass-border)]/50
          hover:text-[var(--button-ghost-hover-text)]
          rounded-lg
        `,
        // Destructive - Red glass
        destructive: `
          bg-red-500/15 
          border border-red-500/30
          text-red-700 dark:text-red-300
          backdrop-blur-lg backdrop-saturate-[150%]
          shadow-[0_2px_8px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]
          hover:bg-red-500/25
          hover:border-red-500/40
          hover:shadow-[0_4px_14px_rgba(239,68,68,0.2)]
        `,
        // Secondary - Dark gray glass
        secondary: `
          bg-[var(--figma-cta3-bg)]
          border border-[var(--figma-cta3-border)]
          text-[var(--figma-cta3-text)]
          backdrop-blur-[32px]
          shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
          hover:bg-[rgba(255,255,255,0.12)]
          hover:border-[rgba(255,255,255,0.2)]
          hover:-translate-y-0.5
          active:translate-y-0
        `,
        // Link - No glass
        link: `
          bg-transparent border-none 
          text-[var(--button-link-text)]
          underline underline-offset-4
          hover:text-[var(--button-link-hover-text)] hover:no-underline
        `,
        // Hero Primary - White button on dark blue background
        hero: `
          bg-white text-blue-700
          border-none
          shadow-[0_4px_20px_rgba(0,0,0,0.15)]
          hover:bg-blue-50 hover:scale-105
          hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
          active:scale-100
        `,
        // Hero Outline - Transparent with white border
        'hero-outline': `
          bg-transparent
          border border-[var(--hero-glass-border)]
          text-[var(--hero-text-primary)]
          backdrop-blur-md
          hover:bg-[var(--hero-glass-bg)]
          hover:border-[var(--hero-glass-border-hover)]
        `,
        // Hero Glass - Glassmorphic button for hero sections
        'hero-glass': `
          bg-[var(--hero-glass-bg)]
          border border-[var(--hero-glass-border)]
          text-[var(--hero-text-primary)]
          backdrop-blur-xl backdrop-saturate-[180%]
          shadow-[var(--hero-glass-shadow)]
          hover:bg-[var(--hero-glass-bg-hover)]
          hover:border-[var(--hero-glass-border-hover)]
          hover:shadow-[var(--hero-glass-shadow-hover)]
          hover:-translate-y-0.5
          active:translate-y-0
        `,
      },
      size: {
        default: 'px-8 py-3 text-sm',
        sm: 'px-6 py-2 text-xs',
        lg: 'px-10 py-4 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }


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
        default: `
          bg-[var(--figma-cta1-bg)] text-[var(--figma-cta1-text)]
          border-2 border-[var(--figma-cta1-border)]
          shadow-lg hover:shadow-xl
          hover:bg-[var(--figma-cta1-hover-bg)] hover:-translate-y-0.5
          active:bg-[var(--figma-cta1-active-bg)] active:translate-y-0
          dark:bg-blend-hard-light dark:backdrop-blur-[7.5px]
        `,
        outline: `
          bg-[var(--button-outline-bg)] 
          border border-[var(--button-outline-border)] 
          text-[var(--button-outline-text)]
          backdrop-blur-md backdrop-saturate-150 shadow-sm
          hover:bg-[var(--button-outline-hover-bg)] 
          hover:border-[var(--button-outline-hover-border)]
          hover:text-[var(--button-outline-hover-text)]
          hover:shadow
          active:bg-[var(--button-outline-hover-bg)]
        `,
        ghost: `
          bg-[var(--button-ghost-bg)] 
          border-transparent 
          text-[var(--button-ghost-text)]
          hover:bg-[var(--button-ghost-hover-bg)] 
          hover:text-[var(--button-ghost-hover-text)]
        `,
        destructive: `
          bg-[var(--button-destructive-bg)] 
          border border-[var(--button-destructive-border)] 
          text-[var(--button-destructive-text)]
          shadow-md
          hover:bg-[var(--button-destructive-hover-bg)] 
          hover:border-[var(--button-destructive-hover-border)]
        `,
        secondary: `
          bg-[var(--figma-cta3-bg)] text-[var(--figma-cta3-text)]
          border border-[var(--figma-cta3-border)]
          hover:opacity-90
        `,
        link: `
          bg-transparent border-none 
          text-[var(--button-link-text)]
          underline underline-offset-4
          hover:text-[var(--button-link-hover-text)] hover:no-underline
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


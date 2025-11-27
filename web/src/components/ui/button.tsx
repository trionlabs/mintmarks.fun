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
          bg-white/80 border border-gray-300 text-gray-800
          backdrop-blur-md backdrop-saturate-150 shadow-sm
          hover:bg-gray-50 hover:border-gray-400 hover:shadow
          active:bg-gray-100
          dark:bg-transparent dark:border-gray-500 dark:text-gray-200
          dark:hover:bg-gray-700/40 dark:hover:border-gray-400 dark:hover:text-white
          dark:active:bg-gray-600/50 dark:active:text-white
        `,
        ghost: `
          bg-transparent border-transparent text-gray-700
          hover:bg-gray-100 hover:text-gray-900
          dark:text-gray-300
          dark:hover:bg-gray-700/40 dark:hover:text-white
        `,
        destructive: `
          bg-red-500 border border-red-600 text-white
          shadow-md
          hover:bg-red-600 hover:border-red-700
          dark:bg-red-600 dark:border-red-500
          dark:hover:bg-red-500
        `,
        secondary: `
          bg-[var(--figma-cta3-bg)] text-[var(--figma-cta3-text)]
          border border-[var(--figma-cta3-border)]
          hover:opacity-90
        `,
        link: `
          bg-transparent border-none text-blue-500
          underline underline-offset-4
          hover:text-blue-600 hover:no-underline
          dark:text-blue-400 dark:hover:text-blue-300
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


import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  `relative w-full rounded-xl px-4 py-3 text-sm
   [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4
   [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7
   backdrop-blur-lg backdrop-saturate-[150%]
   transition-all duration-300`,
  {
    variants: {
      variant: {
        default: `
          bg-slate-500/10 border border-slate-500/20 text-slate-800
          [&>svg]:text-slate-600
          dark:bg-slate-400/10 dark:border-slate-400/20 dark:text-slate-200
          dark:[&>svg]:text-slate-400
          shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.1)]
        `,
        destructive: `
          bg-red-500/10 border border-red-500/25 text-red-900
          [&>svg]:text-red-600
          dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-100
          dark:[&>svg]:text-red-400
          shadow-[0_2px_8px_rgba(239,68,68,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]
        `,
        success: `
          bg-green-500/10 border border-green-500/25 text-green-900
          [&>svg]:text-green-600
          dark:bg-green-500/15 dark:border-green-500/30 dark:text-green-100
          dark:[&>svg]:text-green-400
          shadow-[0_2px_8px_rgba(34,197,94,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]
        `,
        warning: `
          bg-amber-500/10 border border-amber-500/25 text-amber-900
          [&>svg]:text-amber-600
          dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-100
          dark:[&>svg]:text-amber-400
          shadow-[0_2px_8px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]
        `,
        info: `
          bg-blue-500/10 border border-blue-500/25 text-blue-900
          [&>svg]:text-blue-600
          dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-100
          dark:[&>svg]:text-blue-400
          shadow-[0_2px_8px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }


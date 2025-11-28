import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  `relative w-full rounded-lg px-4 py-3 text-sm
   [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4
   [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7
   shadow-sm transition-all duration-300`,
  {
    variants: {
      variant: {
        default: `
          bg-slate-100 border border-slate-300 text-slate-800
          [&>svg]:text-slate-600
          dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200
          dark:[&>svg]:text-slate-400
        `,
        destructive: `
          bg-red-50 border border-red-300 text-red-900
          [&>svg]:text-red-600
          dark:bg-red-950 dark:border-red-800 dark:text-red-100
          dark:[&>svg]:text-red-400
        `,
        success: `
          bg-green-50 border border-green-300 text-green-900
          [&>svg]:text-green-600
          dark:bg-green-950 dark:border-green-800 dark:text-green-100
          dark:[&>svg]:text-green-400
        `,
        warning: `
          bg-amber-50 border border-amber-300 text-amber-900
          [&>svg]:text-amber-600
          dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100
          dark:[&>svg]:text-amber-400
        `,
        info: `
          bg-blue-50 border border-blue-300 text-blue-900
          [&>svg]:text-blue-600
          dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100
          dark:[&>svg]:text-blue-400
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


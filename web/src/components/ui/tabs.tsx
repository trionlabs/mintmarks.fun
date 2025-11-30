import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Layout
      'inline-flex min-h-11 items-center justify-center p-1',
      // Glassmorphic effect
      'bg-[var(--glass-bg-secondary)]',
      'backdrop-blur-lg backdrop-saturate-[150%]',
      'border border-[var(--glass-border)]',
      'rounded-xl',
      // Text
      'text-muted-foreground',
      // Shadow
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.05)]',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Layout
      'inline-flex items-center justify-center whitespace-nowrap',
      'px-3 py-2 min-h-10 text-sm font-medium',
      'rounded-lg',
      // Transitions
      'ring-offset-background transition-all duration-200',
      // Focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      // Disabled
      'disabled:pointer-events-none disabled:opacity-50',
      // Inactive state - subtle hover
      'hover:text-foreground/80',
      // Active state - Glassmorphic
      'data-[state=active]:bg-[var(--glass-bg-primary)]',
      'data-[state=active]:backdrop-blur-md',
      'data-[state=active]:text-foreground',
      'data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]',
      'data-[state=active]:border data-[state=active]:border-[var(--glass-border)]',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }


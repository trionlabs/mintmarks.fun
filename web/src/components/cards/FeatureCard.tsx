/**
 * FeatureCard - Reusable feature card component
 * 
 * Used in: Home.tsx, ComponentShowcase.tsx
 * Styles from: glassmorphism.css (.feature-card, .glass-icon-box)
 */

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FeatureCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Card title */
  title: string
  /** Card description */
  description: string
  /** Additional className for the card */
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn('feature-card p-6', className)}>
      <div className="glass-icon-box">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="glass-text-primary font-semibold mb-2">
        {title}
      </h3>
      <p className="glass-text-secondary text-sm">
        {description}
      </p>
    </div>
  )
}

export default FeatureCard

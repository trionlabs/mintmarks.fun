/**
 * StatsCard - Reusable stats card component
 * 
 * Used in: MyMarks.tsx, ComponentShowcase.tsx
 * Styles from: glassmorphism.css (.stats-card)
 */

import { cn } from '@/lib/utils'

export interface StatsCardProps {
  /** Label text (e.g., "Total Marks") */
  label: string
  /** Main value to display */
  value: string | number
  /** Optional subtitle (e.g., "12 marks") */
  subtitle?: string
  /** Additional className */
  className?: string
}

export function StatsCard({
  label,
  value,
  subtitle,
  className,
}: StatsCardProps) {
  return (
    <div className={cn('stats-card p-4 sm:p-5 md:p-6 min-w-[110px] sm:min-w-[120px]', className)}>
      <div className="text-center">
        <p className="text-[10px] sm:text-xs mb-1.5 sm:mb-2 font-medium uppercase tracking-wider glass-text-muted">
          {label}
        </p>
        <p className={cn(
          'font-bold glass-text-primary',
          typeof value === 'number' || !isNaN(Number(value))
            ? 'text-2xl sm:text-3xl'
            : 'text-base sm:text-lg leading-tight'
        )}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] sm:text-xs mt-1 glass-text-muted">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

/** Stats Cards Container - Groups multiple StatsCards */
export interface StatsCardsProps {
  stats: {
    total: number
    thisMonth?: number
    mostActiveMonth?: string | null
    mostActiveCount?: number
  }
  /** Show all stats or just total */
  showAll?: boolean
  /** Additional className for container */
  className?: string
}

export function StatsCards({ stats, showAll = true, className }: StatsCardsProps) {
  return (
    <div className={cn('flex flex-row gap-2.5 sm:gap-3', className)}>
      <StatsCard
        label={showAll ? 'Total Marks' : 'Total Marks Created'}
        value={stats.total}
      />

      {showAll && stats.thisMonth !== undefined && (
        <StatsCard
          label="This Month"
          value={stats.thisMonth}
        />
      )}

      {showAll && stats.mostActiveMonth && (
        <StatsCard
          label="Most Active"
          value={stats.mostActiveMonth}
          subtitle={stats.mostActiveCount ? `${stats.mostActiveCount} mark${stats.mostActiveCount !== 1 ? 's' : ''}` : undefined}
          className="min-w-[130px] sm:min-w-[140px]"
        />
      )}
    </div>
  )
}

export default StatsCard


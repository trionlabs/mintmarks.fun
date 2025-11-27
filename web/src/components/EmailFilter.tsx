/**
 * EmailFilter Component
 *
 * Minimal, fast filter UI with micro-interactions.
 * - Single row of source pills with smooth transitions
 * - Click source to toggle selection
 * - Click chevron (when selected) to open status dropdown
 * - Uses CSS variables for light/dark mode consistency
 */

import { useCallback, useMemo, useState } from 'react'
import {
  EMAIL_FILTER_CATEGORIES,
  getStatusLabelForSource,
} from '@/config/emailFilters'
import type { EmailSource } from '@/types/gmail'
import type { ActiveFilters, RegistrationStatus } from '@/types/filters'
import { X, Check, ChevronDown } from 'lucide-react'

// ============================================
// Types
// ============================================

interface EmailFilterProps {
  filters: ActiveFilters
  onToggleSource: (source: EmailSource) => void
  onToggleStatus: (status: RegistrationStatus) => void
  onClearFilters: () => void
  onClearStatuses: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
  disabled?: boolean
}

// ============================================
// Minimal Source Pill
// ============================================

interface SourcePillProps {
  label: string
  isSelected: boolean
  isExpanded: boolean
  onToggle: () => void
  onExpandToggle: () => void
  onClearStatuses: () => void
  disabled?: boolean
  statuses: { id: RegistrationStatus; label: string }[]
  selectedStatuses: RegistrationStatus[]
  onToggleStatus: (status: RegistrationStatus) => void
}

function SourcePill({
  label,
  isSelected,
  isExpanded,
  onToggle,
  onExpandToggle,
  onClearStatuses,
  disabled,
  statuses,
  selectedStatuses,
  onToggleStatus,
}: SourcePillProps) {
  return (
    <div className="relative">
      <div className="flex items-center">
        {/* Main pill - toggles selection */}
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`
            relative px-3 py-1.5 text-sm font-medium
            transition-all duration-200 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1
            ${isSelected 
              ? 'bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]' 
              : 'bg-transparent text-[var(--page-text-secondary)] hover:text-[var(--page-text-primary)] hover:bg-[var(--glass-bg-tertiary)]'
            }
            ${isSelected ? 'rounded-l-full' : 'rounded-full'}
            active:scale-95
          `}
        >
          {label}
        </button>

        {/* Chevron button - only shows when selected, opens dropdown */}
        {isSelected && (
          <button
            type="button"
            onClick={onExpandToggle}
            disabled={disabled}
            className={`
              px-1.5 py-1.5 rounded-r-full text-sm
              bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]
              transition-all duration-200 ease-out
              hover:bg-[var(--Controls-Idle)] hover:opacity-80
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
              active:scale-95
            `}
            aria-label="Toggle status filter"
          >
            <ChevronDown 
              className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Status Dropdown */}
      {isSelected && isExpanded && (
        <div 
          className={`
            absolute top-full left-0 mt-2 z-10
            flex flex-col gap-1 p-1.5 rounded-lg min-w-[120px]
            bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]
            shadow-lg backdrop-blur-md
            animate-in fade-in slide-in-from-top-1 duration-150
          `}
        >
          {/* All option - shows all emails from this source */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClearStatuses()
            }}
            className={`
              px-2.5 py-1.5 rounded-md text-xs font-medium text-left
              transition-all duration-150
              ${selectedStatuses.length === 0 
                ? 'bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]' 
                : 'text-[var(--page-text-secondary)] hover:bg-[var(--glass-bg-tertiary)] hover:text-[var(--page-text-primary)]'
              }
              active:scale-95
            `}
          >
            <span className="flex items-center justify-between gap-2">
              All
              {selectedStatuses.length === 0 && <Check className="h-3 w-3" />}
            </span>
          </button>

          {/* Divider */}
          <div className="h-px my-0.5 bg-[var(--glass-border)]" />

          {/* Status options */}
          {statuses.map((status) => {
            const isStatusSelected = selectedStatuses.includes(status.id)
            return (
              <button
                key={status.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStatus(status.id)
                }}
                className={`
                  px-2.5 py-1.5 rounded-md text-xs font-medium text-left
                  transition-all duration-150
                  ${isStatusSelected 
                    ? 'bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]' 
                    : 'text-[var(--page-text-secondary)] hover:bg-[var(--glass-bg-tertiary)] hover:text-[var(--page-text-primary)]'
                  }
                  active:scale-95
                `}
              >
                <span className="flex items-center justify-between gap-2">
                  {status.label}
                  {isStatusSelected && <Check className="h-3 w-3" />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function EmailFilter({
  filters,
  onToggleSource,
  onToggleStatus,
  onClearFilters,
  onClearStatuses,
  hasActiveFilters,
  activeFilterCount,
  disabled = false,
}: EmailFilterProps) {
  const [expandedSource, setExpandedSource] = useState<EmailSource | null>(null)

  // Get selected categories
  const activeCategories = useMemo(() => {
    return EMAIL_FILTER_CATEGORIES.filter((cat) => filters.sources.includes(cat.id))
  }, [filters.sources])

  // Handle source toggle (select/unselect)
  const handleToggleSource = useCallback((source: EmailSource) => {
    onToggleSource(source)
    // Close dropdown when toggling
    setExpandedSource(null)
  }, [onToggleSource])

  // Handle expand toggle (open/close dropdown)
  const handleExpandToggle = useCallback((source: EmailSource) => {
    setExpandedSource(prev => prev === source ? null : source)
  }, [])

  // Close dropdown when clicking outside
  const handleContainerClick = useCallback(() => {
    if (expandedSource) {
      setExpandedSource(null)
    }
  }, [expandedSource])

  return (
    <div 
      className="flex items-center gap-2 flex-wrap"
      onClick={handleContainerClick}
    >
      {/* All Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClearFilters()
          setExpandedSource(null)
        }}
        disabled={disabled}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1
          ${!hasActiveFilters 
            ? 'bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]' 
            : 'bg-transparent text-[var(--page-text-secondary)] hover:text-[var(--page-text-primary)] hover:bg-[var(--glass-bg-tertiary)]'
          }
          active:scale-95
        `}
      >
        All
      </button>

      {/* Divider */}
      <div className="w-px h-5 mx-0.5 bg-[var(--glass-border)]" />

      {/* Source Pills */}
      {EMAIL_FILTER_CATEGORIES.map((category) => {
        const isSelected = filters.sources.includes(category.id)
        const isExpanded = expandedSource === category.id
        const statuses = category.subcategories.map(sub => ({
          id: sub.id,
          label: getStatusLabelForSource(sub.id, category.id)
        }))

        return (
          <div key={category.id} onClick={(e) => e.stopPropagation()}>
            <SourcePill
              label={category.label}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggle={() => handleToggleSource(category.id)}
              onExpandToggle={() => handleExpandToggle(category.id)}
              onClearStatuses={onClearStatuses}
              disabled={disabled}
              statuses={statuses}
              selectedStatuses={filters.statuses}
              onToggleStatus={onToggleStatus}
            />
          </div>
        )
      })}

      {/* Active Status Pills (inline) */}
      {filters.statuses.length > 0 && activeCategories.length > 0 && (
        <>
          <div className="w-px h-5 mx-0.5 bg-[var(--glass-border)]" />
          
          {filters.statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus(status)
              }}
              disabled={disabled}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]
                transition-all duration-150
                hover:opacity-80 active:scale-95
              `}
            >
              {getStatusLabelForSource(status, activeCategories[0]?.id ?? 'luma')}
              <X className="h-3 w-3" />
            </button>
          ))}
        </>
      )}

      {/* Clear All (minimal) */}
      {hasActiveFilters && activeFilterCount > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClearFilters()
            setExpandedSource(null)
          }}
          disabled={disabled}
          className={`
            p-1.5 rounded-full text-[var(--page-text-muted)]
            transition-all duration-150
            hover:bg-[var(--glass-bg-tertiary)] hover:text-[var(--page-text-primary)]
            active:scale-95
          `}
          title="Clear all filters"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ============================================
// Compact Filter Pills (for compatibility)
// ============================================

interface FilterPillsProps {
  filters: ActiveFilters
  onToggleSource: (source: EmailSource) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  disabled?: boolean
}

export function FilterPills({
  filters,
  onToggleSource,
  onClearFilters,
  hasActiveFilters,
  disabled = false,
}: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {EMAIL_FILTER_CATEGORIES.map((category) => {
        const isSelected = filters.sources.includes(category.id)
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggleSource(category.id)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${isSelected 
                ? 'bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]' 
                : 'bg-[var(--glass-bg-tertiary)] text-[var(--page-text-secondary)] border border-[var(--glass-border)]'
              }
              active:scale-95
            `}
          >
            {category.label}
          </button>
        )
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          disabled={disabled}
          className="p-1.5 rounded-full text-[var(--page-text-muted)] hover:bg-[var(--glass-bg-tertiary)] transition-all active:scale-95"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ============================================
// Status Badge (for email cards)
// ============================================

interface StatusBadgeProps {
  status: RegistrationStatus
  source: EmailSource
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, source, size = 'sm' }: StatusBadgeProps) {
  if (status === 'unknown') return null

  const label = getStatusLabelForSource(status, source)
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        bg-[var(--Controls-Idle)] text-[var(--Controls-Selected)]
        ${sizeClasses}
      `}
    >
      {label}
    </span>
  )
}

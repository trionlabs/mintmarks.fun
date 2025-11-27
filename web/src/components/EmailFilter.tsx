/**
 * EmailFilter Component
 *
 * Modular filter UI with collapsible categories and subcategories.
 * Supports source filtering (Luma, Substack, Eventbrite) and status filtering.
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EMAIL_FILTER_CATEGORIES, getFilterSummary, SOURCE_COLORS } from '@/config/emailFilters'
import type { EmailSource } from '@/types/gmail'
import type { ActiveFilters, RegistrationStatus } from '@/types/filters'
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Calendar,
  Mail,
  Ticket,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface EmailFilterProps {
  filters: ActiveFilters
  onToggleSource: (source: EmailSource) => void
  onToggleStatus: (status: RegistrationStatus) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
  disabled?: boolean
}

// ============================================
// Source Icons
// ============================================

const SOURCE_ICONS: Record<EmailSource, React.ReactNode> = {
  luma: <Calendar className="h-4 w-4" />,
  substack: <Mail className="h-4 w-4" />,
  eventbrite: <Ticket className="h-4 w-4" />,
  unknown: <Mail className="h-4 w-4" />,
}

// ============================================
// Component
// ============================================

export function EmailFilter({
  filters,
  onToggleSource,
  onToggleStatus,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  disabled = false,
}: EmailFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  // Check if source is selected
  const isSourceSelected = (source: EmailSource) => filters.sources.includes(source)

  // Check if status is selected
  const isStatusSelected = (status: RegistrationStatus) => filters.statuses.includes(status)

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
      }}
    >
      {/* Filter Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls="email-filter-content"
        className="w-full flex items-center justify-between p-3 sm:p-4 transition-colors hover:bg-[var(--glass-bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: 'var(--Controls-Selected)' }} />
          <span
            className="font-medium text-sm sm:text-base"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Filters
          </span>
          {hasActiveFilters && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: 'var(--Controls-Idle)',
                color: 'var(--Controls-Selected)',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span
              className="text-xs sm:text-sm hidden sm:block"
              style={{ color: 'var(--page-text-secondary)' }}
            >
              {getFilterSummary(filters)}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" style={{ color: 'var(--page-text-secondary)' }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--page-text-secondary)' }} />
          )}
        </div>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div
          id="email-filter-content"
          className="border-t p-3 sm:p-4 space-y-4"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                disabled={disabled}
                className="gap-1.5 text-xs"
              >
                <X className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          )}

          {/* Source Categories */}
          <div className="space-y-2">
            <h4
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--page-text-muted)' }}
            >
              Sources
            </h4>

            <div className="flex flex-wrap gap-2">
              {EMAIL_FILTER_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onToggleSource(category.id)}
                  disabled={disabled}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isSourceSelected(category.id)
                      ? SOURCE_COLORS[category.id].bg
                      : 'var(--glass-bg-tertiary)',
                    border: `1px solid ${
                      isSourceSelected(category.id)
                        ? SOURCE_COLORS[category.id].border
                        : 'var(--glass-border)'
                    }`,
                    color: isSourceSelected(category.id)
                      ? SOURCE_COLORS[category.id].text
                      : 'var(--page-text-secondary)',
                  }}
                >
                  {SOURCE_ICONS[category.id]}
                  {category.label}
                  {isSourceSelected(category.id) && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status Subcategories */}
          {EMAIL_FILTER_CATEGORIES.map((category) => {
            const isSelected = isSourceSelected(category.id)
            const isCategoryExpanded = expandedCategories.has(category.id)

            // Only show subcategories if source is selected or no sources selected
            if (filters.sources.length > 0 && !isSelected) return null

            return (
              <div key={`${category.id}-status`} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider w-full"
                  style={{ color: 'var(--page-text-muted)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: SOURCE_COLORS[category.id].text }}
                  />
                  {category.label} Status
                  {isCategoryExpanded ? (
                    <ChevronUp className="h-3 w-3 ml-auto" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  )}
                </button>

                {isCategoryExpanded && (
                  <div className="flex flex-wrap gap-2 pl-4">
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={`${category.id}-${subcategory.id}`}
                        type="button"
                        onClick={() => onToggleStatus(subcategory.id)}
                        disabled={disabled}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: isStatusSelected(subcategory.id)
                            ? 'var(--Controls-Idle)'
                            : 'transparent',
                          border: `1px solid ${
                            isStatusSelected(subcategory.id)
                              ? 'var(--Controls-Selected)'
                              : 'var(--glass-border)'
                          }`,
                          color: isStatusSelected(subcategory.id)
                            ? 'var(--Controls-Selected)'
                            : 'var(--page-text-secondary)',
                        }}
                      >
                        {subcategory.label}
                        {isStatusSelected(subcategory.id) && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// Compact Filter Pills (Alternative UI)
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
      {/* Source Pills */}
      {EMAIL_FILTER_CATEGORIES.map((category) => {
        const isSelected = filters.sources.includes(category.id)
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggleSource(category.id)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isSelected ? SOURCE_COLORS[category.id].bg : 'var(--glass-bg-tertiary)',
              border: `1px solid ${
                isSelected ? SOURCE_COLORS[category.id].border : 'var(--glass-border)'
              }`,
              color: isSelected ? SOURCE_COLORS[category.id].text : 'var(--page-text-secondary)',
            }}
          >
            {SOURCE_ICONS[category.id]}
            {category.label}
          </button>
        )
      })}

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={disabled}
          className="gap-1 text-xs h-7"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}


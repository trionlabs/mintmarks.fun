/**
 * useFilterParams Hook
 *
 * Syncs email filters with URL search params for persistence and shareability.
 * URL format: ?source=luma,substack&status=confirmed,pending
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EmailSource } from '@/types/gmail'
import type { ActiveFilters, RegistrationStatus } from '@/types/filters'
import { getAvailableSources, getAvailableStatuses } from '@/config/emailFilters'

// ============================================
// URL Param Keys
// ============================================

const PARAM_SOURCE = 'source'
const PARAM_STATUS = 'status'

// ============================================
// Hook
// ============================================

interface UseFilterParamsReturn {
  /** Current active filters */
  filters: ActiveFilters
  /** Update all filters at once */
  setFilters: (filters: ActiveFilters) => void
  /** Toggle a single source on/off */
  toggleSource: (source: EmailSource) => void
  /** Toggle a single status on/off */
  toggleStatus: (status: RegistrationStatus) => void
  /** Clear all filters */
  clearFilters: () => void
  /** Clear only statuses (keep sources) */
  clearStatuses: () => void
  /** Check if any filters are active */
  hasActiveFilters: boolean
  /** Number of active filters */
  activeFilterCount: number
}

/**
 * Hook to manage email filters with URL persistence
 */
export function useFilterParams(): UseFilterParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse filters from URL
  const filters = useMemo<ActiveFilters>(() => {
    const sourceParam = searchParams.get(PARAM_SOURCE)
    const statusParam = searchParams.get(PARAM_STATUS)

    const availableSources = getAvailableSources()
    const availableStatuses = getAvailableStatuses()

    // Parse and validate sources
    const sources = sourceParam
      ? sourceParam
          .split(',')
          .filter((s): s is EmailSource => availableSources.includes(s as EmailSource))
      : []

    // Parse and validate statuses
    const statuses = statusParam
      ? statusParam
          .split(',')
          .filter((s): s is RegistrationStatus =>
            availableStatuses.includes(s as RegistrationStatus)
          )
      : []

    return { sources, statuses }
  }, [searchParams])

  // Update URL params
  const updateParams = useCallback(
    (newFilters: ActiveFilters) => {
      const params = new URLSearchParams(searchParams)

      // Update source param
      if (newFilters.sources.length > 0) {
        params.set(PARAM_SOURCE, newFilters.sources.join(','))
      } else {
        params.delete(PARAM_SOURCE)
      }

      // Update status param
      if (newFilters.statuses.length > 0) {
        params.set(PARAM_STATUS, newFilters.statuses.join(','))
      } else {
        params.delete(PARAM_STATUS)
      }

      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // Set all filters
  const setFilters = useCallback(
    (newFilters: ActiveFilters) => {
      updateParams(newFilters)
    },
    [updateParams]
  )

  // Toggle source
  // When selecting Luma, auto-select "attended" status by default
  const toggleSource = useCallback(
    (source: EmailSource) => {
      const isRemoving = filters.sources.includes(source)
      const newSources = isRemoving
        ? filters.sources.filter((s) => s !== source)
        : [...filters.sources, source]

      // Auto-select "attended" when adding Luma (if no status selected)
      let newStatuses = filters.statuses
      if (!isRemoving && source === 'luma' && filters.statuses.length === 0) {
        newStatuses = ['attended']
      }

      updateParams({ sources: newSources, statuses: newStatuses })
    },
    [filters, updateParams]
  )

  // Toggle status
  const toggleStatus = useCallback(
    (status: RegistrationStatus) => {
      const newStatuses = filters.statuses.includes(status)
        ? filters.statuses.filter((s) => s !== status)
        : [...filters.statuses, status]

      updateParams({ ...filters, statuses: newStatuses })
    },
    [filters, updateParams]
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    updateParams({ sources: [], statuses: [] })
  }, [updateParams])

  // Clear only statuses (keep sources)
  const clearStatuses = useCallback(() => {
    updateParams({ ...filters, statuses: [] })
  }, [filters, updateParams])

  // Computed values
  const hasActiveFilters = filters.sources.length > 0 || filters.statuses.length > 0
  const activeFilterCount = filters.sources.length + filters.statuses.length

  return {
    filters,
    setFilters,
    toggleSource,
    toggleStatus,
    clearFilters,
    clearStatuses,
    hasActiveFilters,
    activeFilterCount,
  }
}


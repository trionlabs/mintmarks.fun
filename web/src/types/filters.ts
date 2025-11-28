/**
 * Email Filter System Types
 *
 * Types for the modular email filtering system with server-side Gmail queries.
 */

import type { EmailSource } from './gmail'

// ============================================
// Registration Status
// ============================================

/**
 * Registration status detected from email content
 */
export type RegistrationStatus = 'confirmed' | 'pending' | 'attended' | 'unknown'

/**
 * Registration status configuration
 */
export interface RegistrationStatusConfig {
  id: RegistrationStatus
  label: string
  keywords: string[]
  gmailKeywords: string[] // Keywords for Gmail query
}

// ============================================
// Filter Categories
// ============================================

/**
 * Subcategory within a filter category
 */
export interface FilterSubcategory {
  id: RegistrationStatus
  label: string
  keywords: string[] // Keywords to detect status from email content
  gmailKeywords: string[] // Keywords for Gmail API query
}

/**
 * Main filter category (email source)
 */
export interface FilterCategory {
  id: EmailSource
  label: string
  gmailQuery: string // Base Gmail query for this source
  subcategories: FilterSubcategory[]
}

// ============================================
// Active Filters State
// ============================================

/**
 * Currently active filters
 */
export interface ActiveFilters {
  sources: EmailSource[]
  statuses: RegistrationStatus[]
}

/**
 * Default filters (all sources, all statuses)
 */
export const DEFAULT_FILTERS: ActiveFilters = {
  sources: [],
  statuses: [],
}

// ============================================
// Filter Change Events
// ============================================

/**
 * Filter change handler type
 */
export type OnFilterChange = (filters: ActiveFilters) => void

/**
 * Filter toggle handler type
 */
export type OnToggleSource = (source: EmailSource) => void
export type OnToggleStatus = (status: RegistrationStatus) => void

// ============================================
// URL Params
// ============================================

/**
 * URL search params for filters
 */
export interface FilterUrlParams {
  source?: string // Comma-separated sources: "luma,substack"
  status?: string // Comma-separated statuses: "confirmed,pending"
}

/**
 * Parse URL params to ActiveFilters
 */
export function parseFilterParams(params: URLSearchParams): ActiveFilters {
  const sourceParam = params.get('source')
  const statusParam = params.get('status')

  const sources = sourceParam
    ? (sourceParam.split(',').filter(Boolean) as EmailSource[])
    : []

  const statuses = statusParam
    ? (statusParam.split(',').filter(Boolean) as RegistrationStatus[])
    : []

  return { sources, statuses }
}

/**
 * Serialize ActiveFilters to URL params
 */
export function serializeFilterParams(filters: ActiveFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.sources.length > 0) {
    params.set('source', filters.sources.join(','))
  }

  if (filters.statuses.length > 0) {
    params.set('status', filters.statuses.join(','))
  }

  return params
}

/**
 * Check if filters are empty (default state)
 */
export function isFiltersEmpty(filters: ActiveFilters): boolean {
  return filters.sources.length === 0 && filters.statuses.length === 0
}


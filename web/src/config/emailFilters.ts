/**
 * Email Filter Configuration
 *
 * Defines filter categories, subcategories, and Gmail query building logic.
 */

import type { EmailSource } from '@/types/gmail'
import type {
  FilterCategory,
  FilterSubcategory,
  ActiveFilters,
  RegistrationStatus,
} from '@/types/filters'

// ============================================
// Color Configurations (Shared)
// ============================================

/**
 * Source-specific colors for badges and icons
 * Note: Using rgba for consistency across light/dark modes
 */
export const SOURCE_COLORS: Record<EmailSource, { bg: string; text: string; border: string }> = {
  luma: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#8B5CF6',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  substack: {
    bg: 'rgba(249, 115, 22, 0.15)',
    text: '#F97316',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  eventbrite: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#EF4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  unknown: {
    bg: 'var(--glass-bg-secondary)',
    text: 'var(--page-text-secondary)',
    border: 'var(--border)',
  },
}

/**
 * Registration status colors for badges
 */
export const STATUS_COLORS: Record<RegistrationStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  pending: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  unknown: { bg: 'var(--glass-bg-secondary)', text: 'var(--page-text-secondary)' },
}

// ============================================
// Subcategory Definitions
// ============================================

/**
 * Common registration status subcategories
 */
const REGISTRATION_SUBCATEGORIES: FilterSubcategory[] = [
  {
    id: 'confirmed',
    label: 'Confirmed',
    keywords: ['confirmed', 'registered', "you're in", 'registration confirmed'],
    gmailKeywords: ['confirmed', 'registered'],
  },
  {
    id: 'pending',
    label: 'Pending',
    keywords: ['pending', 'waitlist', 'waiting list', 'on the waitlist'],
    gmailKeywords: ['pending', 'waitlist'],
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    keywords: ['cancelled', 'canceled', 'cancellation'],
    gmailKeywords: ['cancelled', 'canceled'],
  },
]

// ============================================
// Filter Categories
// ============================================

/**
 * Email filter categories configuration
 */
export const EMAIL_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'luma',
    label: 'Luma',
    gmailQuery: 'from:(lu.ma OR luma.co OR luma-mail.com)',
    subcategories: REGISTRATION_SUBCATEGORIES,
  },
  {
    id: 'substack',
    label: 'Substack',
    gmailQuery: 'from:substack.com',
    subcategories: [
      {
        id: 'confirmed',
        label: 'Subscribed',
        keywords: ['subscribed', 'welcome', 'thanks for subscribing'],
        gmailKeywords: ['subscribed', 'welcome'],
      },
      {
        id: 'pending',
        label: 'Pending',
        keywords: ['confirm', 'verify', 'pending'],
        gmailKeywords: ['confirm', 'verify'],
      },
      {
        id: 'cancelled',
        label: 'Unsubscribed',
        keywords: ['unsubscribed', 'removed'],
        gmailKeywords: ['unsubscribed'],
      },
    ],
  },
  {
    id: 'eventbrite',
    label: 'Eventbrite',
    gmailQuery: 'from:eventbrite.com',
    subcategories: REGISTRATION_SUBCATEGORIES,
  },
]

/**
 * Get all available sources
 */
export function getAvailableSources(): EmailSource[] {
  return EMAIL_FILTER_CATEGORIES.map((cat) => cat.id)
}

/**
 * Get all available statuses
 */
export function getAvailableStatuses(): RegistrationStatus[] {
  return ['confirmed', 'pending', 'cancelled']
}

/**
 * Get category by source ID
 */
export function getCategoryBySource(source: EmailSource): FilterCategory | undefined {
  return EMAIL_FILTER_CATEGORIES.find((cat) => cat.id === source)
}

// ============================================
// Gmail Query Builder
// ============================================

/**
 * Build Gmail API query from active filters
 *
 * Examples:
 * - No filters: 'from:(lu.ma OR luma.co OR substack.com OR eventbrite.com)'
 * - Luma only: 'from:(lu.ma OR luma.co OR luma-mail.com)'
 * - Luma + Confirmed: 'from:(lu.ma OR luma.co OR luma-mail.com) (confirmed OR registered)'
 */
export function buildGmailQuery(filters: ActiveFilters): string {
  const { sources, statuses } = filters

  // If no sources selected, search all sources
  const selectedCategories =
    sources.length > 0
      ? EMAIL_FILTER_CATEGORIES.filter((cat) => sources.includes(cat.id))
      : EMAIL_FILTER_CATEGORIES

  // Build source query
  const sourceQueries = selectedCategories.map((cat) => cat.gmailQuery)

  // Combine source queries with OR
  // Extract just the from parts and combine them
  const fromParts = sourceQueries
    .map((q) => {
      // Extract content from 'from:(...)' or 'from:...'
      const match = q.match(/from:\(?([^)]+)\)?/)
      return match ? match[1] : q.replace('from:', '')
    })
    .join(' OR ')

  let query = `from:(${fromParts})`

  // Add status keywords if selected
  if (statuses.length > 0) {
    const statusKeywords: string[] = []

    for (const status of statuses) {
      for (const category of selectedCategories) {
        const subcategory = category.subcategories.find((sub) => sub.id === status)
        if (subcategory) {
          statusKeywords.push(...subcategory.gmailKeywords)
        }
      }
    }

    // Remove duplicates
    const uniqueKeywords = [...new Set(statusKeywords)]

    if (uniqueKeywords.length > 0) {
      query += ` (${uniqueKeywords.join(' OR ')})`
    }
  }

  return query
}

/**
 * Get default Gmail query (all sources, no status filter)
 */
export function getDefaultGmailQuery(): string {
  return buildGmailQuery({ sources: [], statuses: [] })
}

// ============================================
// Status Detection
// ============================================

/**
 * Detect registration status from email subject and snippet
 */
export function detectRegistrationStatus(
  subject: string | null,
  snippet: string,
  source: EmailSource
): RegistrationStatus {
  const text = `${subject ?? ''} ${snippet}`.toLowerCase()

  const category = getCategoryBySource(source)
  if (!category) return 'unknown'

  // Check each subcategory's keywords
  for (const subcategory of category.subcategories) {
    for (const keyword of subcategory.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return subcategory.id
      }
    }
  }

  return 'unknown'
}

// ============================================
// Filter Helpers
// ============================================

/**
 * Get human-readable filter summary
 */
export function getFilterSummary(filters: ActiveFilters): string {
  const parts: string[] = []

  if (filters.sources.length > 0) {
    const sourceLabels = filters.sources
      .map((s) => getCategoryBySource(s)?.label ?? s)
      .join(', ')
    parts.push(sourceLabels)
  }

  if (filters.statuses.length > 0) {
    const statusLabels = filters.statuses
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(', ')
    parts.push(statusLabels)
  }

  return parts.length > 0 ? parts.join(' • ') : 'All Emails'
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: ActiveFilters): number {
  return filters.sources.length + filters.statuses.length
}


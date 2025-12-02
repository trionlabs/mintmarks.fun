/**
 * Email Filter Configuration
 *
 * Defines filter categories, subcategories, and Gmail query building logic.
 * Sources: Luma, Substack, Eventbrite, Amazon
 * Statuses: Confirmed, Pending, Attended (no cancelled)
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
 * Uses CSS variables defined in index.css for theme consistency
 */
export const SOURCE_COLORS: Record<EmailSource, { bg: string; text: string; border: string }> = {
  luma: {
    bg: 'var(--source-luma-bg)',
    text: 'var(--source-luma)',
    border: 'var(--source-luma-border)',
  },
  substack: {
    bg: 'var(--source-substack-bg)',
    text: 'var(--source-substack)',
    border: 'var(--source-substack-border)',
  },
  eventbrite: {
    bg: 'var(--source-eventbrite-bg)',
    text: 'var(--source-eventbrite)',
    border: 'var(--source-eventbrite-border)',
  },
  amazon: {
    bg: 'var(--source-amazon-bg)',
    text: 'var(--source-amazon)',
    border: 'var(--source-amazon-border)',
  },
  unknown: {
    bg: 'var(--glass-bg-secondary)',
    text: 'var(--page-text-secondary)',
    border: 'var(--glass-border)',
  },
}

/**
 * Registration status colors for badges
 * Uses CSS variables defined in index.css for theme consistency
 */
export const STATUS_COLORS: Record<RegistrationStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'var(--status-confirmed-bg)', text: 'var(--status-confirmed)' },
  pending: { bg: 'var(--status-pending-bg)', text: 'var(--status-pending)' },
  attended: { bg: 'var(--status-attended-bg)', text: 'var(--status-attended)' },
  unknown: { bg: 'var(--glass-bg-secondary)', text: 'var(--page-text-secondary)' },
}

// ============================================
// Subcategory Definitions
// ============================================

/**
 * Luma event status subcategories
 */
const LUMA_SUBCATEGORIES: FilterSubcategory[] = [
  {
    id: 'confirmed',
    label: 'Registered',
    keywords: ['confirmed', 'registered', "you're in", 'registration confirmed', 'you are registered'],
    gmailKeywords: ['confirmed', 'registered'],
  },
  {
    id: 'pending',
    label: 'Waitlist',
    keywords: ['pending', 'waitlist', 'waiting list', 'on the waitlist'],
    gmailKeywords: ['waitlist', 'waiting'],
  },
  {
    id: 'attended',
    label: 'Attended',
    keywords: ['thanks for joining', 'thank for joining'],
    gmailKeywords: ['thanks for joining', 'thank for joining'],
  },
]

/**
 * Substack subscription status subcategories
 */
const SUBSTACK_SUBCATEGORIES: FilterSubcategory[] = [
  {
    id: 'confirmed',
    label: 'Subscribed',
    keywords: ['subscribed', 'welcome', 'thanks for subscribing', 'subscription confirmed'],
    gmailKeywords: ['subscribed', 'welcome'],
  },
  {
    id: 'pending',
    label: 'Confirm Email',
    keywords: ['confirm your email', 'verify', 'confirm subscription'],
    gmailKeywords: ['confirm', 'verify'],
  },
]

/**
 * Eventbrite event status subcategories
 */
const EVENTBRITE_SUBCATEGORIES: FilterSubcategory[] = [
  {
    id: 'confirmed',
    label: 'Registered',
    keywords: ['confirmed', 'registered', 'your ticket', 'order confirmed'],
    gmailKeywords: ['confirmed', 'registered', 'ticket'],
  },
  {
    id: 'pending',
    label: 'Pending',
    keywords: ['pending', 'processing'],
    gmailKeywords: ['pending'],
  },
  {
    id: 'attended',
    label: 'Attended',
    keywords: ['thanks for joining', 'thank for joining'],
    gmailKeywords: ['thanks for joining', 'thank for joining'],
  },
]

/**
 * Amazon order status subcategories
 */
const AMAZON_SUBCATEGORIES: FilterSubcategory[] = [
  {
    id: 'confirmed',
    label: 'Order Placed',
    keywords: ['order confirmed', 'order placed', 'thank you for your order'],
    gmailKeywords: ['order confirmed', 'order placed'],
  },
  {
    id: 'pending',
    label: 'Shipped',
    keywords: ['shipped', 'on the way', 'out for delivery'],
    gmailKeywords: ['shipped', 'on the way'],
  },
  {
    id: 'attended',
    label: 'Delivered',
    keywords: ['delivered', 'was delivered', 'has been delivered'],
    gmailKeywords: ['delivered'],
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
    subcategories: LUMA_SUBCATEGORIES,
  },
  {
    id: 'substack',
    label: 'Substack',
    gmailQuery: 'from:substack.com',
    subcategories: SUBSTACK_SUBCATEGORIES,
  },
  {
    id: 'eventbrite',
    label: 'Eventbrite',
    gmailQuery: 'from:eventbrite.com',
    subcategories: EVENTBRITE_SUBCATEGORIES,
  },
  {
    id: 'amazon',
    label: 'Amazon',
    gmailQuery: 'from:(amazon.com OR amazon.co)',
    subcategories: AMAZON_SUBCATEGORIES,
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
  return ['confirmed', 'pending', 'attended']
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
 * - No filters: 'from:(lu.ma OR luma.co OR substack.com OR eventbrite.com OR amazon.com)'
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
  const fromParts = sourceQueries
    .map((q) => {
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
 * Detect registration status from email subject only
 */
export function detectRegistrationStatus(
  subject: string | null,
  _snippet: string,
  source: EmailSource
): RegistrationStatus {
  // Only check subject, ignore snippet to avoid false positives from email body
  const text = (subject ?? '').toLowerCase()

  const category = getCategoryBySource(source)
  if (!category) return 'unknown'

  // Check each subcategory's keywords (order matters - attended should be checked before confirmed)
  // Reverse order to prioritize more specific statuses
  const orderedSubcategories = [...category.subcategories].reverse()

  for (const subcategory of orderedSubcategories) {
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

/**
 * Get status label for a specific source
 */
export function getStatusLabelForSource(status: RegistrationStatus, source: EmailSource): string {
  const category = getCategoryBySource(source)
  if (!category) return status.charAt(0).toUpperCase() + status.slice(1)

  const subcategory = category.subcategories.find((sub) => sub.id === status)
  return subcategory?.label ?? status.charAt(0).toUpperCase() + status.slice(1)
}

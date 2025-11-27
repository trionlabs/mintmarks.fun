/**
 * Gmail API TypeScript Definitions
 * 
 * Types for Gmail API responses and internal data structures.
 */

// ============================================
// Gmail API Response Types
// ============================================

/**
 * Gmail message header from API response
 */
export interface GmailHeader {
  name: string
  value: string
}

/**
 * Gmail message payload part
 */
export interface GmailPayloadPart {
  partId: string
  mimeType: string
  filename: string
  headers: GmailHeader[]
  body: {
    size: number
    data?: string
  }
  parts?: GmailPayloadPart[]
}

/**
 * Gmail message payload from API response
 */
export interface GmailPayload {
  partId?: string
  mimeType: string
  filename?: string
  headers: GmailHeader[]
  body: {
    size: number
    data?: string
  }
  parts?: GmailPayloadPart[]
}

/**
 * Gmail message from API response
 */
export interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet: string
  historyId?: string
  internalDate?: string
  payload?: GmailPayload
  sizeEstimate?: number
  raw?: string
}

/**
 * Gmail messages list response
 */
export interface GmailMessagesListResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

// ============================================
// Application Types
// ============================================

/**
 * Parsed email metadata for display
 */
export interface EmailMetadata {
  id: string
  threadId: string
  subject: string | null
  from: string | null
  to: string | null
  date: string | null
  snippet: string
  source: EmailSource
}

/**
 * Email source type (Luma, Substack, etc.)
 */
export type EmailSource = 'luma' | 'substack' | 'eventbrite' | 'unknown'

/**
 * Email search result
 */
export interface EmailSearchResult {
  emails: EmailMetadata[]
  nextPageToken?: string
  totalResults: number
}

/**
 * Raw email data for ZK proof generation
 */
export interface RawEmailData {
  id: string
  raw: string // Base64 encoded RFC 2822 format
  metadata: EmailMetadata
}

// ============================================
// Error Types
// ============================================

/**
 * Gmail API error response
 */
export interface GmailApiError {
  error: {
    code: number
    message: string
    status: string
    errors?: Array<{
      message: string
      domain: string
      reason: string
    }>
  }
}

/**
 * Custom error for Gmail operations
 */
export class GmailError extends Error {
  code: number
  status: string

  constructor(message: string, code: number, status: string) {
    super(message)
    this.name = 'GmailError'
    this.code = code
    this.status = status
  }
}

// ============================================
// Constants
// ============================================

/**
 * Gmail API base URL
 */
export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

/**
 * Email sources configuration
 */
export const EMAIL_SOURCES: Record<EmailSource, { domains: string[]; keywords: string[] }> = {
  luma: {
    domains: ['lu.ma', 'luma.co'],
    keywords: ['registered', 'confirmed', 'rsvp', 'event'],
  },
  substack: {
    domains: ['substack.com'],
    keywords: ['subscribed', 'confirmed', 'welcome'],
  },
  eventbrite: {
    domains: ['eventbrite.com'],
    keywords: ['registered', 'confirmed', 'ticket'],
  },
  unknown: {
    domains: [],
    keywords: [],
  },
}


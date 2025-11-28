/**
 * Gmail API Service
 *
 * Functions for interacting with Gmail API to fetch event emails.
 * Supports dynamic filtering via Gmail queries and registration status detection.
 */

import {
  GMAIL_API_BASE,
  EMAIL_SOURCES,
  GmailError,
  type GmailMessage,
  type GmailMessagesListResponse,
  type GmailApiError,
  type EmailMetadata,
  type EmailSearchResult,
  type EmailSource,
  type RawEmailData,
} from '@/types/gmail'
import type { RegistrationStatus } from '@/types/filters'
import { detectRegistrationStatus as detectStatus } from '@/config/emailFilters'

// ============================================
// Helper Functions
// ============================================

/**
 * Extract header value from Gmail message
 */
function getHeader(message: GmailMessage, headerName: string): string | null {
  const header = message.payload?.headers?.find(
    (h) => h.name.toLowerCase() === headerName.toLowerCase()
  )
  return header?.value ?? null
}

/**
 * Determine email source from sender address
 */
function detectEmailSource(from: string | null): EmailSource {
  if (!from) return 'unknown'

  const fromLower = from.toLowerCase()

  for (const [source, config] of Object.entries(EMAIL_SOURCES)) {
    if (source === 'unknown') continue
    if (config.domains.some((domain) => fromLower.includes(domain))) {
      return source as EmailSource
    }
  }

  return 'unknown'
}

/**
 * Detect registration status from email content
 */
function detectRegistrationStatus(
  subject: string | null,
  snippet: string,
  source: EmailSource
): RegistrationStatus {
  return detectStatus(subject, snippet, source)
}

/**
 * Handle Gmail API errors
 */
async function handleApiError(response: Response): Promise<never> {
  let errorData: GmailApiError | null = null
  
  try {
    errorData = await response.json()
  } catch {
    // Response is not JSON
  }
  
  const message = errorData?.error?.message ?? `HTTP ${response.status}: ${response.statusText}`
  const code = errorData?.error?.code ?? response.status
  const status = errorData?.error?.status ?? 'UNKNOWN'
  
  throw new GmailError(message, code, status)
}

/**
 * Make authenticated request to Gmail API
 */
async function gmailFetch<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GMAIL_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    await handleApiError(response)
  }
  
  return response.json()
}

// ============================================
// Public API Functions
// ============================================

/**
 * Search for emails matching a query
 */
export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<GmailMessagesListResponse> {
  const params = new URLSearchParams({
    q: query,
    maxResults: maxResults.toString(),
  })
  
  if (pageToken) {
    params.set('pageToken', pageToken)
  }
  
  return gmailFetch<GmailMessagesListResponse>(
    accessToken,
    `/messages?${params.toString()}`
  )
}

/**
 * Get email metadata (headers only)
 */
export async function getEmailMetadata(
  accessToken: string,
  messageId: string
): Promise<EmailMetadata> {
  const message = await gmailFetch<GmailMessage>(
    accessToken,
    `/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`
  )

  const from = getHeader(message, 'From')
  const subject = getHeader(message, 'Subject')
  const source = detectEmailSource(from)
  const registrationStatus = detectRegistrationStatus(subject, message.snippet, source)

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to: getHeader(message, 'To'),
    date: getHeader(message, 'Date'),
    snippet: message.snippet,
    source,
    registrationStatus,
  }
}

/**
 * Get raw email content (for ZK proof generation)
 */
export async function getEmailRaw(
  accessToken: string,
  messageId: string
): Promise<RawEmailData> {
  const message = await gmailFetch<GmailMessage>(
    accessToken,
    `/messages/${messageId}?format=raw`
  )
  
  if (!message.raw) {
    throw new GmailError('Raw email data not available', 404, 'NOT_FOUND')
  }
  
  // Get metadata for the same message
  const metadata = await getEmailMetadata(accessToken, messageId)
  
  return {
    id: message.id,
    raw: message.raw,
    metadata,
  }
}

/**
 * Search for Luma event emails
 */
export async function searchLumaEmails(
  accessToken: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<EmailSearchResult> {
  // Search query for Luma emails
  const query = 'from:(lu.ma OR luma.co) (registered OR confirmed OR rsvp)'
  
  const response = await searchEmails(accessToken, query, maxResults, pageToken)
  
  if (!response.messages || response.messages.length === 0) {
    return {
      emails: [],
      nextPageToken: undefined,
      totalResults: 0,
    }
  }
  
  // Fetch metadata for each message
  const emails = await Promise.all(
    response.messages.map((msg) => getEmailMetadata(accessToken, msg.id))
  )
  
  return {
    emails,
    nextPageToken: response.nextPageToken,
    totalResults: response.resultSizeEstimate ?? emails.length,
  }
}

/**
 * Search for Substack emails
 */
export async function searchSubstackEmails(
  accessToken: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<EmailSearchResult> {
  // Search query for Substack emails
  const query = 'from:substack.com (subscribed OR confirmed OR welcome)'
  
  const response = await searchEmails(accessToken, query, maxResults, pageToken)
  
  if (!response.messages || response.messages.length === 0) {
    return {
      emails: [],
      nextPageToken: undefined,
      totalResults: 0,
    }
  }
  
  // Fetch metadata for each message
  const emails = await Promise.all(
    response.messages.map((msg) => getEmailMetadata(accessToken, msg.id))
  )
  
  return {
    emails,
    nextPageToken: response.nextPageToken,
    totalResults: response.resultSizeEstimate ?? emails.length,
  }
}

/**
 * Search for event emails with dynamic query support
 *
 * @param accessToken - Gmail API access token
 * @param query - Gmail search query (use buildGmailQuery from emailFilters.ts)
 * @param maxResults - Maximum number of results per page (default: 20)
 * @param pageToken - Token for pagination
 */
export async function searchEventEmails(
  accessToken: string,
  query: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<EmailSearchResult> {
  const response = await searchEmails(accessToken, query, maxResults, pageToken)

  if (!response.messages || response.messages.length === 0) {
    return {
      emails: [],
      nextPageToken: undefined,
      totalResults: 0,
    }
  }

  // Fetch metadata for each message
  const emails = await Promise.all(
    response.messages.map((msg) => getEmailMetadata(accessToken, msg.id))
  )

  return {
    emails,
    nextPageToken: response.nextPageToken,
    totalResults: response.resultSizeEstimate ?? emails.length,
  }
}

/**
 * Search for all event emails using default query (all sources)
 * Convenience wrapper for searchEventEmails with default filter query
 */
export async function searchAllEventEmails(
  accessToken: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<EmailSearchResult> {
  // Default query: all event sources
  const query = 'from:(lu.ma OR luma.co OR luma-mail.com OR substack.com OR eventbrite.com)'
  return searchEventEmails(accessToken, query, maxResults, pageToken)
}

/**
 * Verify Gmail API access token is valid
 */
export async function verifyToken(accessToken: string): Promise<boolean> {
  try {
    await gmailFetch(accessToken, '/profile')
    return true
  } catch {
    return false
  }
}

/**
 * Get raw email as Uint8Array for ZK proof generation
 * Decodes base64url and converts to buffer
 */
export async function getEmailRawForProof(
  accessToken: string,
  messageId: string
): Promise<{ buffer: Uint8Array; metadata: RawEmailData['metadata'] }> {
  const rawData = await getEmailRaw(accessToken, messageId)
  
  // Decode base64url to string
  // Gmail uses base64url: replace - with +, _ with /
  const base64 = rawData.raw
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  // Decode base64 to binary string
  const binaryString = atob(base64)
  
  // Convert binary string to Uint8Array
  const buffer = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i)
  }
  
  return {
    buffer,
    metadata: rawData.metadata,
  }
}


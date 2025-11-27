import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { SignInModal } from '@coinbase/cdp-react'
import { useIsSignedIn, useEvmAddress } from '@coinbase/cdp-hooks'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { EmailFilter, FilterPills } from '@/components/EmailFilter'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useFilterParams } from '@/hooks/useFilterParams'
import { searchEventEmails } from '@/services/gmail'
import {
  buildGmailQuery,
  getDefaultGmailQuery,
  SOURCE_COLORS,
  STATUS_COLORS,
} from '@/config/emailFilters'
import type { EmailMetadata } from '@/types/gmail'
import type { RegistrationStatus } from '@/types/filters'
import {
  Mail,
  Wallet,
  RefreshCw,
  Sparkles,
  Calendar,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle,
  ChevronDown,
  FilterX,
} from 'lucide-react'

// ============================================
// Constants
// ============================================

const EMAILS_PER_PAGE = 20

// ============================================
// Helper Functions
// ============================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'

  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function extractSenderName(from: string | null): string {
  if (!from) return 'Unknown sender'

  // Try to extract name from "Name <email@example.com>" format
  const match = from.match(/^([^<]+)\s*</)
  if (match) {
    return match[1].trim().replace(/"/g, '')
  }

  // Return email without domain
  return from.split('@')[0]
}

function formatStatusLabel(status: RegistrationStatus): string {
  if (status === 'unknown') return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ============================================
// Component
// ============================================

export function CreateMark() {
  // Auth & Wallet
  const { accessToken, isAuthenticated: isGmailConnected, login: gmailLogin } = useAuth()
  const { isSignedIn: isWalletConnected } = useIsSignedIn()
  const { evmAddress } = useEvmAddress()
  const { showToast } = useToast()

  // Filter state (synced with URL)
  const {
    filters,
    toggleSource,
    toggleStatus,
    clearFilters,
    clearStatuses,
    hasActiveFilters,
    activeFilterCount,
  } = useFilterParams()

  // Email state
  const [emails, setEmails] = useState<EmailMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)

  // Pagination state
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(true)

  // Ref for infinite scroll trigger element
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Build Gmail query from filters
  const gmailQuery = useMemo(() => {
    return hasActiveFilters ? buildGmailQuery(filters) : getDefaultGmailQuery()
  }, [filters, hasActiveFilters])

  // Fetch emails from Gmail
  const fetchEmails = useCallback(
    async (pageToken?: string) => {
      if (!accessToken) return

      const isInitialLoad = !pageToken
      if (isInitialLoad) {
        setIsLoading(true)
        setEmails([])
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const result = await searchEventEmails(
          accessToken,
          gmailQuery,
          EMAILS_PER_PAGE,
          pageToken
        )

        if (isInitialLoad) {
          setEmails(result.emails)
        } else {
          setEmails((prev) => [...prev, ...result.emails])
        }

        setNextPageToken(result.nextPageToken)
        setHasMore(!!result.nextPageToken && result.emails.length === EMAILS_PER_PAGE)

        if (isInitialLoad && result.emails.length === 0) {
          showToast('No event emails found matching your filters.', 'info')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch emails'
        setError(message)
        showToast(message, 'error')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [accessToken, gmailQuery, showToast]
  )

  // Load more emails
  const loadMoreEmails = useCallback(() => {
    if (!isLoadingMore && hasMore && nextPageToken) {
      fetchEmails(nextPageToken)
    }
  }, [fetchEmails, hasMore, isLoadingMore, nextPageToken])

  // Initial fetch when Gmail is connected or query changes
  useEffect(() => {
    if (isGmailConnected && accessToken) {
      fetchEmails()
    }
  }, [isGmailConnected, accessToken, fetchEmails])

  // Ref to hold latest loadMoreEmails without causing effect re-runs
  const loadMoreEmailsRef = useRef(loadMoreEmails)
  loadMoreEmailsRef.current = loadMoreEmails

  // Refs for loading states to avoid effect dependencies
  const stateRef = useRef({ hasMore, isLoadingMore, isLoading })
  stateRef.current = { hasMore, isLoadingMore, isLoading }

  // Setup IntersectionObserver for infinite scroll (created once)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        const { hasMore, isLoadingMore, isLoading } = stateRef.current
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreEmailsRef.current()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, []) // Empty deps - observer created once, uses refs for latest values

  // Handle "Mark It" button click
  const handleMarkIt = (emailId: string) => {
    if (!isWalletConnected) {
      showToast('Please connect your wallet first', 'warning')
      return
    }

    setSelectedEmail(emailId)
    showToast('Minting coming soon! ZK proof generation in progress...', 'info')

    // TODO: Implement ZK proof generation and NFT minting
  }

  // Handle refresh
  const handleRefresh = () => {
    setNextPageToken(undefined)
    setHasMore(true)
    fetchEmails()
  }

  // Not connected state
  if (!isGmailConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Connect Gmail to Continue</CardTitle>
            <CardDescription>
              We need access to your Gmail to find event confirmation emails
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'var(--Controls-Idle)' }}
            >
              <Mail className="h-10 w-10 text-[var(--Controls-Selected)]" />
            </div>
            <Button size="lg" onClick={gmailLogin} className="gap-2">
              <Mail className="h-5 w-5" />
              Connect Gmail
            </Button>
            <p
              className="text-sm text-center max-w-md"
              style={{ color: 'var(--page-text-muted)' }}
            >
              We only read event confirmation emails from Luma, Substack, and Eventbrite. Your data
              stays private.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Your Digital Commitments
          </h1>
          <p style={{ color: 'var(--page-text-secondary)' }}>
            Select an event email to create a verified NFT
          </p>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Wallet Warning */}
      {!isWalletConnected && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Connect your wallet to mint NFTs</span>
            <SignInModal>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Wallet className="h-4 w-4" />
                Connect
              </Button>
            </SignInModal>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Connected Info */}
      {isWalletConnected && evmAddress && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Wallet Connected</AlertTitle>
          <AlertDescription>
            Ready to mint on Base • {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Section */}
      <EmailFilter
        filters={filters}
        onToggleSource={toggleSource}
        onToggleStatus={toggleStatus}
        onClearFilters={clearFilters}
        onClearStatuses={clearStatuses}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        disabled={isLoading}
      />

      {/* Quick Filter Pills (Mobile) */}
      <div className="sm:hidden">
        <FilterPills
          filters={filters}
          onToggleSource={toggleSource}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          disabled={isLoading}
        />
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State (Initial) */}
      {isLoading && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--Controls-Selected)]" />
          <p style={{ color: 'var(--page-text-secondary)' }}>Searching your emails...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && emails.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--Controls-Idle)' }}
            >
              {hasActiveFilters ? (
                <FilterX className="h-8 w-8 text-[var(--Controls-Selected)]" />
              ) : (
                <Mail className="h-8 w-8 text-[var(--Controls-Selected)]" />
              )}
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--page-text-primary)' }}>
              {hasActiveFilters ? 'No Matching Emails' : 'No Event Emails Found'}
            </h3>
            <p
              className="text-center max-w-md"
              style={{ color: 'var(--page-text-secondary)' }}
            >
              {hasActiveFilters
                ? 'No emails match your current filters. Try adjusting or clearing filters.'
                : "We couldn't find any event confirmation emails from Luma, Substack, or Eventbrite. Register for some events and check back!"}
            </p>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <FilterX className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email List */}
      {emails.length > 0 && (
        <div className="space-y-4">
          {/* Email Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--page-text-secondary)' }}>
              Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
              {hasMore && ' • Scroll for more'}
            </p>
          </div>

          {/* Email Cards */}
          {emails.map((email) => (
            <Card
              key={email.id}
              className="transition-all hover:scale-[1.01]"
              style={{
                borderColor:
                  selectedEmail === email.id ? 'var(--Controls-Selected)' : undefined,
              }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Email Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: SOURCE_COLORS[email.source].bg }}
                  >
                    <Mail className="h-6 w-6" style={{ color: SOURCE_COLORS[email.source].text }} />
                  </div>

                  {/* Email Details */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Source Badge */}
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: SOURCE_COLORS[email.source].bg,
                          color: SOURCE_COLORS[email.source].text,
                        }}
                      >
                        {email.source.charAt(0).toUpperCase() + email.source.slice(1)}
                      </span>

                      {/* Status Badge */}
                      {email.registrationStatus !== 'unknown' && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: STATUS_COLORS[email.registrationStatus].bg,
                            color: STATUS_COLORS[email.registrationStatus].text,
                          }}
                        >
                          {formatStatusLabel(email.registrationStatus)}
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <h3
                      className="font-semibold text-lg truncate"
                      style={{ color: 'var(--page-text-primary)' }}
                      title={email.subject ?? undefined}
                    >
                      {email.subject ?? 'No Subject'}
                    </h3>

                    {/* From & Date */}
                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm"
                      style={{ color: 'var(--page-text-secondary)' }}
                    >
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {extractSenderName(email.from)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(email.date)}
                      </span>
                    </div>

                    {/* Snippet */}
                    <p
                      className="mt-2 text-sm line-clamp-2"
                      style={{ color: 'var(--page-text-muted)' }}
                    >
                      {email.snippet}
                    </p>
                  </div>

                  {/* Mark It Button */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => handleMarkIt(email.id)}
                      disabled={!isWalletConnected}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Mark It
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Trigger / Button */}
          <div ref={loadMoreRef} className="flex flex-col items-center py-4 gap-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--Controls-Selected)]" />
                <span style={{ color: 'var(--page-text-secondary)' }}>Loading more emails...</span>
              </div>
            )}

            {!isLoadingMore && hasMore && (
              <Button variant="outline" onClick={loadMoreEmails} className="gap-2">
                <ChevronDown className="h-4 w-4" />
                Load More
              </Button>
            )}

            {!hasMore && emails.length > 0 && (
              <p className="text-sm" style={{ color: 'var(--page-text-muted)' }}>
                You've reached the end
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { EmailFilter, FilterPills } from '@/components/EmailFilter'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useWallet, ConnectWalletModal } from '@/wallet'
import { useFilterParams } from '@/hooks/useFilterParams'
import { searchEventEmails } from '@/services/gmail'
import {
  buildGmailQuery,
  getDefaultGmailQuery,
  SOURCE_COLORS,
  STATUS_COLORS,
} from '@/config/emailFilters'
import {
  ConfirmEmailModal,
  MarkItFlowModal,
  useMarkItFlow,
} from '@/features/mark-it'
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
  ChevronDown,
  FilterX,
  AlertTriangle,
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
  // Auth & Unified Wallet
  const {
    accessToken,
    isAuthenticated: isGmailConnected,
    login: gmailLogin,
  } = useAuth()
  const {
    isConnected: isWalletConnected,
    error: walletError,
  } = useWallet()
  const { showToast } = useToast()

  // Mark It Flow
  const markItFlow = useMarkItFlow()
  const { start: startMarkItFlow, cancel: cancelMarkItFlow, ...markItState } = markItFlow

  // Check for wrong network
  const isWrongNetwork = walletError?.type === 'WRONG_NETWORK'

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

  // Mark It modals state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [flowModalOpen, setFlowModalOpen] = useState(false)
  const [emailToMark, setEmailToMark] = useState<EmailMetadata | null>(null)

  // Upload .eml state
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setHasMore(
          !!result.nextPageToken && result.emails.length === EMAILS_PER_PAGE
        )

        if (isInitialLoad && result.emails.length === 0) {
          showToast('No event emails found matching your filters.', 'info')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch emails'
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

  // Handle "Mark It" button click - show confirmation modal
  const handleMarkIt = (email: EmailMetadata) => {
    setEmailToMark(email)
    setSelectedEmail(email.id)
    setConfirmModalOpen(true)
  }

  // Handle confirmation - start the Mark It flow
  const handleConfirmMarkIt = () => {
    if (!emailToMark) return

    setConfirmModalOpen(false)
    setFlowModalOpen(true)
    startMarkItFlow(emailToMark)
  }

  // Handle flow modal close
  const handleFlowModalClose = (open: boolean) => {
    if (!open) {
      setFlowModalOpen(false)
      setSelectedEmail(null)
      setEmailToMark(null)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    setNextPageToken(undefined)
    setHasMore(true)
    fetchEmails()
  }

  // Handle .eml file upload
  const handleEmlUpload = useCallback((file: File) => {
    setUploadError(null)

    // Validate file type
    if (!file.name.endsWith('.eml') && file.type !== 'message/rfc822') {
      setUploadError('Please upload an .eml file')
      return
    }

    // Create a synthetic EmailMetadata from the file
    // The actual parsing happens in the Mark It flow
    const syntheticEmail: EmailMetadata = {
      id: `upload-${Date.now()}`,
      subject: file.name.replace('.eml', ''),
      from: 'Uploaded file',
      date: new Date().toISOString(),
      snippet: 'Manually uploaded .eml file',
      source: 'luma', // Default, will be detected from email content
      registrationStatus: 'unknown',
      // Store the file for later use
      _uploadedFile: file,
    } as EmailMetadata & { _uploadedFile: File }

    setEmailToMark(syntheticEmail)
    setFlowModalOpen(true)
    startMarkItFlow(syntheticEmail)
  }, [startMarkItFlow])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleEmlUpload(file)
    // Reset input so same file can be selected again
    if (e.target) e.target.value = ''
  }, [handleEmlUpload])

  // Not connected state
  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 sm:px-6 sm:pt-12 md:pt-16 lg:pt-20">
      {/* Hero Section */}
      <header className="mb-16 sm:mb-20 md:mb-24 lg:mb-28 text-left">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 sm:mb-10 md:mb-12 border backdrop-blur-md"
            style={{
              backgroundColor: 'var(--page-badge-bg)',
              borderColor: 'var(--page-badge-border)',
            }}
          >
            <Sparkles
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              style={{ color: 'var(--page-text-primary)' }}
            />
            <span
              className="text-xs sm:text-sm font-semibold tracking-wide uppercase"
              style={{ color: 'var(--page-text-primary)', letterSpacing: '0.05em' }}
            >
              Own Your Commitments
            </span>
          </div>

          {/* Main Title */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 md:mb-10 leading-[1.1] tracking-tight"
            style={{ color: 'var(--page-text-primary)' }}
          >
            Marks of Your Life.
            <span className="block mt-3 sm:mt-4" style={{ color: 'var(--Controls-Selected)' }}>
              Unlocked.
            </span>
          </h1>

          {/* Description */}
          <div className="space-y-6 sm:space-y-8">
            <p
              className="text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
              style={{ color: 'var(--page-text-secondary)' }}
            >
              Every email in your inbox tells a story. That event you attended. That newsletter you subscribed to. That community you joined.
            </p>
            <p
              className="text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
              style={{ color: 'var(--page-text-secondary)' }}
            >
              Transform these digital commitments into permanent, on-chain Marks that become part of your identity.{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                Get recognized
              </span>
              ,{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                discover communities
              </span>
              , and{' '}
              <span className="font-semibold" style={{ color: 'var(--page-text-primary)' }}>
                unlock new opportunities
              </span>
              .
            </p>

            {/* CTA Text */}
            <p
              className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight pt-2"
              style={{ color: 'var(--page-text-primary)' }}
            >
              Transform. Build. Connect.
            </p>
          </div>
        </div>
      </header>

      {!isGmailConnected ? (
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
              We only read event confirmation emails from Luma, Substack, and
              Eventbrite. Everything happens client-side using ZK technology. We never see your data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-2 animate-fade-in space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
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

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Wrong Network</AlertTitle>
              <AlertDescription>
                Please switch to the correct network to mint NFTs.
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Warning */}
          {!isWalletConnected && !isWrongNetwork && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Connect your wallet to mint NFTs</span>
                <ConnectWalletModal
                  trigger={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Wallet className="h-4 w-4" />
                      Connect
                    </Button>
                  }
                />
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
              <p style={{ color: 'var(--page-text-secondary)' }}>
                Searching your emails...
              </p>
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
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--page-text-primary)' }}
                >
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
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="gap-2"
                    >
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
                <p
                  className="text-sm"
                  style={{ color: 'var(--page-text-secondary)' }}
                >
                  Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
                  {hasMore && ' • Scroll for more'}
                </p>
              </div>

              {/* Email Cards */}
              {emails.map((email) => (
                <Card
                  key={email.id}
                  variant="figma-hover"
                  className={`cursor-pointer ${
                    selectedEmail === email.id 
                      ? 'ring-2 ring-[var(--Controls-Selected)] ring-offset-2 ring-offset-transparent' 
                      : ''
                  }`}
                  onClick={() => handleMarkIt(email)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Email Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                        style={{ background: SOURCE_COLORS[email.source].bg }}
                      >
                        <Mail
                          className="h-6 w-6"
                          style={{ color: SOURCE_COLORS[email.source].text }}
                        />
                      </div>

                      {/* Email Details */}
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Source Badge */}
                          <span
                            className="glass-badge inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: SOURCE_COLORS[email.source].bg,
                              color: SOURCE_COLORS[email.source].text,
                            }}
                          >
                            {email.source.charAt(0).toUpperCase() +
                              email.source.slice(1)}
                          </span>

                          {/* Status Badge */}
                          {email.registrationStatus !== 'unknown' && (
                            <span
                              className="glass-badge inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                background:
                                  STATUS_COLORS[email.registrationStatus].bg,
                                color: STATUS_COLORS[email.registrationStatus].text,
                              }}
                            >
                              {formatStatusLabel(email.registrationStatus)}
                            </span>
                          )}
                        </div>

                        {/* Subject */}
                        <h3
                          className="font-semibold text-lg truncate w-full min-w-0"
                          style={{ color: 'var(--page-text-primary)' }}
                          title={email.subject ?? undefined}
                        >
                          {email.subject ?? 'No Subject'}
                        </h3>

                        {/* From & Date */}
                        <div
                          className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm"
                          style={{ color: 'var(--page-text-secondary)' }}
                        >
                          <span className="flex items-center gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {extractSenderName(email.from)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
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
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkIt(email)
                          }}
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
              <div
                ref={loadMoreRef}
                className="flex flex-col items-center py-4 gap-4"
              >
                {isLoadingMore && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--Controls-Selected)]" />
                    <span style={{ color: 'var(--page-text-secondary)' }}>
                      Loading more emails...
                    </span>
                  </div>
                )}

                {!isLoadingMore && hasMore && (
                  <Button
                    variant="outline"
                    onClick={loadMoreEmails}
                    className="gap-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Load More
                  </Button>
                )}

                {!hasMore && emails.length > 0 && (
                  <p
                    className="text-sm"
                    style={{ color: 'var(--page-text-muted)' }}
                  >
                    You've reached the end
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upload .eml - Compact Helper */}
          <div className="flex flex-col items-center gap-2 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,message/rfc822"
              onChange={handleFileInput}
              className="hidden"
            />
            <p
              className="text-sm"
              style={{ color: 'var(--page-text-muted)' }}
            >
              Can't find your email?{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="underline hover:no-underline cursor-pointer"
                style={{ color: 'var(--Controls-Selected)' }}
              >
                Upload .eml file
              </button>
            </p>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>

          {/* Mark It Confirmation Modal */}
          <ConfirmEmailModal
            email={emailToMark}
            open={confirmModalOpen}
            onOpenChange={setConfirmModalOpen}
            onConfirm={handleConfirmMarkIt}
          />

          {/* Mark It Flow Modal */}
          <MarkItFlowModal
            state={markItState}
            actions={markItFlow}
            open={flowModalOpen}
            onOpenChange={handleFlowModalClose}
          />
        </div>
      )}
    </div>
  )
}

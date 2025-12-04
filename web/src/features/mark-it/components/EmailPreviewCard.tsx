/**
 * Email Preview Card Component
 *
 * Large, centered card design matching the visual layout.
 * Displays email metadata in a prominent card format.
 */

import { Bookmark, Calendar, Fingerprint } from 'lucide-react'
import type { EmailMetadata } from '@/types/gmail'

interface EmailPreviewCardProps {
  email: EmailMetadata
  className?: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}

function extractSenderEmail(from: string | null): string {
  if (!from) return 'Unknown sender'
  const match = from.match(/<(.+)>/)
  if (match) {
    return match[1]
  }
  return from
}

export function EmailPreviewCard({ email, className = '' }: EmailPreviewCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl p-4 sm:p-6 overflow-hidden
        min-h-[320px] max-w-[280px] w-full
        flex flex-col items-center justify-between
        glass-card glass-card-hover
        ${className}
      `}
    >

      {/* Bookmark Icon - Top Center */}
      <div className="flex items-center justify-center mb-6">
        <Bookmark className="h-16 w-16 sm:h-20 sm:w-20 glass-text-muted" />
      </div>

      {/* Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full space-y-3 px-3">
        <h3 className="font-bold text-base sm:text-lg leading-tight glass-text-primary">
          {email.subject ?? 'No Subject'}
        </h3>
        <p className="text-xs sm:text-sm glass-text-secondary">
          {extractSenderEmail(email.from)}
        </p>
      </div>

      {/* Footer - Date and ID */}
      <div className="w-full pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-xs mt-4 glass-text-muted">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">{formatDate(email.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4" />
          <span className="font-mono font-medium opacity-80">
            #{email.id && email.id.length >= 4 ? email.id.slice(-4) : email.id || '0000'}
          </span>
        </div>
      </div>
    </div>
  )
}


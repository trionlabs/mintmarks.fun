/**
 * Email Preview Card Component
 *
 * Large, centered card design matching the visual layout.
 * Displays email metadata in a prominent card format.
 */

import { useCallback } from 'react'
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
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--glass-border)'
    e.currentTarget.style.transform = 'scale(1.01)'
    e.currentTarget.style.boxShadow = 'var(--glass-shadow-hover)'
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--glass-border)'
    e.currentTarget.style.transform = 'scale(1)'
    e.currentTarget.style.boxShadow = 'var(--glass-shadow)'
  }, [])

  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-6 border transition-all duration-300 group ${className}`}
      style={{
        background: 'var(--glass-bg-secondary)',
        borderColor: 'var(--glass-border)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        boxShadow: 'var(--glass-shadow)',
        overflow: 'hidden',
        minHeight: '320px',
        maxWidth: '280px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dark overlay filter - only for dark mode */}
      <div 
        className="absolute inset-0 dark:bg-black/20 pointer-events-none rounded-2xl"
        style={{ zIndex: 0 }}
      />

      {/* Content - Vertical badge layout */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
        {/* Bookmark Icon - Top Center - Gigantic */}
        <div className="flex items-center justify-center mb-6">
          <Bookmark 
            className="h-16 w-16 sm:h-20 sm:w-20" 
            style={{ color: 'var(--Controls-Selected)' }}
          />
        </div>

        {/* Content - Centered - Vertical layout */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full space-y-3 px-3">
          {/* Subject - Large and Bold */}
          <h3
            className="font-bold text-base sm:text-lg leading-tight"
            style={{ 
              color: 'var(--page-text-primary)',
            }}
          >
            {email.subject ?? 'No Subject'}
          </h3>

          {/* Sender Email */}
          <p 
            className="text-xs sm:text-sm"
            style={{ color: 'var(--page-text-secondary)' }}
          >
            {extractSenderEmail(email.from)}
          </p>
        </div>

        {/* Footer - Date and ID - Horizontal */}
        <div className="w-full pt-4 border-t flex items-center justify-between text-xs mt-4"
          style={{ 
            borderColor: 'var(--border)',
            color: 'var(--page-text-muted)'
          }}
        >
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
    </div>
  )
}


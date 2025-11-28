/**
 * Confirm Email Modal
 * 
 * Shows email details and asks for confirmation before starting the Mark It flow.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, Calendar, ExternalLink, Sparkles, AlertCircle } from 'lucide-react'
import type { EmailMetadata } from '@/types/gmail'
import { SOURCE_COLORS } from '@/config/emailFilters'

interface ConfirmEmailModalProps {
  email: EmailMetadata | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function extractSenderName(from: string | null): string {
  if (!from) return 'Unknown sender'
  const match = from.match(/^([^<]+)\s*</)
  if (match) {
    return match[1].trim().replace(/"/g, '')
  }
  return from.split('@')[0]
}

export function ConfirmEmailModal({
  email,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmEmailModalProps) {
  if (!email) return null

  const sourceColor = SOURCE_COLORS[email.source] || SOURCE_COLORS.unknown

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--Controls-Selected)' }} />
            Create Your Mark
          </DialogTitle>
          <DialogDescription>
            You're about to create a soulbound NFT from this email. This process includes:
          </DialogDescription>
        </DialogHeader>

        {/* Process Steps */}
        <div
          className="rounded-lg p-4 space-y-2"
          style={{ background: 'var(--glass-bg-secondary)' }}
        >
          <div className="flex items-center gap-3 text-sm">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{ background: 'var(--Controls-Selected)', color: 'white' }}
            >
              1
            </span>
            <span style={{ color: 'var(--page-text-primary)' }}>
              Connect your wallet
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{ background: 'var(--Controls-Selected)', color: 'white' }}
            >
              2
            </span>
            <span style={{ color: 'var(--page-text-primary)' }}>
              Generate ZK proof of your email (30-60s)
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{ background: 'var(--Controls-Selected)', color: 'white' }}
            >
              3
            </span>
            <span style={{ color: 'var(--page-text-primary)' }}>
              Verify your identity with ZKPassport
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{ background: 'var(--Controls-Selected)', color: 'white' }}
            >
              4
            </span>
            <span style={{ color: 'var(--page-text-primary)' }}>
              Mint your soulbound NFT
            </span>
          </div>
        </div>

        {/* Email Preview */}
        <div
          className="rounded-lg p-4 border"
          style={{
            background: 'var(--glass-bg-primary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: sourceColor.bg }}
            >
              <Mail className="h-6 w-6" style={{ color: sourceColor.text }} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Source Badge */}
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                style={{ background: sourceColor.bg, color: sourceColor.text }}
              >
                {email.source.charAt(0).toUpperCase() + email.source.slice(1)}
              </span>

              {/* Subject */}
              <h4
                className="font-semibold truncate"
                style={{ color: 'var(--page-text-primary)' }}
                title={email.subject ?? undefined}
              >
                {email.subject ?? 'No Subject'}
              </h4>

              {/* Meta */}
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
            </div>
          </div>
        </div>

        {/* Warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-lg text-sm"
          style={{
            background: 'var(--status-pending-bg)',
            color: 'var(--page-text-primary)',
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium">Once minted, this NFT is permanent</p>
            <p style={{ color: 'var(--page-text-secondary)' }}>
              Soulbound tokens cannot be transferred or sold. Each email can only be used once.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Start Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


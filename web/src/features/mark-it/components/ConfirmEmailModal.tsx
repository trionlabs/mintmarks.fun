/**
 * Confirm Email Modal
 * 
 * Layout matches the visual design - clean, focused, centered.
 * Shows email details and asks for confirmation before starting the Mark It flow.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bookmark, Info, ArrowLeft, ArrowRight, X } from 'lucide-react'
import type { EmailMetadata } from '@/types/gmail'
import { EmailPreviewCard } from './EmailPreviewCard'

interface ConfirmEmailModalProps {
  email: EmailMetadata | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmEmailModal({
  email,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmEmailModalProps) {
  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        {/* Header - Title and Close Button Same Line */}
        <div className="flex items-center justify-between gap-4 mb-4 -mt-1">
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
            Mint Your Mintmark
          </DialogTitle>
          <DialogClose
            className="w-8 h-8 rounded-lg flex items-center justify-center ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70 transition-all hover:opacity-100 hover:bg-muted/50 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none border flex-shrink-0"
            style={{
              borderColor: 'var(--border)',
            }}
          >
            <X className="w-4 h-4 pointer-events-none shrink-0" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Compact Centered Design - Better Hierarchy */}
        <div className="text-center">
          {/* Description */}
          <DialogDescription className="text-xs sm:text-sm font-medium leading-relaxed mb-8">
            Privately prove your commitment and make it a permanent part of your digital identity.
          </DialogDescription>

          {/* Email Preview Card - Vertical Badge - Centered */}
          <div className="flex justify-center my-8">
            <EmailPreviewCard email={email} />
          </div>

          {/* How It Works Badge - More spacious */}
          <div className="my-8">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 hover:scale-105 cursor-default"
              style={{ 
                backgroundColor: 'var(--page-badge-bg)',
                borderColor: 'var(--page-border-color)',
                backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <Info className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--page-text-muted)' }} />
              <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--page-text-secondary)' }}>
                Transform Your Email to On-chain, Verifiable NFTs with Privacy
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Back and Mark It - Better spacing */}
        <DialogFooter className="gap-2 sm:gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="gap-2 w-full sm:flex-1"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={onConfirm} 
            className="gap-2 w-full sm:flex-1"
            size="lg"
          >
            <Bookmark className="h-4 w-4" />
            Mark It
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



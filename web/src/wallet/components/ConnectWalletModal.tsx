/**
 * @fileoverview Unified connect modal with two tabs.
 * Uses RainbowKit's useConnectModal hook for better UX.
 */

import { useState } from 'react'
import { SignInModal } from '@coinbase/cdp-react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Mail, Wallet } from 'lucide-react'

interface ConnectWalletModalProps {
  trigger?: React.ReactNode
}

export function ConnectWalletModal({ trigger }: ConnectWalletModalProps) {
  const [open, setOpen] = useState(false)
  const { openConnectModal } = useConnectModal()
  const { isConnected: isExternalConnected } = useAccount()

  // Check if CDP is configured
  const isCDPConfigured = !!import.meta.env.VITE_CDP_PROJECT_ID

  /**
   * Opens RainbowKit modal for external wallet connection.
   * Closes our modal first to avoid modal stacking.
   */
  const handleExternalConnect = () => {
    setOpen(false)
    // Small delay to let our modal close animation complete
    setTimeout(() => {
      openConnectModal?.()
    }, 150)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Connect Wallet</Button>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Connect to MintMarks</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={isCDPConfigured ? 'email' : 'wallet'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="email"
              className="flex items-center gap-2"
              disabled={!isCDPConfigured}
            >
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          {isCDPConfigured && (
            <TabsContent value="email" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                New to crypto? Sign in with email to create a wallet.
              </p>
              {/* SignInModal takes children, not trigger prop */}
              <SignInModal>
                <Button className="w-full" size="lg">
                  Continue with Email
                </Button>
              </SignInModal>
            </TabsContent>
          )}

          <TabsContent value="wallet" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Connect your MetaMask, Rabby, or Coinbase Wallet.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleExternalConnect}
              disabled={isExternalConnected}
            >
              {isExternalConnected ? 'Already Connected' : 'Connect Wallet'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

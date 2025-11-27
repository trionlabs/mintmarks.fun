/**
 * @fileoverview Wallet status display with wrong network handling.
 * Uses RainbowKit's chain.unsupported for automatic detection.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '../context/WalletContext'
import { Button } from '@/components/ui/button'
import { Wallet, AlertTriangle } from 'lucide-react'
import { truncateAddress } from '../utils/addressUtils'

export function WalletStatus() {
  const { isConnected, address, source } = useWallet()

  // Not connected - show nothing (connect button is elsewhere)
  if (!isConnected || !address) {
    return null
  }

  // CDP wallet - no chain switching needed (always on correct chain)
  if (source === 'cdp') {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5">
        <Wallet className="h-4 w-4 text-green-500" />
        <span className="hidden sm:inline text-xs font-mono">
          {truncateAddress(address)}
        </span>
      </Button>
    )
  }

  // External wallet - use RainbowKit for chain validation
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openAccountModal,
        mounted,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        if (!ready) {
          return (
            <div
              aria-hidden="true"
              style={{
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )
        }

        if (!connected) {
          return null
        }

        if (chain.unsupported) {
          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={openChainModal}
              className="gap-1.5"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Wrong Network</span>
            </Button>
          )
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={openAccountModal}
            className="gap-1.5"
          >
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline text-xs font-mono">
              {account.displayName ?? truncateAddress(address)}
            </span>
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}



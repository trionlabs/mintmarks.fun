/**
 * @fileoverview Wallet status display with wrong network handling.
 * Uses RainbowKit's chain.unsupported for automatic detection.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '../context/WalletContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, AlertTriangle, LogOut, Copy, Check } from 'lucide-react'
import { truncateAddress } from '../utils/addressUtils'
import { useState } from 'react'

export function WalletStatus() {
  const { isConnected, address, source, disconnect } = useWallet()
  const [copied, setCopied] = useState(false)

  // Not connected - show nothing (connect button is elsewhere)
  if (!isConnected || !address) {
    return null
  }

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  // CDP wallet - dropdown with disconnect option
  if (source === 'cdp') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline text-xs font-mono">
              {truncateAddress(address)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Email Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

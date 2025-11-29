/**
 * Network Selector Component
 * 
 * Allows users to select which network to mint their NFT on.
 * Shows all enabled networks with their status (configured/not configured).
 */

import { useState, useCallback } from 'react'
import { Check, ChevronDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MINT_NETWORKS,
  getEnabledMintNetworks,
  isNetworkConfigured,
  type MintNetworkId,
  type MintNetworkConfig,
} from '@/config/mintNetworks'

interface NetworkSelectorProps {
  selected: MintNetworkId
  onChange: (network: MintNetworkId) => void
  disabled?: boolean
}

/**
 * Network icon component
 * Shows chain-specific icons
 */
function NetworkIcon({ network, size = 20 }: { network: MintNetworkConfig; size?: number }) {
  // Use simple colored circles with chain initials
  const getNetworkStyle = () => {
    switch (network.id) {
      case 'ethereum':
      case 'ethereum-sepolia':
        return {
          background: 'linear-gradient(135deg, #627EEA 0%, #3C3C3D 100%)',
          color: 'white',
        }
      case 'base':
      case 'base-sepolia':
        return {
          background: 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)',
          color: 'white',
        }
      default:
        return {
          background: 'var(--Controls-Idle)',
          color: 'var(--page-text-primary)',
        }
    }
  }

  const getInitial = () => {
    if (network.id.startsWith('ethereum')) return 'E'
    if (network.id.startsWith('base')) return 'B'
    return network.shortName[0]
  }

  const style = getNetworkStyle()

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-xs"
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      {getInitial()}
    </div>
  )
}

/**
 * Network item in dropdown
 */
function NetworkItem({
  network,
  isSelected,
  isConfigured,
  onClick,
}: {
  network: MintNetworkConfig
  isSelected: boolean
  isConfigured: boolean
  onClick: () => void
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={!isConfigured}
      className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
      style={{
        opacity: isConfigured ? 1 : 0.5,
      }}
    >
      <NetworkIcon network={network} size={24} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium text-sm"
            style={{ color: 'var(--page-text-primary)' }}
          >
            {network.name}
          </span>
          {network.testnet && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: 'var(--status-pending-bg)',
                color: 'var(--status-pending)',
              }}
            >
              Testnet
            </span>
          )}
        </div>
        {!isConfigured && (
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--page-text-muted)' }}
          >
            <AlertCircle className="h-3 w-3" />
            Not deployed
          </span>
        )}
      </div>

      {isSelected && isConfigured && (
        <Check
          className="h-4 w-4 shrink-0"
          style={{ color: 'var(--status-confirmed)' }}
        />
      )}
    </DropdownMenuItem>
  )
}

export function NetworkSelector({
  selected,
  onChange,
  disabled = false,
}: NetworkSelectorProps) {
  const [open, setOpen] = useState(false)
  const enabledNetworks = getEnabledMintNetworks()
  const selectedNetwork = MINT_NETWORKS[selected]

  const handleSelect = useCallback((networkId: MintNetworkId) => {
    if (isNetworkConfigured(networkId)) {
      onChange(networkId)
      setOpen(false)
    }
  }, [onChange])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-12 px-4"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--Controls-Idle)',
          }}
        >
          <div className="flex items-center gap-3">
            <NetworkIcon network={selectedNetwork} size={24} />
            <div className="flex flex-col items-start">
              <span
                className="font-medium text-sm"
                style={{ color: 'var(--page-text-primary)' }}
              >
                {selectedNetwork.name}
              </span>
              {selectedNetwork.testnet && (
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--page-text-muted)' }}
                >
                  Testnet
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--page-text-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-1"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Testnets */}
        <div
          className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--page-text-muted)' }}
        >
          Testnets
        </div>
        {enabledNetworks
          .filter((n) => n.testnet)
          .map((network) => (
            <NetworkItem
              key={network.id}
              network={network}
              isSelected={selected === network.id}
              isConfigured={isNetworkConfigured(network.id)}
              onClick={() => handleSelect(network.id)}
            />
          ))}

        {/* Mainnets */}
        <div
          className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider mt-1 border-t pt-2"
          style={{ color: 'var(--page-text-muted)', borderColor: 'var(--border)' }}
        >
          Mainnets
        </div>
        {enabledNetworks
          .filter((n) => !n.testnet)
          .map((network) => (
            <NetworkItem
              key={network.id}
              network={network}
              isSelected={selected === network.id}
              isConfigured={isNetworkConfigured(network.id)}
              onClick={() => handleSelect(network.id)}
            />
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


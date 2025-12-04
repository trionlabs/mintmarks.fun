/**
 * @fileoverview Infinite Marquee/Ticker Component
 * 
 * Inspired by zk.email's use case marquee.
 * CSS-only animation for optimal performance.
 */

import { cn } from '@/lib/utils'

interface MarqueeItem {
  text: string
  icon?: React.ReactNode
}

interface MarqueeProps {
  /** Items to display in the marquee */
  items: (string | MarqueeItem)[]
  /** Animation speed in seconds for one full cycle */
  speed?: number
  /** Direction of scroll */
  direction?: 'left' | 'right'
  /** Pause on hover */
  pauseOnHover?: boolean
  /** Separator between items */
  separator?: React.ReactNode
  /** Additional CSS classes for container */
  className?: string
  /** Additional CSS classes for items */
  itemClassName?: string
}

/**
 * Infinite Marquee Component
 * 
 * Usage:
 * ```tsx
 * <Marquee 
 *   items={['Item 1', 'Item 2', 'Item 3']}
 *   speed={30}
 * />
 * 
 * // With icons:
 * <Marquee 
 *   items={[
 *     { text: 'Recover account', icon: <ShieldIcon /> },
 *     { text: 'Prove identity', icon: <UserIcon /> },
 *   ]}
 * />
 * ```
 */
export function Marquee({
  items,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  separator,
  className,
  itemClassName,
}: MarqueeProps) {
  // Default separator - diamond shape like zk.email
  const defaultSeparator = (
    <span 
      className="inline-block w-2 h-2 rotate-45 mx-6"
      style={{ backgroundColor: 'var(--primary)' }}
      aria-hidden="true"
    />
  )
  
  const sep = separator ?? defaultSeparator
  
  // Normalize items to MarqueeItem format
  const normalizedItems: MarqueeItem[] = items.map(item => 
    typeof item === 'string' ? { text: item } : item
  )
  
  // Render a single set of items
  const renderItems = () => (
    <>
      {normalizedItems.map((item, index) => (
        <span key={index} className="inline-flex items-center">
          {index > 0 && sep}
          <span className={cn('inline-flex items-center gap-2', itemClassName)}>
            {item.icon}
            <span>{item.text}</span>
          </span>
        </span>
      ))}
      {/* Trailing separator for seamless loop */}
      {sep}
    </>
  )
  
  return (
    <div 
      className={cn(
        'overflow-hidden whitespace-nowrap',
        pauseOnHover && 'group',
        className
      )}
    >
      <div 
        className="inline-flex animate-marquee"
        style={{ 
          animationDuration: `${speed}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {/* Duplicate content for seamless infinite scroll */}
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  )
}

export default Marquee


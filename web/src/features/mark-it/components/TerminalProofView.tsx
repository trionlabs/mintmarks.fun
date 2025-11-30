/**
 * Terminal Proof View
 * 
 * Dark terminal-style interface for email proof generation.
 * Classic terminal aesthetic: black background, green text, monospace font.
 */

import { useEffect, useRef, useState } from 'react'
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TerminalLogEntry, EmailProofStatus } from '../types'

interface TerminalProofViewProps {
  status: EmailProofStatus
  progress: number
  logs: TerminalLogEntry[]
  eventName?: string
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function LogEntry({ entry }: { entry: TerminalLogEntry }) {
  // Terminal color scheme - softer, modern palette
  const colorMap: Record<TerminalLogEntry['type'], string> = {
    info: 'var(--foreground)',      // White/Black based on theme
    success: 'var(--status-confirmed)',   // Green
    error: 'var(--status-failed)',     // Red
    progress: 'var(--Controls-Selected)',  // Blue
  }

  return (
    <div className="flex items-start gap-2 font-mono text-[10px] sm:text-xs leading-relaxed opacity-90">
      <span className="text-muted-foreground shrink-0">[{formatTime(entry.timestamp)}]</span>
      <span style={{ color: colorMap[entry.type] || colorMap.info }}>
        {entry.message}
      </span>
    </div>
  )
}

export function TerminalProofView({
  status,
  progress,
  logs,
  eventName,
}: TerminalProofViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed && logs.length > 0) {
      // Smooth scroll to bottom
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [logs, isCollapsed])

  // Auto-collapse when proof is complete
  useEffect(() => {
    if (status === 'complete') {
      setIsCollapsed(true)
    }
  }, [status])

  const isComplete = status === 'complete'
  const isError = status === 'error'
  const isRunning = !isComplete && !isError && status !== 'idle'

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--glass-bg-secondary)',
      }}
    >
      {/* Terminal header - clickable to toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono font-medium">
            ZK Proof Logs
          </span>
          {eventName && (
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
              — {eventName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status */}
          {isRunning && (
            <span className="text-xs font-mono text-[var(--Controls-Selected)] animate-pulse">
              {progress}%
            </span>
          )}
          {isComplete && (
            <span className="text-xs font-mono text-[var(--status-confirmed)] flex items-center gap-1">
              ✓ Ready
            </span>
          )}
          {isError && (
            <span className="text-xs font-mono text-[var(--status-failed)]">
              ✗ Failed
            </span>
          )}
          
          {/* Collapse/Expand icon */}
          <div className="p-0.5 rounded hover:bg-white/10 transition-colors">
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Terminal content - collapsible - Glassmorphic */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isCollapsed ? 'max-h-0' : 'max-h-[180px]'
        )}
        style={{
          background: 'var(--glass-bg-tertiary)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
        }}
      >
        <div
          ref={scrollRef}
          className="p-3 overflow-y-auto font-mono text-xs terminal-scrollbar"
          style={{
            maxHeight: '180px',
            scrollBehavior: 'smooth',
          }}
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground">
              <span className="text-[var(--status-confirmed)] mr-2">$</span>
              Waiting to start...
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log, index) => (
                <LogEntry key={index} entry={log} />
              ))}
              
              {/* Blinking cursor when running */}
              {isRunning && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[var(--status-confirmed)]">$</span>
                  <span
                    className="inline-block w-1.5 h-3 animate-pulse bg-[var(--status-confirmed)]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

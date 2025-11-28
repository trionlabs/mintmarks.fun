/**
 * Pino logger shim for browser environment.
 * Provides minimal implementation for zk-email SDK compatibility.
 */

interface LoggerOptions {
  level?: string
}

interface Logger {
  trace: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  fatal: (...args: unknown[]) => void
  child: () => Logger
  level: string
}

// Check if we're in development mode
const isDev = import.meta.env.DEV

// No-op function for production or silent levels
const noop = () => {}

/**
 * Create a pino-compatible logger instance.
 */
function pino(opts?: LoggerOptions): Logger {
  const level = opts?.level ?? 'info'
  
  // In production, only show warnings and errors
  // In development, show based on level
  const shouldLog = (msgLevel: string): boolean => {
    if (!isDev) {
      // Production: only warn and error
      return msgLevel === 'warn' || msgLevel === 'error' || msgLevel === 'fatal'
    }
    // Development: respect log level
    const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    const configuredLevel = levels.indexOf(level)
    const messageLevel = levels.indexOf(msgLevel)
    return messageLevel >= configuredLevel
  }

  return {
    trace: shouldLog('trace') ? (...args: unknown[]) => console.debug('[TRACE]', ...args) : noop,
    debug: shouldLog('debug') ? (...args: unknown[]) => console.debug('[DEBUG]', ...args) : noop,
    info: shouldLog('info') ? (...args: unknown[]) => console.info('[INFO]', ...args) : noop,
    warn: shouldLog('warn') ? (...args: unknown[]) => console.warn('[WARN]', ...args) : noop,
    error: shouldLog('error') ? (...args: unknown[]) => console.error('[ERROR]', ...args) : noop,
    fatal: shouldLog('fatal') ? (...args: unknown[]) => console.error('[FATAL]', ...args) : noop,
    child: () => pino(opts),
    level,
  }
}

pino.destination = () => ({})
pino.transport = () => ({})
pino.stdSerializers = {}
pino.levels = {
  values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 },
}

export { pino }
export default pino

/**
 * Application logger instance.
 * Use this for all logging in the application.
 * 
 * In production: only warns and errors are shown
 * In development: all levels are shown
 */
export const logger = pino({ level: isDev ? 'debug' : 'warn' })

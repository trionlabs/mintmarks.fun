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

const noop = () => {}

function pino(opts?: LoggerOptions): Logger {
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    fatal: console.error.bind(console),
    child: () => pino(opts),
    level: opts?.level ?? 'info',
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


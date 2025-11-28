// ESM shim for pino browser - provides both default and named 'pino' export
// This fixes the CJS->ESM interop issue where browser.js only has module.exports = pino
const noop = () => {}
const pino = (opts) => ({
  trace: noop,
  debug: noop,
  info: noop,
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  fatal: console.error.bind(console),
  child: () => pino(opts),
  level: 'info',
  ...opts,
})
pino.destination = () => ({})
pino.transport = () => ({})
pino.stdSerializers = {}
pino.levels = { values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 } }

export { pino }
export default pino

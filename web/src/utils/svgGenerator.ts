/**
 * Mintmarks SVG Generator - Client-side fallback
 * 
 * Generates the same SVG as the Solidity contract.
 * Used when on-chain metadata fetch fails or for preview.
 */

const PALETTES = [
  { name: 'Ice', light: '#cef', dark: '#013', accent: '#8bf' },
  { name: 'Glacier', light: '#cff', dark: '#022', accent: '#8ff' },
  { name: 'Amethyst', light: '#ecf', dark: '#102', accent: '#b8f' },
  { name: 'Rose', light: '#fce', dark: '#201', accent: '#f8b' },
  { name: 'Amber', light: '#fec', dark: '#210', accent: '#fb8' },
  { name: 'Emerald', light: '#cfe', dark: '#021', accent: '#8fb' },
  { name: 'Coral', light: '#fcc', dark: '#200', accent: '#f88' },
  { name: 'Sapphire', light: '#cdf', dark: '#012', accent: '#89f' },
  { name: 'Noir', light: '#eee', dark: '#111', accent: '#999' },
  { name: 'Sand', light: '#fed', dark: '#110', accent: '#db9' },
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) >>> 0
  }
  return h
}

function sin100(t: number): number {
  t = ((t % 100) + 100) % 100
  if (t <= 50) {
    const x = t - 25
    return Math.floor(100 - (x * x * 4) / 25)
  }
  const x = t - 75
  return Math.floor(-100 + (x * x * 4) / 25)
}

/**
 * Generate Mintmarks SVG for an event
 * Pure visual art - no text, text is shown in UI overlay
 * @param eventName - The event name (used for color seed)
 * @param verified - Whether passport verified (adds accent frame)
 * @returns SVG string
 */
export function generateMintmarksSVG(
  eventName: string,
  verified: boolean = true,
  _tokenId: string = '0'
): string {
  const seed = hash(eventName)
  const p = PALETTES[seed % 10]
  const h = (seed % 16).toString(16)

  // Gradient definitions for flux effect
  const defs = `<defs><linearGradient id="f${h}"><stop stop-color="${p.light}" stop-opacity="0"/><stop offset=".5" stop-color="${p.light}"/><stop offset="1" stop-color="${p.light}" stop-opacity="0"/></linearGradient></defs>`

  const freq = (seed % 3) + 1
  const phase = (seed >> 8) % 100
  const amp = 60 + ((seed >> 16) % 80)

  // Generate animated-looking flux bars
  let flux = ''
  for (let i = 0; i < 5; i++) {
    const y = i * 80
    const x = -200 + Math.floor((sin100((i * freq * 20 + phase) % 100) * amp) / 100)
    flux += `<rect x="${x}" y="${y}" width="800" height="80" fill="url(#f${h})"/>`
  }

  // Accent frame for verified marks
  const frame = verified
    ? `<rect x="12" y="12" width="376" height="376" fill="none" stroke="#050505" stroke-width="24"/><rect x="24" y="24" width="352" height="352" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity=".8"/>`
    : ''

  // Small MINTMARKS watermark in corner
  const watermark = `<text x="376" y="32" text-anchor="end" fill="${p.light}" font-size="7" opacity=".5" font-family="system-ui">MINTMARKS</text>`

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${defs}<rect width="400" height="400" fill="${p.dark}"/>${flux}${frame}${watermark}</svg>`
}

/**
 * Generate SVG as data URI (for img src)
 * Uses encodeURIComponent for unicode support instead of btoa
 */
export function generateMintmarksSVGDataUri(
  eventName: string,
  verified: boolean = true,
  tokenId: string = '0'
): string {
  const svg = generateMintmarksSVG(eventName, verified, tokenId)
  // Use URL encoding instead of base64 to support unicode characters
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Get palette for an event name
 */
export function getEventPalette(eventName: string) {
  const seed = hash(eventName)
  return PALETTES[seed % 10]
}



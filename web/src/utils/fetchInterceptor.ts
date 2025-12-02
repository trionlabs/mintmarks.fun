/**
 * @fileoverview Global Network Interceptor
 * 
 * Intercepts network requests to handle specific scenarios:
 * - CDP API 401 errors on auth/refresh: Clears stale auth tokens
 * 
 * IMPORTANT: This module has side effects - it patches window.fetch AND XMLHttpRequest.
 * CDP SDK uses XHR, not fetch, so we need to intercept both.
 * Import this module once at app initialization (main.tsx).
 */

import { clearAllCdpState } from '@/wallet/utils/walletAuthState'

const CDP_API_PATTERN = 'api.cdp.coinbase.com'

/**
 * Endpoints where 401 indicates stale session (should clear state).
 * Other endpoints (like auth/verify) may return 401 for user errors (wrong OTP).
 */
const STALE_AUTH_ENDPOINTS = [
  '/auth/refresh',
  '/auth/logout',
]

/**
 * Check if a URL is a CDP API endpoint that indicates stale auth on 401.
 */
function isStaleAuthEndpoint(url: string): boolean {
  return STALE_AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

/**
 * Handle CDP API 401 errors by clearing stale auth state.
 * Only clears state for specific endpoints (auth/refresh, auth/logout).
 * Does NOT clear state for user errors like wrong OTP (auth/verify).
 */
function handleCdp401Error(source: 'fetch' | 'xhr', url: string): void {
  if (!isStaleAuthEndpoint(url)) {
    // This is likely a user error (wrong OTP, etc.), not stale auth
    if (import.meta.env.DEV) {
      console.log(`[NetworkInterceptor] CDP 401 on ${url} - user error, not clearing state`)
    }
    return
  }
  
  console.warn(`[NetworkInterceptor] CDP auth failed with 401 (${source}), clearing stale state`)
  clearAllCdpState()
  // Note: Page will need refresh for wagmi reconnect to work
  // This is acceptable - stale auth is a rare edge case
}

/**
 * Initialize the fetch interceptor.
 */
function patchFetch(): void {
  const originalFetch = window.fetch
  
  window.fetch = async (...args) => {
    const input = args[0]
    const url = typeof input === 'string' 
      ? input 
      : input instanceof Request 
        ? input.url 
        : ''
    
    const isCdpApiCall = url.includes(CDP_API_PATTERN)
    const response = await originalFetch(...args)
    
    if (isCdpApiCall && response.status === 401) {
      handleCdp401Error('fetch', url)
    }
    
    return response
  }
}

/**
 * Initialize the XHR interceptor.
 * CDP SDK uses XMLHttpRequest, not fetch.
 */
function initXhrInterceptor(): void {
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send
  
  // Store URL for each XHR instance
  const xhrUrls = new WeakMap<XMLHttpRequest, string>()
  
  // Intercept open to capture URL
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    ...rest: [boolean?, string?, string?]
  ) {
    xhrUrls.set(this, url.toString())
    return originalOpen.call(this, method, url, ...rest)
  }
  
  // Intercept send to check response
  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const xhr = this
    const url = xhrUrls.get(xhr) || ''
    const isCdpApiCall = url.includes(CDP_API_PATTERN)
    
    if (isCdpApiCall) {
      xhr.addEventListener('load', function() {
        if (xhr.status === 401) {
          handleCdp401Error('xhr', url)
        }
      })
    }
    
    return originalSend.call(this, body)
  }
}

/**
 * Initialize all network interceptors.
 * Call this once at app startup.
 */
export function initNetworkInterceptor(): void {
  patchFetch()
  initXhrInterceptor()
  
  if (import.meta.env.DEV) {
    console.log('[NetworkInterceptor] Initialized (fetch + XHR)')
  }
}


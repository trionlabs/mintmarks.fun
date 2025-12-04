/**
 * Auth Context - Google OAuth for Gmail API Access
 * 
 * Manages Google OAuth authentication state for Gmail API access.
 * CDP wallet authentication is handled separately by CDPReactProvider.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

// ============================================
// Constants
// ============================================

const TOKEN_STORAGE_KEY = 'mintmarks_gmail_access_token'
const TOKEN_EXPIRE_KEY = 'mintmarks_gmail_token_expire'
const USER_INFO_KEY = 'mintmarks_user_info'
const OAUTH_STATE_KEY = 'mintmarks_oauth_state'
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5 minutes buffer

// Google OAuth scopes
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

// ============================================
// Types
// ============================================

interface UserInfo {
  email: string
  name: string | null
  picture: string | null
  googleId: string
}

interface AuthContextType {
  // State
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  userInfo: UserInfo | null

  // Actions
  login: () => void
  logout: () => void

  // Helpers
  isTokenExpired: () => boolean
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if token is expired
  const isTokenExpired = useCallback((): boolean => {
    const expireTime = localStorage.getItem(TOKEN_EXPIRE_KEY)
    if (!expireTime) return true
    return Date.now() >= parseInt(expireTime, 10)
  }, [])

  // Fetch user info from Google API
  const fetchUserInfo = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user info')
      }

      const data = await response.json()
      const info: UserInfo = {
        email: data.email ?? '',
        name: data.name ?? null,
        picture: data.picture ?? null,
        googleId: data.id ?? '',
      }

      setUserInfo(info)
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
      return info
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch user info:', error)
      }
      return null
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      setIsLoading(true)

      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedExpireTime = localStorage.getItem(TOKEN_EXPIRE_KEY)
      const storedUserInfo = localStorage.getItem(USER_INFO_KEY)

      if (storedToken && storedExpireTime) {
        const expireTime = parseInt(storedExpireTime, 10)
        const now = Date.now()

        // Check if token is still valid (with buffer)
        if (now < expireTime - TOKEN_EXPIRY_BUFFER) {
          setAccessToken(storedToken)

          if (storedUserInfo) {
            try {
              setUserInfo(JSON.parse(storedUserInfo))
            } catch {
              // Invalid JSON, fetch fresh user info
              await fetchUserInfo(storedToken)
            }
          } else {
            await fetchUserInfo(storedToken)
          }
        } else {
          // Token expired, clear storage
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          localStorage.removeItem(TOKEN_EXPIRE_KEY)
          localStorage.removeItem(USER_INFO_KEY)

          // Dispatch event for wallet disconnect on token expiry
          window.dispatchEvent(new Event('auth:logout'))
        }
      }

      setIsLoading(false)
    }

    loadStoredAuth()
  }, [fetchUserInfo])

  // Login function - redirect to Google OAuth
  const login = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      if (import.meta.env.DEV) {
        console.error('Missing VITE_GOOGLE_CLIENT_ID environment variable')
      }
      return
    }

    const redirectUri = window.location.origin

    // Generate CSRF state token for security
    const state = crypto.randomUUID()
    sessionStorage.setItem(OAUTH_STATE_KEY, state)
    
    if (import.meta.env.DEV) {
      console.log('[AuthContext] OAuth state generated and stored:', state)
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token', // Implicit flow
      scope: GOOGLE_SCOPES,
      prompt: 'consent', // Always show consent screen
      state, // CSRF protection
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    window.location.href = authUrl
  }, [])

  // Logout function
  const logout = useCallback(() => {
    setAccessToken(null)
    setUserInfo(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(TOKEN_EXPIRE_KEY)
    localStorage.removeItem(USER_INFO_KEY)

    // Dispatch global logout event for other components (e.g. Layout to disconnect wallet)
    window.dispatchEvent(new Event('auth:logout'))
  }, [])

  // Cross-tab synchronization: Listen for auth changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Token removed in another tab → sync logout state
      if (e.key === TOKEN_STORAGE_KEY && e.newValue === null && e.oldValue !== null) {
        setAccessToken(null)
        setUserInfo(null)
        // Dispatch event so Layout can disconnect wallet
        window.dispatchEvent(new Event('auth:logout'))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Token expiry timer: Auto-logout when token expires during active session
  useEffect(() => {
    if (!accessToken) return

    const expireTime = localStorage.getItem(TOKEN_EXPIRE_KEY)
    if (!expireTime) return

    const msUntilExpiry = parseInt(expireTime, 10) - Date.now() - TOKEN_EXPIRY_BUFFER
    if (msUntilExpiry <= 0) {
      // Token already expired, logout immediately
      logout()
      return
    }

    const timer = setTimeout(() => {
      logout()
    }, msUntilExpiry)

    return () => clearTimeout(timer)
  }, [accessToken, logout])

  // Handle OAuth redirect callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash

      if (!hash || !hash.includes('access_token')) {
        return
      }

      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      const expiresIn = params.get('expires_in')
      const error = params.get('error')
      const returnedState = params.get('state')

      // Handle OAuth error
      if (error) {
        if (import.meta.env.DEV) {
          console.error('OAuth error:', error)
        }
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      // CSRF validation: Verify state parameter
      const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
      
      // Debug logging in development
      if (import.meta.env.DEV) {
        console.log('[AuthContext] OAuth callback state validation:', {
          returnedState,
          storedState,
          match: returnedState === storedState,
        })
      }

      // State validation
      if (!storedState) {
        // No stored state - could be tab restore, HMR reload, or expired session
        if (import.meta.env.DEV) {
          console.warn('[AuthContext] No stored OAuth state found - session may have expired')
        }
        // In production, reject for security. In dev, allow for easier testing.
        if (!import.meta.env.DEV) {
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      } else if (returnedState !== storedState) {
        // State mismatch - possible CSRF attack
        if (import.meta.env.DEV) {
          console.error('[AuthContext] OAuth state mismatch - possible CSRF attack', {
            expected: storedState,
            received: returnedState,
          })
        }
        sessionStorage.removeItem(OAUTH_STATE_KEY)
        window.history.replaceState(null, '', window.location.pathname)
        return
      }
      
      // Clean up state
      sessionStorage.removeItem(OAUTH_STATE_KEY)

      if (token) {
        // Calculate expiration time
        const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600
        const expireTime = Date.now() + expiresInSeconds * 1000

        // Store token
        setAccessToken(token)
        localStorage.setItem(TOKEN_STORAGE_KEY, token)
        localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString())

        // Fetch user info
        await fetchUserInfo(token)

        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    handleOAuthCallback()
  }, [fetchUserInfo])

  // Computed state
  const isAuthenticated = !!accessToken && !isTokenExpired()

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        isLoading,
        userInfo,
        login,
        logout,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}






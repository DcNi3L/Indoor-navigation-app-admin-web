import { api } from "./authApiService"
import Cookies from "js-cookie"
import toast from "react-hot-toast"

let refreshIntervalId: ReturnType<typeof setInterval> | null = null
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null
let retryCount = 0
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 5000 // 5 seconds

// Token expiry tracking
const TOKEN_EXPIRY_KEY = "token_expiry"
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry

/**
 * Get token expiry time from localStorage
 */
const getTokenExpiry = (): number | null => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  return expiry ? Number.parseInt(expiry, 10) : null
}

/**
 * Set token expiry time in localStorage
 */
const setTokenExpiry = (expiryTime: number) => {
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

/**
 * Calculate time until token refresh is needed
 */
const getTimeUntilRefresh = (): number => {
  const expiry = getTokenExpiry()
  if (!expiry) return 0

  const now = Date.now()
  const refreshTime = expiry - TOKEN_REFRESH_BUFFER
  return Math.max(0, refreshTime - now)
}

/**
 * Perform token refresh with retry logic
 */
const performTokenRefresh = async (): Promise<boolean> => {
  const refreshToken = Cookies.get("refreshToken")

  if (!refreshToken) {
    console.warn("[Auth] No refresh token available")
    logout()
    return false
  }

  try {
    const { data } = await api.get("/reissue-token", {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      timeout: 10000, // 10 second timeout
    })

    if (data?.accessToken) {
      const expiryTime = Date.now() + 3400 * 1000 // 3400 seconds from now

      Cookies.set("accessToken", data.accessToken, { expires: 3400 / 86400 })
      setTokenExpiry(expiryTime)

      retryCount = 0 // Reset retry count on success
      console.log("[Auth] Access token refreshed successfully")

      // Schedule next refresh
      scheduleNextRefresh()
      return true
    } else {
      throw new Error("Access token missing in response")
    }
  } catch (error: any) {
    console.error("[Auth] Token refresh failed:", error)

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      retryCount++
      console.log(`[Auth] Retrying token refresh (${retryCount}/${MAX_RETRY_ATTEMPTS}) in ${RETRY_DELAY}ms`)

      refreshTimeoutId = setTimeout(() => {
        performTokenRefresh()
      }, RETRY_DELAY * retryCount) // Exponential backoff

      return false
    } else {
      toast.error("Session expired. Please log in again.")
      logout()
      return false
    }
  }
}

/**
 * Schedule the next token refresh
 */
const scheduleNextRefresh = () => {
  // Clear existing timers
  if (refreshIntervalId) clearInterval(refreshIntervalId)
  if (refreshTimeoutId) clearTimeout(refreshTimeoutId)

  const timeUntilRefresh = getTimeUntilRefresh()

  if (timeUntilRefresh > 0) {
    console.log(`[Auth] Next token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`)

    refreshTimeoutId = setTimeout(() => {
      performTokenRefresh()
    }, timeUntilRefresh)
  } else {
    // Token is already expired or about to expire, refresh immediately
    performTokenRefresh()
  }
}

/**
 * Initialize token refresh scheduling
 */
export const scheduleTokenRefresh = () => {
  const accessToken = Cookies.get("accessToken")
  const refreshToken = Cookies.get("refreshToken")

  if (!accessToken || !refreshToken) {
    console.warn("[Auth] Missing tokens, cannot schedule refresh")
    return
  }

  // Set initial expiry if not set
  if (!getTokenExpiry()) {
    const expiryTime = Date.now() + 3400 * 1000
    setTokenExpiry(expiryTime)
  }

  scheduleNextRefresh()
}

/**
 * Stop all token refresh timers
 */
export const stopTokenRefresh = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
    refreshIntervalId = null
  }
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId)
    refreshTimeoutId = null
  }
  retryCount = 0
}

/**
 * Check if token needs immediate refresh
 */
export const shouldRefreshToken = (): boolean => {
  const expiry = getTokenExpiry()
  if (!expiry) return true

  const now = Date.now()
  return now >= expiry - TOKEN_REFRESH_BUFFER
}

/**
 * Manual token refresh
 */
export const refreshTokenNow = async (): Promise<boolean> => {
  stopTokenRefresh()
  return await performTokenRefresh()
}

/**
 * Clear tokens and stop auto-refresh
 */
export const logout = () => {
  Cookies.remove("accessToken")
  Cookies.remove("refreshToken")
  Cookies.remove("userEmail")
  Cookies.remove("userId")
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  stopTokenRefresh()

  // Delay navigation to ensure cleanup
  setTimeout(() => {
    window.location.href = "/login"
  }, 100)
}

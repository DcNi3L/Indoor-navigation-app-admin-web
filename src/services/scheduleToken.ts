import { api } from "./authApiService"
import Cookies from "js-cookie"
import toast from "react-hot-toast"
import { queryClient } from '../queryClient';

let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null
let retryCount = 0
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_BASE = 5000 // 5 seconds

const TOKEN_EXPIRY_KEY = "token_expiry"
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry

// --- Начало: Добавлено для управления состоянием обновления ---
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null
// --- Конец: Добавлено для управления состоянием обновления ---

const getTokenExpiry = (): number | null => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  return expiry ? Number.parseInt(expiry, 10) : null
}

const setTokenExpiry = (expiryTime: number) => {
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

const getTimeUntilRefresh = (): number => {
  const expiry = getTokenExpiry()
  if (!expiry) return 0

  const now = Date.now()
  const refreshTime = expiry - TOKEN_REFRESH_BUFFER
  return Math.max(0, refreshTime - now)
}

const performTokenRefreshInternal = async (): Promise<boolean> => {
  const refreshToken = Cookies.get("refreshToken")

  if (!refreshToken) {
    console.warn("[Auth] No refresh token available for internal refresh")
    // Не вызываем logout() здесь напрямую, чтобы дать возможность перехватчикам обработать
    return false
  }

  try {
    // Используем отдельный экземпляр axios или прямой fetch для /reissue-token,
    // чтобы избежать зацикливания интерцепторов основного 'api' экземпляра.
    // В данном примере, предположим, что api.get не будет вызывать интерцепторы,
    // но в реальном проекте лучше создать отдельный экземпляр axios без интерцепторов для этого.
    // Или, если 'api' из authApiService.ts, убедиться, что он не вызывает сам себя.
    // Для простоты оставим как есть, но это ВАЖНЫЙ МОМЕНТ.
    // Можно передать специальный заголовок, чтобы интерцептор проигнорировал этот запрос.
    const { data } = await api.get("/reissue-token", {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'X-Skip-Interceptor': 'true', // Пример флага для пропуска интерцептора
      },
      timeout: 10000,
    })

    if (data?.accessToken) {
      const expiryTime = Date.now() + 3400 * 1000
      Cookies.set("accessToken", data.accessToken, { expires: 3400 / 86400 })
      setTokenExpiry(expiryTime)
      retryCount = 0
      console.log("[Auth] Access token refreshed successfully (internal)")
      scheduleNextRefresh() // Перепланируем следующее авто-обновление
      return true
    } else {
      throw new Error("Access token missing in response")
    }
  } catch (error: any) {
    console.error("[Auth] Token refresh failed (internal):", error)
    // Не вызываем logout() здесь напрямую
    return false
  }
}

export const performTokenRefresh = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    console.log("[Auth] Token refresh already in progress, awaiting existing promise.")
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    const refreshTokenValue = Cookies.get("refreshToken")
    if (!refreshTokenValue) {
      console.warn("[Auth] No refresh token available.")
      logout() // Если нет refresh токена, сразу выходим
      isRefreshing = false
      return false
    }

    let success = false
    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt -1); // Экспоненциальная задержка
        console.log(`[Auth] Retrying token refresh (${attempt}/${MAX_RETRY_ATTEMPTS}) in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      success = await performTokenRefreshInternal()
      if (success) {
        break
      }
    }

    if (!success) {
      toast.error("Session expired. Please log in again.")
      logout() // Если все попытки неудачны, выходим
    }
    
    isRefreshing = false
    refreshPromise = null // Очищаем промис после завершения
    return success
  })()

  return refreshPromise
}


const scheduleNextRefresh = () => {
  if (refreshTimeoutId) clearTimeout(refreshTimeoutId)

  const timeUntilRefresh = getTimeUntilRefresh()

  if (timeUntilRefresh > 0) {
    console.log(`[Auth] Next token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`)
    refreshTimeoutId = setTimeout(() => {
      performTokenRefresh() // Используем общую функцию с управлением состоянием
    }, timeUntilRefresh)
  } else {
    // Если токен уже истек или почти истек, и нет активного процесса обновления
    if (Cookies.get("accessToken") && Cookies.get("refreshToken")) { // Только если есть токены
        console.log("[Auth] Token expired or about to expire, attempting refresh.")
        performTokenRefresh()
    }
  }
}

export const scheduleTokenRefresh = () => {
  const accessToken = Cookies.get("accessToken")
  const refreshToken = Cookies.get("refreshToken")

  if (!accessToken || !refreshToken) {
    console.warn("[Auth] Missing tokens, cannot schedule refresh")
    return
  }

  if (!getTokenExpiry()) {
    // Предположим, что токен только что получен, устанавливаем его время жизни
    // Это значение должно соответствовать реальному времени жизни токена с бэкенда
    const expiryTime = Date.now() + 3400 * 1000 // Пример: 56 минут (3400 сек)
    setTokenExpiry(expiryTime)
    console.log("[Auth] Initial token expiry set.")
  }

  scheduleNextRefresh()
}

export const stopTokenRefresh = () => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId)
    refreshTimeoutId = null
  }
  retryCount = 0 // Сбрасываем счетчик при явной остановке
  // Не сбрасываем isRefreshing и refreshPromise здесь, так как текущее обновление может быть важным
}

export const shouldRefreshToken = (): boolean => {
  const expiry = getTokenExpiry()
  if (!expiry) return true // Если нет информации о времени жизни, лучше обновить

  const now = Date.now()
  return now >= expiry - TOKEN_REFRESH_BUFFER
}

export const refreshTokenNow = async (): Promise<boolean> => {
  console.log("[Auth] Manual token refresh initiated.")
  stopTokenRefresh() // Останавливаем запланированные, чтобы не конфликтовать
  return await performTokenRefresh()
}

export const logout = () => {
  console.log("[Auth] Logging out...")
  Cookies.remove("accessToken")
  Cookies.remove("refreshToken")
  Cookies.remove("userEmail")
  Cookies.remove("userId")
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  stopTokenRefresh()

  isRefreshing = false // Сбрасываем флаг при выходе
  refreshPromise = null 

  queryClient.clear();

  setTimeout(() => {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login"
    }
  }, 100)
}
import axios from "axios"
import Cookies from "js-cookie"
import { refreshTokenNow, shouldRefreshToken } from "./scheduleToken"

const api = axios.create({
  baseURL: process.env.REACT_APP_INDOOR_URL,
  withCredentials: true,
  timeout: 20000, // 20 second timeout for indoor API
})

// Request interceptor with token refresh logic
api.interceptors.request.use(
  async (config) => {
    const accessToken = Cookies.get("accessToken")

    if (accessToken) {
      // Check if token needs refresh
      if (shouldRefreshToken()) {
        console.log("[IndoorAPI] Token needs refresh, refreshing before request")
        await refreshTokenNow()
        const newToken = Cookies.get("accessToken")
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      } else {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshed = await refreshTokenNow()
        if (refreshed) {
          const newToken = Cookies.get("accessToken")
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        console.error("[IndoorAPI] Token refresh failed:", refreshError)
        // Don't redirect here, let the auth service handle it
      }
    }

    return Promise.reject(error)
  },
)

export default api

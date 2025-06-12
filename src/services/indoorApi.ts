import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-hot-toast"

const api = axios.create({
  baseURL: process.env.REACT_APP_INDOOR_URL,
  timeout: 10000, // Reduced from 15000 to 10000ms
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error("[API] Request error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API] Response error:", error)

    // Handle different error types
    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please check your connection.")
      return Promise.reject(new Error("Request timeout"))
    }

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      switch (status) {
        case 401:
          toast.error("Authentication failed. Please login again.")
          // Clear auth cookies
          Cookies.remove("accessToken")
          Cookies.remove("refreshToken")
          Cookies.remove("userEmail")
          // Redirect to login
          window.location.href = "/login"
          break
        case 403:
          toast.error("Access denied. Insufficient permissions.")
          break
        case 404:
          toast.error("Resource not found.")
          break
        case 500:
          toast.error("Server error. Please try again later.")
          break
        default:
          toast.error(data?.message || `Error: ${status}`)
      }
    } else if (error.request) {
      // Network error
      toast.error("Network error. Please check your connection.")
    } else {
      // Other error
      toast.error("An unexpected error occurred.")
    }

    return Promise.reject(error)
  },
)

export default api

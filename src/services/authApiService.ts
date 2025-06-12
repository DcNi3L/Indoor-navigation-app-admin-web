import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "react-hot-toast"
import Cookies from "js-cookie"
import { refreshTokenNow, shouldRefreshToken } from "./scheduleToken"

export const api = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  withCredentials: true,
  timeout: 15000, // 15 second timeout
})

// Request interceptor for token refresh
api.interceptors.request.use(
  async (config) => {
    const accessToken = Cookies.get("accessToken")

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`

      // Check if token needs refresh before making request
      if (shouldRefreshToken()) {
        console.log("[Auth] Token needs refresh, refreshing before request")
        await refreshTokenNow()
        const newToken = Cookies.get("accessToken")
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for handling 401 errors
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
        console.error("[Auth] Token refresh failed in interceptor:", refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// ===========================
// 🔹 API Functions
// ===========================
const loginPanelUser = async (data: {
  email: string
  password: string
}) => {
  const response = await api.post("/admin/sign-in", data, {
    headers: { "Content-Type": "application/json" },
  })
  return response.data
}

const registerPanelUser = async (data: {
  email: string
  password: string
  firstName: string
  lastName: string
  pictureUrl?: string
}) => {
  const response = await api.post("/admin/sign-up", data, {
    headers: { "Content-Type": "application/json" },
  })
  return response.data
}

export const fetchUserByEmail = async (email: string) => {
  if (!email) throw new Error("Email is required")

  const res = await api.get("/user", { params: { email } })
  return res.data
}

const fetchAllAdmins = async () => {
  const res = await api.get("/admins")
  return res.data
}

const updateUserProfile = async (
  email: string,
  data: {
    email?: string
    password?: string
    firstName?: string
    lastName?: string
    pictureUrl?: string
  },
) => {
  const response = await api.put(`/api/users/${email}`, data, {
    headers: { "Content-Type": "application/json" },
  })
  return response.data
}

const deleteUserProfile = async (email: string) => {
  const response = await api.delete(`/api/users/${email}`)
  return response.data
}

// ===========================
// 🔹 React Query Hooks
// ===========================
export const usePanelLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loginPanelUser,
    onSuccess: (data, variables) => {
      toast.success("Login successful")

      // Pre-populate user cache
      queryClient.setQueryData(["user", variables.email], data.user)

      // Prefetch admin list if user is admin
      queryClient.prefetchQuery({
        queryKey: ["admins"],
        queryFn: fetchAllAdmins,
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    },
    onError: (error: any) => {
      console.error("Login error:", error)
      const message = error?.response?.data?.message || "Login failed"
      toast.error(message)
    },
  })
}

export const usePanelRegister = () => {
  return useMutation({
    mutationFn: registerPanelUser,
    onSuccess: () => {
      toast.success("Registration successful")
    },
    onError: (error: any) => {
      console.error("Registration error:", error)
      const message = error?.response?.data?.message || "Registration failed"
      toast.error(message)
    },
  })
}

export const useUserByEmail = (email: string) => {
  return useQuery({
    queryKey: ["user", email],
    queryFn: () => fetchUserByEmail(email),
    enabled: !!email,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (replaces cacheTime)
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (user not found)
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export const useAllAdmins = () => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: fetchAllAdmins,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, data }: { email: string; data: any }) => updateUserProfile(email, data),
    onSuccess: (data, variables) => {
      toast.success("Profile updated successfully")

      // Update user cache with new data
      queryClient.setQueryData(["user", variables.data.email || variables.email], data)

      // If email changed, also invalidate old email cache
      if (variables.data.email && variables.data.email !== variables.email) {
        queryClient.removeQueries({ queryKey: ["user", variables.email] })
      }

      // Invalidate admin list to refresh data
      queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    onError: (error: any) => {
      console.error("Profile update error:", error)
      const message = error?.response?.data?.message || "Failed to update profile"
      toast.error(message)
    },
  })
}

export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUserProfile,
    onSuccess: (data, email) => {
      toast.success("Profile deleted successfully")

      // Remove user from cache
      queryClient.removeQueries({ queryKey: ["user", email] })

      // Invalidate admin list
      queryClient.invalidateQueries({ queryKey: ["admins"] })

      // Clear cookies and redirect to login
      Cookies.remove("accessToken")
      Cookies.remove("refreshToken")
      Cookies.remove("userEmail")
      Cookies.remove("userId")

      // Redirect to login page
      window.location.href = "/login"
    },
    onError: (error: any) => {
      console.error("Profile deletion error:", error)
      const message = error?.response?.data?.message || "Failed to delete profile"
      toast.error(message)
    },
  })
}

// Utility function to invalidate auth-related queries
export const useInvalidateAuthQueries = () => {
  const queryClient = useQueryClient()

  return {
    invalidateUser: (email?: string) => {
      if (email) {
        queryClient.invalidateQueries({ queryKey: ["user", email] })
      } else {
        queryClient.invalidateQueries({ queryKey: ["user"] })
      }
    },
    invalidateAdmins: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
  }
}

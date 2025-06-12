import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "react-hot-toast"
import Cookies from "js-cookie"
import { refreshTokenNow, shouldRefreshToken } from "./scheduleToken"

export const api = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  withCredentials: true,
  timeout: 8000, // Reduced timeout
})

// Simplified request interceptor
api.interceptors.request.use(
  async (config) => {
    const accessToken = Cookies.get("accessToken")

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`

      // Only refresh if really needed
      if (shouldRefreshToken()) {
        try {
          await refreshTokenNow()
          const newToken = Cookies.get("accessToken")
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`
          }
        } catch (error) {
          console.error("[Auth] Token refresh failed:", error)
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Simplified response interceptor
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
        // Clear auth and redirect
        Cookies.remove("accessToken")
        Cookies.remove("refreshToken")
        Cookies.remove("userEmail")
        window.location.href = "/login"
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
  const response = await api.put(`/user/${email}`, data, {
    headers: { "Content-Type": "application/json" },
  })
  return response.data
}

const deleteUserProfile = async (email: string) => {
  const response = await api.delete(`/user/${email}`)
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
      queryClient.setQueryData(["user", variables.email], data.user)
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Reduced retry
    retryDelay: 1000, // Fixed delay instead of exponential
  })
}

export const useAllAdmins = () => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: fetchAllAdmins,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, data }: { email: string; data: any }) => updateUserProfile(email, data),
    onSuccess: (data, variables) => {
      toast.success("Profile updated successfully")
      queryClient.setQueryData(["user", variables.data.email || variables.email], data)

      if (variables.data.email && variables.data.email !== variables.email) {
        queryClient.removeQueries({ queryKey: ["user", variables.email] })
      }

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
      queryClient.removeQueries({ queryKey: ["user", email] })
      queryClient.invalidateQueries({ queryKey: ["admins"] })

      Cookies.remove("accessToken")
      Cookies.remove("refreshToken")
      Cookies.remove("userEmail")
      Cookies.remove("userId")

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

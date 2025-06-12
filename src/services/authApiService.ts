import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { toast } from "react-hot-toast"
import Cookies from "js-cookie"
// Убедитесь, что импортируете обновленную performTokenRefresh
import { performTokenRefresh, shouldRefreshToken, logout } from "./scheduleToken" 

export const api = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  withCredentials: true,
  timeout: 15000, // Увеличим общий таймаут для запросов
})

// --- Начало: Для управления очередью запросов во время обновления токена ---
let isRefreshingToken = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

const processFailedQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}
// --- Конец: Для управления очередью запросов ---


api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Пропускаем интерцептор для запроса на обновление токена
    if (config.headers?.['X-Skip-Interceptor']) {
        return config;
    }

    let accessToken = Cookies.get("accessToken")

    // Если токен нужно обновить и нет активного процесса обновления
    if (accessToken && shouldRefreshToken() && !isRefreshingToken) {
      console.log("[Request Interceptor] Token needs refresh, attempting.")
      isRefreshingToken = true // Устанавливаем флаг перед вызовом
      try {
        const refreshed = await performTokenRefresh() // Используем общую функцию
        if (refreshed) {
          accessToken = Cookies.get("accessToken") // Получаем обновленный токен
          console.log("[Request Interceptor] Token refreshed successfully.")
          processFailedQueue(null) // Обрабатываем очередь после успешного обновления
        } else {
          console.warn("[Request Interceptor] Token refresh failed.")
          // Если обновление не удалось, logout() уже был вызван внутри performTokenRefresh
          processFailedQueue(new axios.AxiosError("Token refresh failed", "ERR_NETWORK", config))
          return Promise.reject(new axios.AxiosError("Token refresh failed, logging out.", "ERR_UNAUTHORIZED", config))
        }
      } catch (error) {
        console.error("[Request Interceptor] Error during token refresh:", error)
        processFailedQueue(error as AxiosError)
         // logout() будет вызван в performTokenRefresh при ошибке
        return Promise.reject(error)
      } finally {
        isRefreshingToken = false
      }
    }
    
    // Если токен обновляется, добавляем запрос в очередь
    if (isRefreshingToken) {
        console.log("[Request Interceptor] Token is refreshing, queuing request.")
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve: () => resolve(config), reject });
        }).then(async () => {
            // После разрешения промиса из очереди, снова получаем актуальный токен
            const newAccessToken = Cookies.get("accessToken");
            if (newAccessToken) {
                config.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return config; // Возвращаем обновленный config
        });
    }


    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Пропускаем интерцептор для запроса на обновление токена
    if (originalRequest.headers?.['X-Skip-Interceptor']) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // Помечаем запрос как повторный

      if (isRefreshingToken) {
        console.log("[Response Interceptor] Token is refreshing, queuing request after 401.")
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve: () => resolve(api(originalRequest)), reject });
        });
      }
      
      console.log("[Response Interceptor] Received 401, attempting token refresh.")
      isRefreshingToken = true
      try {
        const refreshed = await performTokenRefresh() // Используем общую функцию
        if (refreshed) {
          const newToken = Cookies.get("accessToken")
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          processFailedQueue(null)
          return api(originalRequest) // Повторяем оригинальный запрос
        } else {
          // logout() уже был вызван в performTokenRefresh
          processFailedQueue(error) // Отклоняем запросы из очереди
          return Promise.reject(error) // Отклоняем текущий запрос
        }
      } catch (refreshError) {
        console.error("[Response Interceptor] Token refresh failed:", refreshError)
        processFailedQueue(refreshError as AxiosError)
        // logout() уже был вызван в performTokenRefresh
        return Promise.reject(refreshError)
      } finally {
        isRefreshingToken = false
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
  // После успешного логина, сразу планируем обновление токена
  if (response.data?.accessToken && response.data?.refreshToken) {
    const expiryTime = Date.now() + 3400 * 1000 // Установите корректное время жизни
    Cookies.set("accessToken", response.data.accessToken, { expires: 3400 / 86400 })
    Cookies.set("refreshToken", response.data.refreshToken, { expires: 7 }) // Пример: refresh токен на 7 дней
    localStorage.setItem("token_expiry", expiryTime.toString()) // Используем TOKEN_EXPIRY_KEY
    
    // Импортируем scheduleTokenRefresh здесь, чтобы избежать проблем с импортом на верхнем уровне
    const { scheduleTokenRefresh } = await import("./scheduleToken");
    scheduleTokenRefresh();
  }
  return response.data
}

// ... (остальные API функции без изменений) ...
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
  // Аналогично логину, если регистрация сразу логинит пользователя
  if (response.data?.accessToken && response.data?.refreshToken) {
    const expiryTime = Date.now() + 3400 * 1000 
    Cookies.set("accessToken", response.data.accessToken, { expires: 3400 / 86400 })
    Cookies.set("refreshToken", response.data.refreshToken, { expires: 7 }) 
    localStorage.setItem("token_expiry", expiryTime.toString())
    
    const { scheduleTokenRefresh } = await import("./scheduleToken");
    scheduleTokenRefresh();
  }
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
      if (data.user) { // Проверяем наличие user в ответе
        queryClient.setQueryData(["user", variables.email], data.user)
      }
      // scheduleTokenRefresh() уже вызывается внутри loginPanelUser
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
      // scheduleTokenRefresh() уже вызывается внутри registerPanelUser, если он логинит
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
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 1, 
    retryDelay: 2000, // Увеличим немного задержку для повтора
  })
}

export const useAllAdmins = () => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: fetchAllAdmins,
    staleTime: 10 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
    retry: 1,
    retryDelay: 2000,
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
      logout() // Вызываем logout для очистки всего и редиректа
    },
    onError: (error: any) => {
      console.error("Profile deletion error:", error)
      const message = error?.response?.data?.message || "Failed to delete profile"
      toast.error(message)
    },
  })
}


export const useInvalidateAuthQueries = () => {
  const queryClient = useQueryClient()
  return {
    invalidateUser: (email?: string) => {
      queryClient.invalidateQueries({ queryKey: ["user", ...(email ? [email] : [])] })
    },
    invalidateAdmins: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    invalidateAllAuth: () => { // Переименовал для ясности
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    clearClientCache: () => { // Добавил функцию для полной очистки кеша
        queryClient.clear();
    }
  }
}

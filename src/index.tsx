import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./components/context/AuthContext"
import { Toaster } from "react-hot-toast"
import "./i18n"

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced from 2 to 1
      staleTime: 2 * 60 * 1000, // Reduced from 5 to 2 minutes
      gcTime: 5 * 60 * 1000, // Reduced from 10 to 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disabled to prevent unnecessary requests
      refetchOnMount: true,
      networkMode: "online", // Only run queries when online
    },
    mutations: {
      retry: 0, // No retry for mutations to prevent hanging
      networkMode: "online",
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

// Render app
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000, // Reduced duration
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              border: "1px solid #374151",
            },
            success: {
              style: {
                background: "#065f46",
                color: "#d1fae5",
                border: "1px solid #10b981",
              },
            },
            error: {
              style: {
                background: "#7f1d1d",
                color: "#fecaca",
                border: "1px solid #ef4444",
              },
            },
            loading: {
              style: {
                background: "#1e40af",
                color: "#dbeafe",
                border: "1px solid #3b82f6",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./components/context/AuthContext"
import { Toaster } from "react-hot-toast"
import "./i18n"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
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
            duration: 4000,
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
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

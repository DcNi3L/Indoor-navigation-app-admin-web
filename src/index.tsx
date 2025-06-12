import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { Toaster } from "react-hot-toast"
import "./i18n"
import "./index.css"
import App from "./App"
import { AuthProvider } from "./components/context/AuthContext"
import InstallPrompt from "./components/ui/installPrompt"
import UpdatePrompt from "./components/ui/updatePrompt"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 2,
    },
  },
} as any)

// Set a global cache time for all queries
queryClient.setDefaultOptions({
  queries: {
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
} as any)

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)

        // Check for updates every hour
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000,
        )
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="bottom-right" reverseOrder={false} />
        <InstallPrompt />
        <UpdatePrompt />
        {/* <GlobalLoading /> */}
        <div className="h-screen overflow-y-scroll scrollbar-hidden">
          <App />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

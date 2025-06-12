/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
const CACHE_NAME = "indoor-admin-v1.0.0"
const STATIC_CACHE_NAME = "indoor-admin-static-v1.0.0"
const DYNAMIC_CACHE_NAME = "indoor-admin-dynamic-v1.0.0"

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/logo.svg",
  // Add other critical assets
]

// API endpoints to cache
const API_CACHE_PATTERNS = [/\/api\/buildings/, /\/api\/floors/, /\/api\/routes/, /\/api\/auth/]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("Service Worker: Static assets cached")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static assets", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker: Activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle API requests
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(request)
          })
      }),
    )
    return
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Cache the response
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.destination === "document") {
            return caches.match("/")
          }
        })
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle offline actions when back online
      handleBackgroundSync(),
    )
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received")

  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Indoor Admin", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked")

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Handle any queued offline actions
    const offlineActions = await getOfflineActions()

    for (const action of offlineActions) {
      try {
        await processOfflineAction(action)
        await removeOfflineAction(action.id)
      } catch (error) {
        console.error("Failed to process offline action:", error)
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}

// Placeholder functions for offline action handling
async function getOfflineActions() {
  // Implement logic to retrieve offline actions from IndexedDB
  return []
}

async function processOfflineAction(action) {
  // Implement logic to process offline actions
  console.log("Processing offline action:", action)
}

async function removeOfflineAction(actionId) {
  // Implement logic to remove processed offline actions
  console.log("Removing offline action:", actionId)
}

// Update notification
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

"use client"

import { useState, useEffect } from "react"
import { FiRefreshCw, FiX } from "react-icons/fi"
import { useTranslation } from "react-i18next"

export default function UpdatePrompt() {
  const { t } = useTranslation()
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker)
                setShowUpdatePrompt(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiRefreshCw className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{t("updateAvailable")}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">{t("updateAvailableDescription")}</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-1">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t("updateNow")}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {t("later")}
          </button>
        </div>
      </div>
    </div>
  )
}

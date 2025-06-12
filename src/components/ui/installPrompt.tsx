"use client"

import { useState, useEffect } from "react"
import { FiDownload, FiX, FiSmartphone, FiMonitor } from "react-icons/fi"
import { useTranslation } from "react-i18next"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isInstalled = isStandaloneMode || isIOSStandalone

      setIsStandalone(isStandaloneMode || isIOSStandalone)
      setIsInstalled(isInstalled)
    }

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkInstallation()
    checkIOS()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after a delay if not already installed
      if (!isInstalled) {
        setTimeout(() => {
          const dismissed = localStorage.getItem("install-prompt-dismissed")
          if (!dismissed) {
            setShowPrompt(true)
          }
        }, 10000) // Show after 10 seconds
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      localStorage.removeItem("install-prompt-dismissed")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("Error during installation:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("install-prompt-dismissed", "true")

    // Show again after 7 days
    setTimeout(
      () => {
        localStorage.removeItem("install-prompt-dismissed")
      },
      7 * 24 * 60 * 60 * 1000,
    )
  }

  const handleManualInstall = () => {
    setShowPrompt(false)
    // Show manual installation instructions
    alert(t("manualInstallInstructions"))
  }

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FiDownload className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t("installApp")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("installAppDescription")}</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <FiSmartphone size={16} />
          <span>{t("worksOffline")}</span>
          <span>•</span>
          <FiMonitor size={16} />
          <span>{t("fastAccess")}</span>
        </div>

        <div className="flex gap-2">
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t("install")}
            </button>
          ) : isIOS ? (
            <button
              onClick={handleManualInstall}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t("howToInstall")}
            </button>
          ) : null}

          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {t("later")}
          </button>
        </div>
      </div>
    </div>
  )
}

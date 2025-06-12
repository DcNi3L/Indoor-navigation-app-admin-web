"use client"

import { useIsFetching, useIsMutating } from "@tanstack/react-query"
import { ClipLoader } from "react-spinners"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"

export default function GlobalLoading() {
  const { t } = useTranslation()
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  const isLoading = isFetching > 0 || isMutating > 0

  // Don't show loading for very quick requests
  if (!isLoading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center">
          <ClipLoader color="#6366f1" size={40} />
          <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm font-medium">
            {isMutating > 0 ? t("saving") : t("loading")}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

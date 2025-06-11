"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { useTranslation } from "react-i18next"
import { FaTrash, FaSpinner } from "react-icons/fa"

interface StorageChartProps {
  usedSize: number
  totalSize: number
  onClearStorage: () => void
  isClearing: boolean
}

export default function StorageChart({ usedSize, totalSize, onClearStorage, isClearing }: StorageChartProps) {
  const { t } = useTranslation()

  const freeSize = Math.max(0, totalSize - usedSize)
  const usagePercentage = Math.round((usedSize / totalSize) * 100)

  const storageData = [
    { name: t("used"), value: usedSize, color: "#EF4444" },
    { name: t("free"), value: freeSize, color: "#10B981" },
  ]

  const getUsageColor = () => {
    if (usagePercentage >= 90) return "text-red-500"
    if (usagePercentage >= 70) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide mb-6">{t("storageUsage")}</h2>

      {/* Usage Percentage */}
      <div className="text-center mb-4">
        <div className={`text-4xl font-bold ${getUsageColor()}`}>{usagePercentage}%</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("storageUsed")}</p>
      </div>

      {/* Pie Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={storageData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {storageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}MB`, ""]}
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Storage Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t("used")}</span>
          <span className="text-sm font-semibold text-red-500">{usedSize}MB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t("free")}</span>
          <span className="text-sm font-semibold text-green-500">{freeSize.toFixed(2)}MB</span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-sm font-medium text-gray-800 dark:text-white">{t("total")}</span>
          <span className="text-sm font-bold text-gray-800 dark:text-white">{totalSize}MB</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              usagePercentage >= 90 ? "bg-red-500" : usagePercentage >= 70 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Clear Storage Button */}
      <button
        onClick={onClearStorage}
        disabled={isClearing}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
          isClearing ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg"
        }`}
      >
        {isClearing ? (
          <>
            <FaSpinner className="animate-spin" />
            {t("clearingStorage")}
          </>
        ) : (
          <>
            <FaTrash />
            {t("clearStorage")}
          </>
        )}
      </button>
    </div>
  )
}

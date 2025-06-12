"use client"

import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useState, useMemo } from "react"
import { FaBuilding, FaMap, FaRoute, FaQrcode } from "react-icons/fa"

import ActionCard from "../components/ui/ActionCard"
import AdminCards from "../components/ui/AdminCard"
import StatisticsChart from "../components/ui/StatisticsChart"
import StorageChart from "../components/ui/StorageChart"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import ErrorBoundary from "../components/ui/ErrorBoundary"

import { useDeleteAllFilesInFolder, useFullBucketSize } from "../services/supabaseClient"
import { useAllAdmins } from "../services/authApiService"
import { useAllBuildings, useAllFloors } from "../services/useBuildingService"
import { useRouteStatistics } from "../components/hooks/useRouteStatistics"

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Data hooks
  const { data: admins = [], isLoading: adminsLoading } = useAllAdmins()
  const { data: storageResult = 0, isLoading: storageLoading } = useFullBucketSize("profile-images")
  const { data: buildings = [], isLoading: buildingsLoading } = useAllBuildings()
  const { data: floors = [], isLoading: floorsLoading } = useAllFloors()
  const { routeCounts, totalRoutes, isLoading: routesLoading } = useRouteStatistics()

  // Local state
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteAllFilesMutation = useDeleteAllFilesInFolder()

  // Computed values
  const storageSize = useMemo(() => Number(((storageResult as any) / (1024 * 1024)).toFixed(2)), [storageResult])

  const qrCodes = useMemo(() => JSON.parse(localStorage.getItem("qrList") || "[]"), [])

  const isLoading = buildingsLoading || floorsLoading || routesLoading || storageLoading

  const systemStats = useMemo(
    () => [
      {
        name: t("buildings"),
        value: buildings.length,
        to: "buildings",
        icon: FaBuilding,
        color: "#6366F1",
      },
      {
        name: t("floors"),
        value: floors.length,
        to: "floors",
        icon: FaMap,
        color: "#34D399",
      },
      {
        name: t("routes"),
        value: totalRoutes,
        to: "routes",
        icon: FaRoute,
        color: "#FBBF24",
      },
      {
        name: t("qrPoints"),
        value: qrCodes.length,
        to: "qr",
        icon: FaQrcode,
        color: "#F87171",
      },
    ],
    [buildings.length, floors.length, totalRoutes, qrCodes.length, t],
  )

  const handleClearStorage = async () => {
    if (!window.confirm(t("confirmClearStorage"))) return

    setIsDeleting(true)
    try {
      await deleteAllFilesMutation.mutateAsync({
        bucketName: "profile-images",
        path: "",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const quickActions = [
    {
      color: "bg-indigo-500 hover:bg-indigo-600",
      icon: <FaBuilding size={28} />,
      title: t("addBuilding"),
      onClick: () => navigate("/buildings"),
      description: t("manageBuildings"),
    },
    {
      color: "bg-green-500 hover:bg-green-600",
      icon: <FaMap size={28} />,
      title: t("uploadFloor"),
      onClick: () => navigate("/floors"),
      description: t("manageFloorPlans"),
    },
    {
      color: "bg-yellow-400 hover:bg-yellow-500",
      icon: <FaRoute size={28} />,
      title: t("createRoute"),
      onClick: () => navigate("/routes"),
      description: t("setupNavigation"),
    },
    {
      color: "bg-red-500 hover:bg-red-600",
      icon: <FaQrcode size={28} />,
      title: t("scanQR"),
      onClick: () => navigate("/qr"),
      description: t("manageQRCodes"),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-8 mt-12 dark:bg-gray-900 min-h-screen">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <div
              key={stat.name}
              onClick={() => navigate(`/${stat.to}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Statistics Chart */}
          <div className="xl:col-span-2">
            <StatisticsChart
              data={systemStats}
              title={t("systemEntities")}
              onBarClick={(data) => navigate(`/${data.to}`)}
            />
          </div>

          {/* Storage Chart */}
          <div className="xl:col-span-1">
            <StorageChart
              usedSize={storageSize}
              totalSize={50}
              onClearStorage={handleClearStorage}
              isClearing={isDeleting || deleteAllFilesMutation.status === "pending"}
            />
          </div>
        </div>

        {/* Route Statistics by Floor */}
        {routeCounts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t("routesByFloor")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {routeCounts.map((route) => (
                <div key={route.floorId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("floor")} {route.floorId}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{route.routeCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{t("routes")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Cards */}
        {Array.isArray(admins) && admins.length > 0 && (
          <AdminCards admins={admins} />
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t("quickActions")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <ActionCard
                key={index}
                color={action.color}
                icon={action.icon}
                title={action.title}
                onClick={action.onClick}
              />
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

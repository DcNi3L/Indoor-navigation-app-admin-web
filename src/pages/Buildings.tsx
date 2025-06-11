"use client"

import type React from "react"
import type { JSX } from "react"

import { useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import {
  FaEdit,
  FaTrash,
  FaHome,
  FaHospital,
  FaUniversity,
  FaPlus,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaCalendar,
  FaSpinner,
  FaExclamationTriangle,
  FaSortUp,
  FaSortDown,
  FaLayerGroup,
  FaMap,
  FaEye,
  FaList,
} from "react-icons/fa"
import { IoMdGrid } from "react-icons/io"
import { FaShop, FaXmark } from "react-icons/fa6"
import { useAllBuildings, useDeleteBuilding, useFloorsByBuildingId } from "../services/useBuildingService"
import { toast } from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

interface Building {
  id: number
  name: string
  address: string
  type: string
  userId: number
  globalPosition: { x: number; y: number }
  createdAt: string
  updatedAt: string
}

interface Floor {
  id: number
  name: string
  levelNumber: number
  dimensionWidth: number
  dimensionHeight: number
  floorPictureUrl?: string
  buildingId: number
}

interface DeleteConfirmation {
  buildingId: number | null
  isOpen: boolean
}

interface FloorSelectionModal {
  buildingId: number | null
  isOpen: boolean
}

const typeIconMap: Record<string, { icon: JSX.Element; color: string; bgColor: string }> = {
  HOUSE: {
    icon: <FaHome className="text-4xl" />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  MALL: {
    icon: <FaShop className="text-4xl" />,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  MEDICAL: {
    icon: <FaHospital className="text-4xl" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  EDUCATIONAL: {
    icon: <FaUniversity className="text-4xl" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
}

// Floor Selection Modal Component
const FloorSelectionModal = ({
  building,
  floors,
  isOpen,
  onClose,
  onFloorSelect,
  isLoading,
}: {
  building: Building | null
  floors: Floor[]
  isOpen: boolean
  onClose: () => void
  onFloorSelect: (floor: Floor) => void
  isLoading: boolean
}) => {
  const { t } = useTranslation()

  if (!isOpen || !building) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t("selectFloorToView")}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaXmark className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{building.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{building.address}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="text-blue-500 animate-spin text-2xl" />
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-8">
            <FaLayerGroup className="text-gray-300 dark:text-gray-600 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t("noFloorsAvailable")}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {floors
              .sort((a, b) => a.levelNumber - b.levelNumber)
              .map((floor) => (
                <div
                  key={floor.id}
                  onClick={() => onFloorSelect(floor)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <FaLayerGroup className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">{floor.name}</h5>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {t("level")} {floor.levelNumber}
                        </span>
                        {floor.dimensionWidth && floor.dimensionHeight && (
                          <span>
                            {floor.dimensionWidth}m × {floor.dimensionHeight}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaEye />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Buildings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State management
  const [filterType, setFilterType] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "created" | "type">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    buildingId: null,
    isOpen: false,
  })
  const [floorSelection, setFloorSelection] = useState<FloorSelectionModal>({
    buildingId: null,
    isOpen: false,
  })
  const [deletingBuildings, setDeletingBuildings] = useState<Set<number>>(new Set())

  const BUILDING_TYPES = ["ALL", "HOUSE", "MALL", "MEDICAL", "EDUCATIONAL"]

  // Data fetching
  const { data: buildings = [], isLoading, error, refetch } = useAllBuildings()
  const { mutateAsync: deleteBuilding } = useDeleteBuilding()

  // Get floors for the selected building
  const { data: selectedBuildingFloors = [], isLoading: isLoadingFloors } = useFloorsByBuildingId(
    floorSelection.buildingId || 0,
  )

  // Memoized computations
  const buildingNames = useMemo(() => {
    return buildings.map((b: Building) => b.name).filter(Boolean)
  }, [buildings])

  const suggestions = useMemo(() => {
    return buildingNames.filter((name: string) => name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
  }, [searchTerm, buildingNames])

  const filteredAndSortedBuildings = useMemo(() => {
    const filtered = buildings.filter((building: Building) => {
      const matchesType = filterType === "ALL" || building.type === filterType
      const matchesSearch =
        searchTerm.trim() === "" ||
        building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.address.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesType && matchesSearch
    })

    // Sort buildings
    filtered.sort((a: Building, b: Building) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "type":
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [buildings, filterType, searchTerm, sortBy, sortOrder])

  const stats = useMemo(() => {
    const typeStats = buildings.reduce(
      (acc, building) => {
        acc[building.type] = (acc[building.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: buildings.length,
      byType: typeStats,
    }
  }, [buildings])

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setShowSuggestions(true)
  }, [])

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
  }, [])

  const handleSort = useCallback(
    (newSortBy: typeof sortBy) => {
      if (sortBy === newSortBy) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      } else {
        setSortBy(newSortBy)
        setSortOrder("asc")
      }
    },
    [sortBy, sortOrder],
  )

  const handleDeleteClick = useCallback((e: React.MouseEvent, buildingId: number) => {
    e.stopPropagation()
    setDeleteConfirm({ buildingId, isOpen: true })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.buildingId) return

    setDeletingBuildings((prev) => new Set(prev).add(deleteConfirm.buildingId!))

    try {
      await deleteBuilding(deleteConfirm.buildingId)
      toast.success(t("buildingDeleted"))
      queryClient.invalidateQueries({ queryKey: ["allBuildings"] })
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(t("buildingDeleteError"))
    } finally {
      setDeletingBuildings((prev) => {
        const newSet = new Set(prev)
        newSet.delete(deleteConfirm.buildingId!)
        return newSet
      })
      setDeleteConfirm({ buildingId: null, isOpen: false })
    }
  }, [deleteConfirm.buildingId, deleteBuilding, queryClient, t])

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ buildingId: null, isOpen: false })
  }, [])

  const handleBuildingClick = useCallback(
    (building: Building) => {
      navigate("/create-location", { state: { building } })
    },
    [navigate],
  )

  const handleViewFloorsClick = useCallback((e: React.MouseEvent, buildingId: number) => {
    e.stopPropagation()
    setFloorSelection({ buildingId, isOpen: true })
  }, [])

  const handleFloorSelectionClose = useCallback(() => {
    setFloorSelection({ buildingId: null, isOpen: false })
  }, [])

  const handleFloorSelect = useCallback(
    (floor: Floor) => {
      // Navigate to create-location with floor data instead of separate floor-map page
      navigate("/create-location", {
        state: {
          building: buildings.find((b) => b.id === floor.buildingId),
          floor: floor,
          mode: "view", // Add mode to indicate this is for viewing, not editing
        },
      })
      setFloorSelection({ buildingId: null, isOpen: false })
    },
    [navigate, buildings],
  )

  const getBuildingTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "house":
        return "🏠"
      case "mall":
        return "🏬"
      case "educational":
        return "🏫"
      case "medical":
        return "🏥"
      default:
        return "🏢"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCoordinates = (x: number, y: number) => {
    return `${x.toFixed(6)}, ${y.toFixed(6)}`
  }

  if (error) {
    return (
      <div className="p-6 mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">{t("errorLoadingBuildings")}</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{t("errorLoadingBuildingsDescription")}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    )
  }

  const selectedBuilding = buildings.find((b) => b.id === floorSelection.buildingId)

  return (
    <div className="p-6 space-y-6 mt-12 text-gray-900 dark:text-white">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-indigo-50 dark:from-gray-800 to-white dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300 mb-2">
              {t("allBuildings")}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FaHome className="text-indigo-500" />
                {stats.total} {t("totalBuildings")}
              </span>
              {Object.entries(stats.byType).map(([type, count]) => (
                <span key={type} className="flex items-center gap-1">
                  <span>{getBuildingTypeIcon(type)}</span>
                  {count} {t(type.toLowerCase())}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/create-location")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FaPlus />
            {t("addBuilding")}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={t("searchBuildingsPlaceholder")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 mt-1 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map((suggestion: string) => (
                  <li
                    key={suggestion}
                    onMouseDown={() => handleSuggestionSelect(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as typeof sortBy)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="name">{t("sortByName")}</option>
              <option value="created">{t("sortByCreated")}</option>
              <option value="type">{t("sortByType")}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1"
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
              {sortOrder === "asc" ? t("ascending") : t("descending")}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "px-3 py-2 text-sm transition-colors",
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
              )}
            >
              <IoMdGrid className="text-2xl" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "px-3 py-2 text-sm transition-colors",
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
              )}
            >
              <FaList className="text-xl" />
            </button>
          </div>
        </div>

        {/* Building Type Filters */}
        <div className="flex flex-wrap gap-3">
          {BUILDING_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                filterType === type
                  ? "bg-indigo-600 text-white scale-105 border-indigo-600 shadow-lg"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105",
              )}
            >
              {type === "ALL" ? (
                <>
                  <span className="mr-1">🏢</span>
                  {t("all")}
                </>
              ) : (
                <>
                  <span className="mr-1">{getBuildingTypeIcon(type)}</span>
                  {t(type.toLowerCase())}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Buildings Display */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="text-4xl text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
            </div>
          </div>
        ) : filteredAndSortedBuildings.length === 0 ? (
          <div className="text-center py-12">
            <FaHome className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchTerm || filterType !== "ALL" ? t("noBuildingsMatchFilter") : t("noBuildings")}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchTerm || filterType !== "ALL" ? t("tryDifferentFilter") : t("createFirstBuilding")}
            </p>
            {!searchTerm && filterType === "ALL" && (
              <button
                onClick={() => navigate("/create-location")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              >
                <FaPlus className="inline mr-2" />
                {t("addBuilding")}
              </button>
            )}
          </div>
        ) : (
          <div
            className={clsx(
              "px-6",
              viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4",
            )}
          >
            {filteredAndSortedBuildings.map((building: Building) => {
              const isDeleting = deletingBuildings.has(building.id)
              const typeConfig = typeIconMap[building.type] || typeIconMap["HOUSE"]

              if (viewMode === "list") {
                return (
                  <div
                    key={building.id}
                    onClick={() => !isDeleting && handleBuildingClick(building)}
                    className={clsx(
                      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center gap-4 transition-all duration-200 border border-gray-200 dark:border-gray-700",
                      !isDeleting && "hover:shadow-lg hover:scale-[1.02] cursor-pointer",
                      isDeleting && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {/* Building Icon */}
                    <div className={clsx("w-16 h-16 rounded-xl flex items-center justify-center", typeConfig.bgColor)}>
                      <div className={typeConfig.color}>{typeConfig.icon}</div>
                    </div>

                    {/* Building Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {building.name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                          {getBuildingTypeIcon(building.type)} {t(building.type.toLowerCase())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{building.address}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          {formatCoordinates(building.globalPosition.x, building.globalPosition.y)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaCalendar />
                          {formatDate(building.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleViewFloorsClick(e, building.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title={t("viewFloors")}
                        disabled={isDeleting}
                      >
                        <FaMap />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBuildingClick(building)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title={t("edit")}
                        disabled={isDeleting}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, building.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title={t("delete")}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                      </button>
                    </div>
                  </div>
                )
              }

              // Grid view
              return (
                <div
                  key={building.id}
                  onClick={() => !isDeleting && handleBuildingClick(building)}
                  className={clsx(
                    "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200 border border-gray-200 dark:border-gray-700 group",
                    !isDeleting && "hover:shadow-xl hover:scale-105 cursor-pointer",
                    isDeleting && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {/* Building Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium shadow-lg">
                      {getBuildingTypeIcon(building.type)} {t(building.type.toLowerCase())}
                    </span>
                  </div>

                  {/* Building Icon Area */}
                  <div className={clsx("relative h-32 flex items-center justify-center", typeConfig.bgColor)}>
                    <div className={clsx("transition-transform duration-300 group-hover:scale-110", typeConfig.color)}>
                      {typeConfig.icon}
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => handleViewFloorsClick(e, building.id)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-green-500/70 transition-colors"
                        title={t("viewFloors")}
                        disabled={isDeleting}
                      >
                        <FaMap />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBuildingClick(building)
                        }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                        title={t("edit")}
                        disabled={isDeleting}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, building.id)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/70 transition-colors"
                        title={t("delete")}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                      </button>
                    </div>
                  </div>

                  {/* Building Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {building.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">{building.address}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt />
                        {formatCoordinates(building.globalPosition.x, building.globalPosition.y)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendar />
                        {formatDate(building.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floor Selection Modal */}
      <FloorSelectionModal
        building={selectedBuilding || null}
        floors={selectedBuildingFloors}
        isOpen={floorSelection.isOpen}
        onClose={handleFloorSelectionClose}
        onFloorSelect={handleFloorSelect}
        isLoading={isLoadingFloors}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("confirmDeleteBuilding")}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t("confirmDeleteBuildingDescription")}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FaTrash />
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaImage,
  FaBuilding,
  FaRuler,
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
  FaSortUp,
  FaSortDown,
  FaList,
} from "react-icons/fa"
import { useAllFloors, useDeleteFloor, useAllBuildings } from "../services/useBuildingService"
import { useDeleteFileByUrl } from "../services/supabaseClient"
import clsx from "clsx"
import { toast } from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { IoMdGrid } from "react-icons/io"

interface Floor {
  id: number
  name: string
  buildingId: number
  levelNumber: number
  dimensionWidth: number
  dimensionHeight: number
  floorPictureUrl?: string
  createdAt: string
  updatedAt: string
}

interface Building {
  id: number
  name: string
  type: string
  address: string
}

interface DeleteConfirmation {
  floorId: number | null
  isOpen: boolean
}

export default function Floors() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State management
  const [buildingFilter, setBuildingFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "created" | "building">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    floorId: null,
    isOpen: false,
  })
  const [deletingFloors, setDeletingFloors] = useState<Set<number>>(new Set())

  const BUILDING_TYPES = ["ALL", "HOUSE", "MALL", "MEDICAL", "EDUCATIONAL"]

  // Data fetching
  const { data: floors = [], isLoading, error, refetch } = useAllFloors()
  const { data: buildings = [] } = useAllBuildings()
  const { mutateAsync: deleteFloor } = useDeleteFloor()
  const { mutateAsync: deleteFileByUrl } = useDeleteFileByUrl()

  // Memoized computations
  const buildingNames = useMemo(() => {
    return buildings.map((b: Building) => b.name).filter(Boolean)
  }, [buildings])

  const suggestions = useMemo(() => {
    return buildingNames.filter((name: string) => name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
  }, [searchTerm, buildingNames])

  const buildingMap = useMemo(() => {
    return buildings.reduce(
      (acc, building) => {
        acc[building.id] = building
        return acc
      },
      {} as Record<number, Building>,
    )
  }, [buildings])

  const filteredAndSortedFloors = useMemo(() => {
    const filtered = floors.filter((floor: Floor) => {
      const building = buildingMap[floor.buildingId]
      const matchesType = buildingFilter === "ALL" || building?.type === buildingFilter
      const matchesSearch =
        searchTerm.trim() === "" ||
        building?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        floor.name.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesType && matchesSearch
    })

    // Sort floors
    filtered.sort((a: Floor, b: Floor) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "building":
          const buildingA = buildingMap[a.buildingId]?.name || ""
          const buildingB = buildingMap[b.buildingId]?.name || ""
          comparison = buildingA.localeCompare(buildingB)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [floors, buildingMap, buildingFilter, searchTerm, sortBy, sortOrder])

  const stats = useMemo(() => {
    const totalFloors = floors.length
    const floorsWithImages = floors.filter((f: Floor) => f.floorPictureUrl).length
    const buildingTypes = buildings.reduce(
      (acc, building) => {
        acc[building.type] =
          (acc[building.type] || 0) + floors.filter((f: Floor) => f.buildingId === building.id).length
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: totalFloors,
      withImages: floorsWithImages,
      withoutImages: totalFloors - floorsWithImages,
      byType: buildingTypes,
    }
  }, [floors, buildings])

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

  const handleDeleteClick = useCallback((e: React.MouseEvent, floorId: number) => {
    e.stopPropagation()
    setDeleteConfirm({ floorId, isOpen: true })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.floorId) return

    const floor = floors.find((f: Floor) => f.id === deleteConfirm.floorId)
    if (!floor) return

    setDeletingFloors((prev) => new Set(prev).add(deleteConfirm.floorId!))

    try {
      // Delete image first if it exists
      if (floor.floorPictureUrl) {
        await deleteFileByUrl(floor.floorPictureUrl)
      }

      // Then delete the floor
      await deleteFloor(deleteConfirm.floorId)

      toast.success(t("floorDeleted"))

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["allFloors"] })
      queryClient.invalidateQueries({ queryKey: ["floorsByBuilding"] })
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(t("floorDeleteError"))
    } finally {
      setDeletingFloors((prev) => {
        const newSet = new Set(prev)
        newSet.delete(deleteConfirm.floorId!)
        return newSet
      })
      setDeleteConfirm({ floorId: null, isOpen: false })
    }
  }, [deleteConfirm.floorId, floors, deleteFileByUrl, deleteFloor, queryClient, t])

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ floorId: null, isOpen: false })
  }, [])

  const handleFloorClick = useCallback(
    (floor: Floor) => {
      navigate("/create-location", { state: { floor } })
    },
    [navigate],
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

  const getBuildingTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "house":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "mall":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "educational":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "medical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  if (error) {
    return (
      <div className="p-6 mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">{t("errorLoadingFloors")}</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{t("errorLoadingFloorsDescription")}</p>
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

  return (
    <div className="p-6 space-y-6 mt-12 text-gray-900 dark:text-white">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-indigo-50 dark:from-gray-800 to-white dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300 mb-2">
              {t("allFloors")}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FaBuilding className="text-indigo-500" />
                {stats.total} {t("totalFloors")}
              </span>
              <span className="flex items-center gap-1">
                <FaImage className="text-green-500" />
                {stats.withImages} {t("withImages")}
              </span>
              <span className="flex items-center gap-1">
                <FaExclamationTriangle className="text-orange-500" />
                {stats.withoutImages} {t("withoutImages")}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/create-location")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FaPlus />
            {t("addFloor")}
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
              placeholder={t("searchFloorsPlaceholder")}
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
              <option value="building">{t("sortByBuilding")}</option>
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
              onClick={() => setBuildingFilter(type)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                buildingFilter === type
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

      {/* Floor Cards/List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="text-4xl text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
            </div>
          </div>
        ) : filteredAndSortedFloors.length === 0 ? (
          <div className="text-center py-12">
            <FaBuilding className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchTerm || buildingFilter !== "ALL" ? t("noFloorsMatchFilter") : t("noFloorsFound")}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchTerm || buildingFilter !== "ALL" ? t("tryDifferentFilter") : t("createFirstFloor")}
            </p>
            {!searchTerm && buildingFilter === "ALL" && (
              <button
                onClick={() => navigate("/create-location")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              >
                <FaPlus className="inline mr-2" />
                {t("addFloor")}
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
            {filteredAndSortedFloors.map((floor: Floor) => {
              const building = buildingMap[floor.buildingId]
              const isDeleting = deletingFloors.has(floor.id)

              if (viewMode === "list") {
                return (
                  <div
                    key={floor.id}
                    onClick={() => !isDeleting && handleFloorClick(floor)}
                    className={clsx(
                      "bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center gap-4 transition-all duration-200 border border-gray-200 dark:border-gray-700",
                      !isDeleting && "hover:shadow-lg hover:scale-[1.02] cursor-pointer",
                      isDeleting && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {/* Floor Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      {floor.floorPictureUrl ? (
                        <img
                          src={floor.floorPictureUrl || "/placeholder.svg"}
                          alt={floor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaImage className="text-gray-400 text-xl" />
                        </div>
                      )}
                    </div>

                    {/* Floor Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{floor.name}</h3>
                        {building && (
                          <span
                            className={clsx(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getBuildingTypeColor(building.type),
                            )}
                          >
                            {getBuildingTypeIcon(building.type)} {t(building.type.toLowerCase())}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {building?.name || t("unknownBuilding")}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaRuler />
                          {floor.dimensionWidth}m × {floor.dimensionHeight}m
                        </span>
                        <span>Level {floor.levelNumber || 1}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {floor.floorPictureUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement image preview
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title={t("previewImage")}
                        >
                          <FaEye />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFloorClick(floor)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title={t("edit")}
                        disabled={isDeleting}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, floor.id)}
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
                  key={floor.id}
                  onClick={() => !isDeleting && handleFloorClick(floor)}
                  className={clsx(
                    "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200 border border-gray-200 dark:border-gray-700 group",
                    !isDeleting && "hover:shadow-xl hover:scale-105 cursor-pointer",
                    isDeleting && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {/* Building Type Badge */}
                  {building && (
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={clsx(
                          "px-2 py-1 rounded-full text-xs font-medium shadow-lg",
                          getBuildingTypeColor(building.type),
                        )}
                      >
                        {getBuildingTypeIcon(building.type)} {t(building.type.toLowerCase())}
                      </span>
                    </div>
                  )}

                  {/* Floor Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {floor.floorPictureUrl ? (
                      <img
                        src={floor.floorPictureUrl || "/placeholder.svg"}
                        alt={floor.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <FaImage className="text-4xl text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{t("noImage")}</p>
                        </div>
                      </div>
                    )}

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      {floor.floorPictureUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement image preview
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                          title={t("previewImage")}
                        >
                          <FaEye />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFloorClick(floor)
                        }}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                        title={t("edit")}
                        disabled={isDeleting}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, floor.id)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/70 transition-colors"
                        title={t("delete")}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                      </button>
                    </div>

                    {/* Status indicator */}
                    <div className="absolute top-3 right-3">
                      {floor.floorPictureUrl ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg" title={t("hasImage")} />
                      ) : (
                        <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg" title={t("noImage")} />
                      )}
                    </div>
                  </div>

                  {/* Floor Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{floor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                      {building?.name || t("unknownBuilding")}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaRuler />
                        {floor.dimensionWidth}m × {floor.dimensionHeight}m
                      </span>
                      <span>Level {floor.levelNumber || 1}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("confirmDeleteFloor")}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{t("confirmDeleteFloorDescription")}</p>
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

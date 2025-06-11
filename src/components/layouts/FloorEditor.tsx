"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { toast } from "react-hot-toast"
import axios from "axios"
import POIIcon from "../ui/POIIcon"
import {
  FaPlus,
  FaMinus,
  FaMousePointer,
  FaLink,
  FaPencilAlt,
  FaEraser,
  FaSave,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaUndo,
  FaRedo,
  FaCrosshairs,
  FaToilet,
  FaBed,
  FaBath,
  FaUtensils,
  FaCar,
  FaLeaf,
  FaCouch,
  FaShoppingBag,
  FaCoffee,
  FaCreditCard,
  FaParking,
  FaInfoCircle,
  FaBook,
  FaFlask,
  FaTheaterMasks,
  FaBuilding,
  FaRunning,
  FaHospital,
  FaUserMd,
  FaPills,
  FaXRay,
  FaAmbulance,
  FaGraduationCap,
} from "react-icons/fa"
import { BiSolidDoorOpen } from "react-icons/bi";
import { MdElevator, MdStairs  } from "react-icons/md";
import { IoRestaurant } from "react-icons/io5";
import { GiBrickWall } from "react-icons/gi";
import { t } from "i18next"
import Cookies from "js-cookie"

// Типы данных
type POI = {
  id: string
  x: number
  y: number
  type: string
  name?: string
  description?: string
}

type Edge = {
  from: string
  to: string
  start: { x: number; y: number }
  end: { x: number; y: number }
}

type PathPoint = { x: number; y: number }
type WallSegment = { from: PathPoint; to: PathPoint }

// Генерация уникальных идентификаторов
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// POI типы по категориям зданий
const POI_TYPES = {
  house: [
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "kitchen", name: "Kitchen", icon: FaUtensils },
    { id: "bedroom", name: "Bedroom", icon: FaBed },
    { id: "living_room", name: "Living Room", icon: FaCouch },
    { id: "bathroom", name: "Bathroom", icon: FaBath },
    { id: "garage", name: "Garage", icon: FaCar },
    { id: "garden", name: "Garden", icon: FaLeaf },
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
  ],
  mall: [
    { id: "shop", name: "Shop", icon: FaShoppingBag },
    { id: "restaurant", name: "Restaurant", icon: IoRestaurant },
    { id: "cafe", name: "Cafe", icon: FaCoffee },
    { id: "atm", name: "ATM", icon: FaCreditCard },
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "escalator", name: "Escalator", icon: MdStairs },
    { id: "parking", name: "Parking", icon: FaParking },
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "information", name: "Information", icon: FaInfoCircle },
  ],
  educational: [
    { id: "classroom", name: "Classroom", icon: FaGraduationCap },
    { id: "library", name: "Library", icon: FaBook },
    { id: "laboratory", name: "Laboratory", icon: FaFlask },
    { id: "auditorium", name: "Auditorium", icon: FaTheaterMasks },
    { id: "cafeteria", name: "Cafeteria", icon: IoRestaurant },
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "office", name: "Office", icon: FaBuilding },
    { id: "gym", name: "Gymnasium", icon: FaRunning },
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "elevator", name: "Elevator", icon: MdElevator },
  ],
  medical: [
    { id: "reception", name: "Reception", icon: FaHospital },
    { id: "doctor_office", name: "Doctor's Office", icon: FaUserMd },
    { id: "surgery", name: "Surgery", icon: FaHospital },
    { id: "pharmacy", name: "Pharmacy", icon: FaPills },
    { id: "laboratory", name: "Laboratory", icon: FaFlask },
    { id: "xray", name: "X-Ray", icon: FaXRay },
    { id: "emergency", name: "Emergency", icon: FaAmbulance },
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
  ],
  default: [
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "stairs", name: "Stairs", icon: MdStairs },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
  ],
}

export default function FloorEditor({
  imageUrl,
  width,
  height,
  floorId,
  buildingType = "default",
}: {
  imageUrl: string
  width: number
  height: number
  floorId: number
  buildingType?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [drawingPath, setDrawingPath] = useState<PathPoint[]>([])
  const [selectedType, setSelectedType] = useState(
    POI_TYPES[buildingType as keyof typeof POI_TYPES]?.[0]?.id || "toilet",
  )
  const [imageRatio, setImageRatio] = useState(16 / 9)
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null)
  const [walls, setWalls] = useState<WallSegment[]>([])
  const [currentWallPath, setCurrentWallPath] = useState<PathPoint[]>([])
  const [drawnPOIs, setDrawnPOIs] = useState<POI[]>([])
  const [drawnEdges, setDrawnEdges] = useState<Edge[]>([])
  const [mode, setMode] = useState<"poi" | "connect" | "draw" | "erase" | "wall">("poi")
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [showPOIs, setShowPOIs] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showWalls, setShowWalls] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const currentPOITypes = POI_TYPES[buildingType as keyof typeof POI_TYPES] || POI_TYPES.default

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageRatio(img.naturalWidth / img.naturalHeight)
      }
    }
  }, [imageUrl])

  useEffect(() => {
    // Set default selected type when building type changes
    if (currentPOITypes.length > 0) {
      setSelectedType(currentPOITypes[0].id)
    }
  }, [buildingType])

  const saveToHistory = () => {
    const state = {
      pois: [...pois],
      edges: [...edges],
      walls: [...walls],
      drawnPOIs: [...drawnPOIs],
      drawnEdges: [...drawnEdges],
    }

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setPois(prevState.pois)
      setEdges(prevState.edges)
      setWalls(prevState.walls)
      setDrawnPOIs(prevState.drawnPOIs)
      setDrawnEdges(prevState.drawnEdges)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setPois(nextState.pois)
      setEdges(nextState.edges)
      setWalls(nextState.walls)
      setDrawnPOIs(nextState.drawnPOIs)
      setDrawnEdges(nextState.drawnEdges)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5))
  }

  const resetZoom = () => {
    setScale(1)
  }

  const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return { x, y }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getRelativePos(e)
    if (!pos) return

    saveToHistory()

    if (mode === "poi") {
      const selectedPOIType = currentPOITypes.find((type) => type.id === selectedType)
      const newPOI: POI = {
        id: generateId(),
        x: pos.x,
        y: pos.y,
        type: selectedType.toUpperCase(),
        name: selectedPOIType?.name,
        description: `${selectedPOIType?.name} at (${Math.round(pos.x * width)}, ${Math.round(pos.y * height)})`,
      }
      setPois((prev) => [...prev, newPOI])
    }

    if (mode === "connect" && pois.length >= 2) {
      const lastPOI = pois[pois.length - 1]
      const newEdge: Edge = { from: lastPOI.id, to: generateId(), start: lastPOI, end: pos }
      setEdges((prev: Edge[]) => [...prev, newEdge])
    }

    if (mode === "draw") {
      setDrawingPath((prev) => [...prev, pos])
    }

    if (mode === "erase") {
      let erased = false

      setEdges((prev) =>
        prev.filter((edge) => {
          const from = pois.find((p) => p.id === edge.from)
          const to = pois.find((p) => p.id === edge.to)
          const isNear = from && to && isPointNearLine(pos, from, to, 0.015)
          if (isNear) erased = true
          return !isNear
        }),
      )

      setWalls((prev) =>
        prev.filter((wall) => {
          const isNear = isPointNearLine(pos, wall.from, wall.to, 0.015)
          if (isNear) erased = true
          return !isNear
        }),
      )

      setDrawnEdges((prev) =>
        prev.filter((edge) => {
          const from = [...pois, ...drawnPOIs].find((p) => p.id === edge.from)
          const to = [...pois, ...drawnPOIs].find((p) => p.id === edge.to)
          const isNear = from && to && isPointNearLine(pos, from, to, 0.015)
          if (isNear) erased = true
          return !isNear
        }),
      )

      setDrawingPath((prev) => prev.filter((p) => Math.abs(p.x - pos.x) > 0.01 || Math.abs(p.y - pos.y) > 0.01))

      if (!erased) {
        console.log("Nothing was near click to erase.")
      }
    }

    if (mode === "wall") {
      setCurrentWallPath((prev) => {
        const newPath = [...prev, pos]
        if (newPath.length >= 2) {
          setWalls((prevWalls) => [
            ...prevWalls,
            { from: newPath[newPath.length - 2], to: newPath[newPath.length - 1] },
          ])
        }
        return newPath
      })
    }
  }

  const isPointNearLine = (p: PathPoint, a: PathPoint, b: PathPoint, threshold = 0.02): boolean => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy

    if (lenSq === 0) return false

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    const projX = a.x + t * dx
    const projY = a.y + t * dy

    const dist = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2)
    return dist < threshold
  }

  const handlePOIClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (mode === "connect") {
      if (connectingFrom === null) {
        setConnectingFrom(idx)
      } else if (connectingFrom !== idx) {
        saveToHistory()
        setEdges((prev: any) => [...prev, { from: connectingFrom, to: idx }])
        setConnectingFrom(null)
      } else {
        setConnectingFrom(null)
      }
    }
    if (e.altKey || e.type === "contextmenu") {
      e.preventDefault()
      saveToHistory()
      setPois((prev) => prev.filter((_, i) => i !== idx))
      setEdges((prev: any) => prev.filter((e: any) => e.from !== idx && e.to !== idx))
    }
  }

  const handleDrag = (idx: number, e: React.MouseEvent) => {
    const onMove = (moveEvent: MouseEvent) => {
      const pos = getRelativePos(moveEvent as any)
      if (!pos) return
      setPois((prev) => {
        const newList = [...prev]
        newList[idx] = { ...newList[idx], ...pos }
        return newList
      })
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const handleDrawFinish = () => {
    if (mode === "draw" && drawingPath.length > 1) {
      saveToHistory()
      const newEdges: Edge[] = []

      const pathPOIs = drawingPath.map((point) => ({
        id: generateId(),
        ...point,
        type: "ROUTE_NODE",
      }))

      for (let i = 0; i < pathPOIs.length - 1; i++) {
        newEdges.push({
          from: pathPOIs[i].id,
          to: pathPOIs[i + 1].id,
          start: { x: pathPOIs[i].x, y: pathPOIs[i].y },
          end: { x: pathPOIs[i + 1].x, y: pathPOIs[i + 1].y },
        })
      }

      setDrawnPOIs((prev) => [...prev, ...pathPOIs])
      setDrawnEdges((prev) => [...prev, ...newEdges])
      setDrawingPath([])
    }
  }

  const startDrag =
    (type: "poi" | "wall" | "edge", index: number, edgePoint: "from" | "to" = "from") =>
    (e: React.MouseEvent) => {
      e.preventDefault()

      const onMove = (moveEvent: MouseEvent) => {
        const pos = getRelativePos(moveEvent)
        if (!pos) return

        if (type === "poi") {
          setPois((prev) => {
            const updated = [...prev]
            updated[index] = { ...updated[index], ...pos }
            return updated
          })
        }

        if (type === "wall") {
          setWalls((prev) => {
            const updated = [...prev]
            const wall = updated[index]
            wall[edgePoint] = pos
            return updated
          })
        }

        if (type === "edge") {
          setEdges((prev: any) => {
            const updated = [...prev]
            const edge = updated[index]
            if (edgePoint === "from") {
              pois[edge.from] = { ...pois[edge.from], ...pos }
            } else {
              pois[edge.to] = { ...pois[edge.to], ...pos }
            }
            return updated
          })
        }
      }

      const onUp = () => {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    }

  const handleExport = async () => {
    const allPOIs = [...pois, ...drawnPOIs]
    const allEdges = [...edges, ...drawnEdges]
    const backendIdMap: Record<string, string> = {}
    const createdNodeIds: string[] = []

    try {
      toast.loading("Saving nodes...", { id: "export" })

      for (const poi of allPOIs) {
        const res = await axios.post(
          `${process.env.REACT_APP_INDOOR_URL}/floors/${floorId}/node`,
          {
            pos: {
              x: Math.round(poi.x * width),
              y: Math.round(poi.y * height),
            },
            type: poi.type === "ROUTE_NODE" ? "ROUTE_NODE" : "POI",
            name: poi.name,
            description: poi.description,
            nodes: [],
          },
          {
            headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
          },
        )

        const newId = res.data.id
        backendIdMap[poi.id] = newId
        createdNodeIds.push(newId)
      }

      toast.loading("Creating connections...", { id: "export" })

      for (const edge of allEdges) {
        const from = backendIdMap[edge.from]
        const to = backendIdMap[edge.to]

        if (from && to) {
          await axios.post(`${process.env.REACT_APP_INDOOR_URL}/floors/${floorId}/nodes/bi-connection`, null, {
            params: { node1: from, node2: to },
            headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
          })
        }
      }

      toast.success("All nodes and connections saved successfully!", { id: "export" })

      const exportData = {
        nodes: Object.entries(backendIdMap)
          .map(([localId, backendId]) => {
            const poi = allPOIs.find((p) => p.id === localId)
            if (!poi) return null
            return {
              id: backendId,
              type: poi.type === "ROUTE_NODE" ? "ROUTE_NODE" : "POI",
              x: Math.round(poi.x * width),
              y: Math.round(poi.y * height),
              name: poi.name,
              description: poi.description,
            }
          })
          .filter(Boolean),
        walls: walls.map((wall) => ({
          from: {
            x: Math.round(wall.from.x * width),
            y: Math.round(wall.from.y * height),
          },
          to: {
            x: Math.round(wall.to.x * width),
            y: Math.round(wall.to.y * height),
          },
        })),
        floorDimensions: {
          width,
          height,
        },
      }

      const data = JSON.stringify(exportData, null, 2)
      const blob = new Blob([data], { type: "application/json" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `floor-${floorId}-navigation-data.json`
      link.click()

      setTimeout(() => {
        window.location.href = "/routes"
      }, 2000)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Error occurred! Rolling back...", { id: "export" })

      await Promise.all(
        createdNodeIds.map(async (id) => {
          try {
            await axios.delete(`${process.env.REACT_APP_INDOOR_URL}/floors/${floorId}/node/${id}`, {
              headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
            })
          } catch (err) {
            console.warn("Error deleting node", id, err)
          }
        }),
      )

      toast.error("Rollback completed. Data not saved.", { id: "export" })
    }
  }

  const getModeIcon = (m: string) => {
    switch (m) {
      case "poi":
        return <FaMousePointer />
      case "connect":
        return <FaLink />
      case "draw":
        return <FaPencilAlt />
      case "erase":
        return <FaEraser />
      case "wall":
        return <GiBrickWall />
      default:
        return <FaMousePointer />
    }
  }

  const getModeColor = (m: string) => {
    switch (m) {
      case "poi":
        return "from-blue-500 to-blue-600"
      case "connect":
        return "from-green-500 to-green-600"
      case "draw":
        return "from-orange-500 to-orange-600"
      case "erase":
        return "from-red-500 to-red-600"
      case "wall":
        return "from-purple-500 to-purple-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="flex gap-6">
      {/* Enhanced Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <h3 className="text-lg font-bold mb-2">Floor Editor</h3>
          <p className="text-indigo-100 text-sm">
            Building Type: <span className="font-semibold capitalize">{buildingType}</span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* POI Types */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              POI Types
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {currentPOITypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[60px] ${
                    selectedType === type.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-105"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-300 hover:scale-102"
                  }`}
                  title={type.name}
                >
                  <type.icon
                    className={`text-lg mb-1 ${
                      selectedType === type.id
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">
                    {type.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Edit Mode
            </h4>
            <div className="space-y-2">
              {(["poi", "connect", "draw", "erase", "wall"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                    mode === m
                      ? `bg-gradient-to-r ${getModeColor(m)} text-white shadow-lg scale-105`
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {getModeIcon(m)}
                  <span className="capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Drawing Controls */}
          {(drawingPath.length > 0 || mode === "draw") && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">Drawing Path</h4>
              <div className="flex gap-2">
                {drawingPath.length > 0 && (
                  <button
                    onClick={() => setDrawingPath([])}
                    className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Clear Path
                  </button>
                )}
                {mode === "draw" && drawingPath.length > 1 && (
                  <button
                    onClick={handleDrawFinish}
                    className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Finish Draw
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Visibility Controls */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Visibility
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setShowPOIs(!showPOIs)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  showPOIs
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {showPOIs ? <FaEye /> : <FaEyeSlash />}
                <span>POIs ({pois.length})</span>
              </button>

              <button
                onClick={() => setShowRoutes(!showRoutes)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  showRoutes
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {showRoutes ? <FaEye /> : <FaEyeSlash />}
                <span>Routes ({edges.length + drawnEdges.length})</span>
              </button>

              <button
                onClick={() => setShowWalls(!showWalls)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  showWalls
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {showWalls ? <FaEye /> : <FaEyeSlash />}
                <span>Walls ({walls.length})</span>
              </button>
            </div>
          </div>

          {/* History Controls */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              History
            </h4>
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <FaUndo className="text-sm" />
                <span className="text-sm">Undo</span>
              </button>

              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <FaRedo className="text-sm" />
                <span className="text-sm">Redo</span>
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Quick Help</h4>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div>🖱️ Click: Add POI or route point</div>
              <div>🔗 Connect: Click two POIs to link</div>
              <div>✏️ Draw: Click points → Finish</div>
              <div>🧹 Erase: Click on lines/walls</div>
              <div>🚧 Wall: Click to create wall segments</div>
              <div>⌨️ Alt + Click: Delete POI</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaSave />
              {t("export")} & Save
            </button>

            <button
              onClick={() => {
                saveToHistory()
                setPois([])
                setEdges([])
                setDrawingPath([])
                setWalls([])
                setDrawnEdges([])
                setDrawnPOIs([])
                setCurrentWallPath([])
              }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaTrash />
              {t("clearAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Canvas */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const pos = getRelativePos(e)
            if (pos) setMousePos(pos)
          }}
          onMouseLeave={() => setMousePos(null)}
          className="relative border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-cover bg-center shadow-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${imageUrl})`,
            aspectRatio: imageRatio,
            cursor: mode === "draw" ? "crosshair" : mode === "erase" ? "not-allowed" : "default",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* SVG Overlay for lines and connections */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            {/* Edges */}
            {showRoutes &&
              edges.map((edge: any, i) => {
                const allPOIs = [...pois, ...drawnPOIs]
                const from = allPOIs.find((p) => p.id === edge.from)
                const to = allPOIs.find((p) => p.id === edge.to)

                if (!from || !to) return null
                return (
                  <g key={`edge-${edge.from}-${edge.to}-${i}`}>
                    <line
                      x1={`${from.x * 100}%`}
                      y1={`${from.y * 100}%`}
                      x2={`${to.x * 100}%`}
                      y2={`${to.y * 100}%`}
                      stroke="#3B82F6"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerMid="url(#arrow-blue)"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                      }}
                    />
                    <circle
                      cx={`${from.x * 100}%`}
                      cy={`${from.y * 100}%`}
                      r="6"
                      fill="#3B82F6"
                      className="cursor-move opacity-70 hover:opacity-100"
                      onMouseDown={startDrag("edge", i, "from")}
                    />
                    <circle
                      cx={`${to.x * 100}%`}
                      cy={`${to.y * 100}%`}
                      r="6"
                      fill="#3B82F6"
                      className="cursor-move opacity-70 hover:opacity-100"
                      onMouseDown={startDrag("edge", i, "to")}
                    />
                  </g>
                )
              })}

            {/* Walls */}
            {showWalls &&
              walls.map((seg, i) => (
                <g key={`wall-${i}`}>
                  <line
                    x1={`${seg.from.x * 100}%`}
                    y1={`${seg.from.y * 100}%`}
                    x2={`${seg.to.x * 100}%`}
                    y2={`${seg.to.y * 100}%`}
                    stroke="#EF4444"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="15 8"
                    style={{
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                  />
                  <circle
                    cx={`${seg.from.x * 100}%`}
                    cy={`${seg.from.y * 100}%`}
                    r="8"
                    fill="#EF4444"
                    className="cursor-move opacity-70 hover:opacity-100"
                    onMouseDown={startDrag("wall", i, "from")}
                  />
                  <circle
                    cx={`${seg.to.x * 100}%`}
                    cy={`${seg.to.y * 100}%`}
                    r="8"
                    fill="#EF4444"
                    className="cursor-move opacity-70 hover:opacity-100"
                    onMouseDown={startDrag("wall", i, "to")}
                  />
                </g>
              ))}

            {/* Drawn Edges */}
            {showRoutes &&
              drawnEdges.map((edge: any, i) => {
                const allPOIs = [...pois, ...drawnPOIs]
                const from = allPOIs.find((p) => p.id === edge.from)
                const to = allPOIs.find((p) => p.id === edge.to)

                if (!from || !to) return null
                return (
                  <g key={`drawn-${edge.from}-${edge.to}-${i}`}>
                    <line
                      x1={`${from.x * 100}%`}
                      y1={`${from.y * 100}%`}
                      x2={`${to.x * 100}%`}
                      y2={`${to.y * 100}%`}
                      stroke="#F59E0B"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10 5"
                      markerMid="url(#arrow-orange)"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                      }}
                    />
                    <circle
                      cx={`${from.x * 100}%`}
                      cy={`${from.y * 100}%`}
                      r="6"
                      fill="#F59E0B"
                      className="cursor-move opacity-70 hover:opacity-100"
                      onMouseDown={startDrag("edge", i, "from")}
                    />
                    <circle
                      cx={`${to.x * 100}%`}
                      cy={`${to.y * 100}%`}
                      r="6"
                      fill="#F59E0B"
                      className="cursor-move opacity-70 hover:opacity-100"
                      onMouseDown={startDrag("edge", i, "to")}
                    />
                  </g>
                )
              })}

            {/* Drawing Preview */}
            {mode === "draw" && drawingPath.length > 1 && (
              <>
                {drawingPath.map((pt, i) => {
                  const next = drawingPath[i + 1]
                  if (!next) return null
                  return (
                    <line
                      key={`preview-${i}`}
                      x1={`${pt.x * 100}%`}
                      y1={`${pt.y * 100}%`}
                      x2={`${next.x * 100}%`}
                      y2={`${next.y * 100}%`}
                      stroke="#F59E0B"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10 5"
                      markerMid="url(#arrow-orange)"
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                      }}
                    />
                  )
                })}

                {mousePos && drawingPath.length > 0 && (
                  <line
                    x1={`${drawingPath[drawingPath.length - 1].x * 100}%`}
                    y1={`${drawingPath[drawingPath.length - 1].y * 100}%`}
                    x2={`${mousePos.x * 100}%`}
                    y2={`${mousePos.y * 100}%`}
                    stroke="#F59E0B"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 5"
                    opacity="0.7"
                    style={{
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                  />
                )}
              </>
            )}

            {/* Arrow Markers */}
            <defs>
              <marker
                id="arrow-blue"
                markerWidth="12"
                markerHeight="12"
                refX="6"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L8,3 L0,6 Z" fill="#3B82F6" />
              </marker>

              <marker
                id="arrow-orange"
                markerWidth="12"
                markerHeight="12"
                refX="6"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L8,3 L0,6 Z" fill="#F59E0B" />
              </marker>
            </defs>
          </svg>

          {/* Mouse Position Indicator */}
          {mousePos && (
            <div
              className="absolute text-xs bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-20 backdrop-blur-sm"
              style={{
                left: `${mousePos.x * 100}%`,
                top: `${mousePos.y * 100}%`,
                transform: "translate(15px, -15px)",
              }}
            >
              <div className="flex items-center gap-2">
                {mode === "draw" && "✏️"}
                {mode === "connect" && "🔗"}
                {mode === "erase" && "🧹"}
                {mode === "wall" && "🚧"}
                {mode === "poi" && "➕"}
                <span>
                  ({Math.round(mousePos.x * width)}, {Math.round(mousePos.y * height)})
                </span>
              </div>
            </div>
          )}

          {/* POIs */}
          {showPOIs &&
            pois.map((poi, idx) => {
              const poiType = currentPOITypes.find((type) => type.id === poi.type.toLowerCase())
              return (
                <div
                  key={idx}
                  className={`absolute z-30 transition-all duration-200 ${
                    mode === "poi" ? "cursor-move" : "cursor-crosshair"
                  } ${connectingFrom === idx ? "ring-4 ring-indigo-400 ring-opacity-75" : ""}`}
                  style={{
                    left: `${poi.x * 100}%`,
                    top: `${poi.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={(e) => handlePOIClick(idx, e)}
                  onContextMenu={(e) => handlePOIClick(idx, e)}
                  onMouseDown={(e) => {
                    if (mode === "poi") handleDrag(idx, e)
                  }}
                  title={`${poi.name || poi.type} - (${Math.round(poi.x * width)}, ${Math.round(poi.y * height)})`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-indigo-500 flex items-center justify-center hover:scale-110 transition-transform">
                      {poiType?.icon ? (
                        <poiType.icon className="text-indigo-600 dark:text-indigo-400 text-xl" />
                      ) : (
                        <POIIcon type={poi.type} size={20} className="text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    {poi.name && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {poi.name}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          {/* Drawn POIs (Route Nodes) */}
          {showRoutes &&
            drawnPOIs.map((poi, idx) => (
              <div
                key={`drawn-${idx}`}
                className="absolute z-30"
                style={{
                  left: `${poi.x * 100}%`,
                  top: `${poi.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`Route Node - (${Math.round(poi.x * width)}, ${Math.round(poi.y * height)})`}
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                  R
                </div>
              </div>
            ))}

          {/* Drawing Path Points */}
          {mode === "draw" &&
            drawingPath.map((point, idx) => (
              <div
                key={`path-${idx}`}
                className="absolute z-30"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-6 h-6 bg-orange-400 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {idx + 1}
                </div>
              </div>
            ))}
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-3">
          <button
            onClick={handleZoomIn}
            className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
            title="Zoom In"
          >
            <FaPlus />
          </button>

          <button
            onClick={resetZoom}
            className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
            title="Reset Zoom"
          >
            <FaCrosshairs />
          </button>

          <button
            onClick={handleZoomOut}
            className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
            title="Zoom Out"
          >
            <FaMinus />
          </button>

          {/* Scale Indicator */}
          <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg text-center backdrop-blur-sm">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-6 left-6 right-6 z-40">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">POIs: {pois.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Routes: {edges.length + drawnEdges.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Walls: {walls.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-500 dark:text-gray-400">
                  Mode: <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{mode}</span>
                </span>

                {mousePos && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Cursor: ({Math.round(mousePos.x * width)}, {Math.round(mousePos.y * height)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

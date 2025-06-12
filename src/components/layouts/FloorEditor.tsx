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
  FaCreditCard,
  FaParking,
  FaInfoCircle,
  FaBook,
  FaFlask,
  FaTheaterMasks,
  FaBuilding,
  FaRunning,
  FaUserMd,
  FaPills,
  FaAmbulance,
  FaGraduationCap,
  FaTshirt,
  FaGamepad,
  FaShieldAlt,
  FaDesktop,
  FaArchive,
  FaStethoscope,
  FaProcedures,
  FaUserTie,
  FaCogs,
  FaConciergeBell,
  FaWarehouse,
  FaChild,
  FaTools,
  FaKey,
  FaAppleAlt,
} from "react-icons/fa"
import { BiSolidDoorOpen } from "react-icons/bi"
import {
  MdElevator,
  MdStairs,
  MdLocalLaundryService,
  MdBalcony,
  MdMeetingRoom,
  MdSpa,
  MdLocalDining,
  MdFastfood,
  MdLocalFireDepartment,
} from "react-icons/md"
import { IoRestaurant } from "react-icons/io5"
import { GiBrickWall } from "react-icons/gi"
import { t } from "i18next"
import Cookies from "js-cookie"
import { useNodesByFloor, type Node } from "../../services/useBuildingService"

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
  id: string
  from: string // Node ID
  to: string // Node ID
}

type PathPoint = { x: number; y: number }
type WallSegment = { from: PathPoint; to: PathPoint }

// Генерация уникальных идентификаторов
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// POI типы по категориям зданий
const POI_TYPES = {
  house: [
    // Rooms
    { id: "living_room", name: "Living Room", icon: FaCouch },
    { id: "bedroom", name: "Bedroom", icon: FaBed },
    { id: "kitchen", name: "Kitchen", icon: FaUtensils },
    { id: "bathroom", name: "Bathroom", icon: FaBath },
    { id: "dining_room", name: "Dining Room", icon: MdLocalDining },
    { id: "garage", name: "Garage", icon: FaCar },
    { id: "study_room", name: "Study Room", icon: FaBook },
    { id: "hallway", name: "Hallway", icon: BiSolidDoorOpen },
    { id: "laundry_room", name: "Laundry Room", icon: MdLocalLaundryService },
    { id: "basement", name: "Basement", icon: FaWarehouse },
    { id: "attic", name: "Attic", icon: FaArchive },
    // POIs
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "stairs", name: "Stairs", icon: MdStairs },
    { id: "fireplace", name: "Fireplace", icon: MdLocalFireDepartment },
    { id: "balcony", name: "Balcony", icon: MdBalcony },
    { id: "garden", name: "Garden", icon: FaLeaf },
    { id: "pool", name: "Pool", icon: MdSpa },
    { id: "pantry", name: "Pantry", icon: FaAppleAlt },
    { id: "closet", name: "Closet", icon: FaTshirt },
    { id: "storage_room", name: "Storage Room", icon: FaWarehouse },
  ],
  mall: [
    // Rooms
    { id: "main_entrance", name: "Main Entrance", icon: BiSolidDoorOpen },
    { id: "food_court", name: "Food Court", icon: MdFastfood },
    { id: "restrooms", name: "Restrooms", icon: FaToilet },
    { id: "customer_service", name: "Customer Service Desk", icon: FaConciergeBell },
    { id: "shops_stores", name: "Shops/Stores", icon: FaShoppingBag },
    { id: "entertainment_area", name: "Entertainment Area", icon: FaGamepad },
    { id: "parking_area", name: "Parking Area", icon: FaParking },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "stairs", name: "Stairs", icon: MdStairs },
    // POIs
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "resting_areas", name: "Resting Areas", icon: FaCouch },
    { id: "atm", name: "ATM", icon: FaCreditCard },
    { id: "information_kiosk", name: "Information Kiosk", icon: FaInfoCircle },
    { id: "security_desk", name: "Security Desk", icon: FaShieldAlt },
    { id: "emergency_exit", name: "Emergency Exit", icon: MdLocalFireDepartment },
    { id: "escalator", name: "Escalator", icon: MdStairs },
    { id: "elevators", name: "Elevators", icon: MdElevator },
    { id: "lost_found", name: "Lost & Found", icon: FaKey },
  ],
  educational: [
    // Rooms
    { id: "classroom", name: "Classroom", icon: FaGraduationCap },
    { id: "auditorium", name: "Auditorium", icon: FaTheaterMasks },
    { id: "library", name: "Library", icon: FaBook },
    { id: "laboratory", name: "Laboratory", icon: FaFlask },
    { id: "computer_lab", name: "Computer Lab", icon: FaDesktop },
    { id: "faculty_offices", name: "Faculty Offices", icon: FaBuilding },
    { id: "principal_office", name: "Principal's Office", icon: FaUserTie },
    { id: "hallways", name: "Hallways", icon: BiSolidDoorOpen },
    { id: "cafeteria", name: "Cafeteria", icon: IoRestaurant },
    { id: "restrooms", name: "Restrooms", icon: FaToilet },
    { id: "gymnasium", name: "Gymnasium", icon: FaRunning },
    { id: "locker_rooms", name: "Locker Rooms", icon: FaTshirt },
    // POIs
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "fire_exits", name: "Fire Exits", icon: MdLocalFireDepartment },
    { id: "parking_lot", name: "Parking Lot", icon: FaParking },
    { id: "emergency_exit", name: "Emergency Exit", icon: MdLocalFireDepartment },
    { id: "bulletin_board", name: "Bulletin Board", icon: FaInfoCircle },
    { id: "staircase", name: "Staircase", icon: MdStairs },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "school_gate", name: "School Gate", icon: BiSolidDoorOpen },
    { id: "playground", name: "Playground", icon: FaChild },
  ],
  medical: [
    // Rooms
    { id: "waiting_room", name: "Waiting Room", icon: FaCouch },
    { id: "doctor_office", name: "Doctor's Office", icon: FaUserMd },
    { id: "examination_room", name: "Examination Room", icon: FaStethoscope },
    { id: "operating_room", name: "Operating Room", icon: FaProcedures },
    { id: "patient_room", name: "Patient Room", icon: FaBed },
    { id: "emergency_room", name: "Emergency Room", icon: FaAmbulance },
    { id: "pharmacy", name: "Pharmacy", icon: FaPills },
    { id: "laboratory", name: "Laboratory", icon: FaFlask },
    { id: "restrooms", name: "Restrooms", icon: FaToilet },
    { id: "storage_room", name: "Storage Room", icon: FaWarehouse },
    // POIs
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "emergency_exit", name: "Emergency Exit", icon: MdLocalFireDepartment },
    { id: "information_desk", name: "Information Desk", icon: FaInfoCircle },
    { id: "parking_area", name: "Parking Area", icon: FaParking },
    { id: "ambulance_bay", name: "Ambulance Bay", icon: FaAmbulance },
    { id: "waiting_area", name: "Waiting Area", icon: FaCouch },
    { id: "resting_area", name: "Resting Area", icon: FaCouch },
    { id: "pharmacy_counter", name: "Pharmacy Counter", icon: FaPills },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "staircase", name: "Staircase", icon: MdStairs },
  ],
  default: [
    { id: "entrance", name: "Entrance", icon: BiSolidDoorOpen },
    { id: "exit", name: "Exit", icon: BiSolidDoorOpen },
    { id: "elevator", name: "Elevator", icon: MdElevator },
    { id: "stairs", name: "Stairs", icon: MdStairs },
    { id: "toilet", name: "Toilet", icon: FaToilet },
    { id: "fire_exit", name: "Fire Exit", icon: MdLocalFireDepartment },
    { id: "rest_area", name: "Rest Area", icon: FaCouch },
    { id: "staff_room", name: "Staff Room", icon: FaUserTie },
    { id: "technical_room", name: "Technical Room", icon: FaCogs },
    { id: "conference_room", name: "Conference Room", icon: MdMeetingRoom },
    { id: "storage", name: "Storage", icon: FaWarehouse },
    { id: "security", name: "Security", icon: FaShieldAlt },
    { id: "maintenance", name: "Maintenance", icon: FaTools },
    { id: "office", name: "Office", icon: FaBuilding },
    { id: "reception", name: "Reception", icon: FaInfoCircle },
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
  const [routeNodes, setRouteNodes] = useState<POI[]>([]) // Renamed from drawnPOIs for clarity
  const [edges, setEdges] = useState<Edge[]>([]) // Unified edge array
  const [drawingPath, setDrawingPath] = useState<PathPoint[]>([])
  const [selectedType, setSelectedType] = useState(
    POI_TYPES[buildingType as keyof typeof POI_TYPES]?.[0]?.id || "toilet",
  )
  const [imageRatio, setImageRatio] = useState(16 / 9)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null) // Changed to node ID
  const [walls, setWalls] = useState<WallSegment[]>([])
  const [currentWallPath, setCurrentWallPath] = useState<PathPoint[]>([])
  const [mode, setMode] = useState<"poi" | "connect" | "draw" | "erase" | "wall">("poi")
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [showPOIs, setShowPOIs] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showWalls, setShowWalls] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const { data: nodes, isLoading, error } = useNodesByFloor(floorId)

  const currentPOITypes = POI_TYPES[buildingType as keyof typeof POI_TYPES] || POI_TYPES.default

  // Helper function to get all nodes (POIs + route nodes)
  const getAllNodes = (): POI[] => [...pois, ...routeNodes]

  // Helper function to find node by ID
  const findNodeById = (id: string): POI | undefined => getAllNodes().find((node) => node.id === id)

  useEffect(() => {
    if (nodes) {
      const _pois = nodes.map((node) => ({
        id: node.id,
        x: node.pos.x / width,
        y: node.pos.y / height,
        type: node.type,
        name: node.name,
        description: `${node.name} at (${Math.round(node.pos.x * width)}, ${Math.round(node.pos.y * height)})`,
      }))
      setPois(_pois)

      const generatedEdges = generateEdgesFromNodes(nodes)
      setEdges(generatedEdges)
    }
  }, [nodes, floorId, width, height])

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

  useEffect(() => {
    // Cancel connection when switching away from connect mode
    if (mode !== "connect") {
      setConnectingFrom(null)
    }
  }, [mode])

  const generateEdgesFromNodes = (nodes: Node[]) => {
    const newEdges: Edge[] = []

    // Simple logic to connect nodes sequentially
    for (let i = 0; i < nodes.length; i++) {
      const fromNode = nodes[i]

      for (let j = 0; j < nodes[i].nodes.length; j++) {
        const toNodeId = nodes[i].nodes[j]
        // Here, we create an edge between every pair of nodes.
        // You can adjust this logic based on your actual requirement, e.g., distance-based, type-based, etc.
        newEdges.push({
          id: generateId(), // Use the generateId function you already have
          from: fromNode.id,
          to: toNodeId,
        })
      }
    }
    return newEdges
  }

  const saveToHistory = () => {
    const state = {
      pois: [...pois],
      routeNodes: [...routeNodes],
      edges: [...edges],
      walls: [...walls],
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
      setRouteNodes(prevState.routeNodes)
      setEdges(prevState.edges)
      setWalls(prevState.walls)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setPois(nextState.pois)
      setRouteNodes(nextState.routeNodes)
      setEdges(nextState.edges)
      setWalls(nextState.walls)
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getRelativePos(e)
    if (!pos) return

    // Don't create new items when in connect mode
    if (mode === "connect") {
      setConnectingFrom(null)
      // toast.info("Connection cancelled", { duration: 1000 })
      return
    }

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

    if (mode === "draw") {
      setDrawingPath((prev) => [...prev, pos])
    }

    if (mode === "erase") {
      let erased = false
      const allNodes = getAllNodes()

      // Remove edges that are close to click position
      setEdges((prev) =>
        prev.filter((edge) => {
          const from = findNodeById(edge.from)
          const to = findNodeById(edge.to)
          const isNear = from && to && isPointNearLine(pos, from, to, 0.015)
          if (isNear) erased = true
          return !isNear
        }),
      )

      // Remove walls
      setWalls((prev) =>
        prev.filter((wall) => {
          const isNear = isPointNearLine(pos, wall.from, wall.to, 0.015)
          if (isNear) erased = true
          return !isNear
        }),
      )

      // Remove nodes close to click
      const threshold = 0.03 // 3% of canvas size

      setPois((prev) =>
        prev.filter((poi) => {
          const distance = Math.sqrt(Math.pow(poi.x - pos.x, 2) + Math.pow(poi.y - pos.y, 2))
          const isNear = distance < threshold
          if (isNear) {
            erased = true
            // Remove all edges connected to this node
            setEdges((prevEdges) => prevEdges.filter((edge) => edge.from !== poi.id && edge.to !== poi.id))
          }
          return !isNear
        }),
      )

      setRouteNodes((prev) =>
        prev.filter((node) => {
          const distance = Math.sqrt(Math.pow(node.x - pos.x, 2) + Math.pow(node.y - pos.y, 2))
          const isNear = distance < threshold
          if (isNear) {
            erased = true
            // Remove all edges connected to this node
            setEdges((prevEdges) => prevEdges.filter((edge) => edge.from !== node.id && edge.to !== node.id))
          }
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

  // Unified node click handler for both POIs and route nodes
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (mode === "connect") {
      if (connectingFrom === null) {
        // Start connection from this node
        setConnectingFrom(nodeId)
        // toast.info("Click another node to connect", { duration: 2000 })
      } else if (connectingFrom !== nodeId) {
        // Complete connection to this node
        saveToHistory()

        // Check if connection already exists
        const connectionExists = edges.some(
          (edge) =>
            (edge.from === connectingFrom && edge.to === nodeId) ||
            (edge.from === nodeId && edge.to === connectingFrom),
        )

        if (connectionExists) {
          toast.loading("Connection already exists!", { duration: 1500 })
        } else {
          const newEdge: Edge = {
            id: generateId(),
            from: connectingFrom,
            to: nodeId,
          }
          setEdges((prev) => [...prev, newEdge])
          toast.success("Nodes connected!", { duration: 1500 })
        }

        setConnectingFrom(null)
      } else {
        // Cancel connection (clicked same node)
        setConnectingFrom(null)
        // toast.info("Connection cancelled", { duration: 1000 })
      }
      return
    }

    // Handle delete with Alt+Click or right-click
    if (e.altKey || e.type === "contextmenu") {
      e.preventDefault()
      saveToHistory()

      // Remove the node
      setPois((prev) => prev.filter((poi) => poi.id !== nodeId))
      setRouteNodes((prev) => prev.filter((node) => node.id !== nodeId))

      // Remove all edges connected to this node
      setEdges((prev) => prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId))

      toast.success("Node deleted", { duration: 1000 })
    }
  }

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    if (mode !== "poi") return

    const onMove = (moveEvent: MouseEvent) => {
      const pos = getRelativePos(moveEvent as any)
      if (!pos) return

      // Update the node position
      setPois((prev) => {
        return prev.map((poi) => (poi.id === nodeId ? { ...poi, ...pos } : poi))
      })

      setRouteNodes((prev) => {
        return prev.map((node) => (node.id === nodeId ? { ...node, ...pos } : node))
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

      const pathNodes = drawingPath.map((point) => ({
        id: generateId(),
        ...point,
        type: "ROUTE_NODE",
        name: "Route Node",
      }))

      // Create edges between consecutive route nodes
      const newEdges: Edge[] = []
      for (let i = 0; i < pathNodes.length - 1; i++) {
        newEdges.push({
          id: generateId(),
          from: pathNodes[i].id,
          to: pathNodes[i + 1].id,
        })
      }

      setRouteNodes((prev) => [...prev, ...pathNodes])
      setEdges((prev) => [...prev, ...newEdges])
      setDrawingPath([])

      toast.success(`Route with ${pathNodes.length} nodes created!`, { duration: 2000 })
    }
  }

  const handleExport = async () => {
    const allNodes = getAllNodes()
    const backendIdMap: Record<string, string> = {}
    const createdNodeIds: string[] = []

    try {
      toast.loading("Saving nodes...", { id: "export" })

      // Create all nodes first
      for (const node of allNodes) {
        const res = await axios.post(
          `${process.env.REACT_APP_INDOOR_URL}/floors/${floorId}/node`,
          {
            pos: {
              x: node.x * width,
              y: node.y * height,
            },
            type: node.type === "ROUTE_NODE" ? "ROUTE_NODE" : "POI",
            name: node.name,
            description: node.description,
            nodes: [],
          },
          {
            headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
          },
        )

        const newId = res.data.id
        backendIdMap[node.id] = newId
        createdNodeIds.push(newId)
      }

      toast.loading("Creating connections...", { id: "export" })

      console.log("Edges", edges)
      // Create all connections
      for (const edge of edges) {
        const fromBackendId = backendIdMap[edge.from]
        const toBackendId = backendIdMap[edge.to]

        if (fromBackendId && toBackendId) {
          await axios.post(`${process.env.REACT_APP_INDOOR_URL}/floors/${floorId}/nodes/bi-connection`, null, {
            params: { node1: fromBackendId, node2: toBackendId },
            headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` },
          })
        }
      }

      toast.success("All nodes and connections saved successfully!", { id: "export" })

      // Export data for download
      const exportData = {
        nodes: Object.entries(backendIdMap)
          .map(([localId, backendId]) => {
            const node = allNodes.find((n) => n.id === localId)
            if (!node) return null
            return {
              id: backendId,
              localId: localId,
              type: node.type === "ROUTE_NODE" ? "ROUTE_NODE" : "POI",
              x: Math.round(node.x * width),
              y: Math.round(node.y * height),
              name: node.name,
              description: node.description,
            }
          })
          .filter(Boolean),
        connections: edges.map((edge) => ({
          id: edge.id,
          from: backendIdMap[edge.from],
          to: backendIdMap[edge.to],
          fromLocal: edge.from,
          toLocal: edge.to,
        })),
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
        statistics: {
          totalNodes: allNodes.length,
          totalPOIs: pois.length,
          totalRouteNodes: routeNodes.length,
          totalConnections: edges.length,
          totalWalls: walls.length,
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

      // Rollback: delete all created nodes
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

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* POI Types */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              POI Types ({currentPOITypes.length})
            </h4>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {currentPOITypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[50px] ${
                    selectedType === type.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-105"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-indigo-300 hover:scale-102"
                  }`}
                  title={type.name}
                >
                  <type.icon
                    className={`text-sm mb-1 ${
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
                  onClick={() => {
                    setMode(m)
                    // Reset connection state when changing modes
                    if (m !== "connect") {
                      setConnectingFrom(null)
                    }
                  }}
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

            {/* Connection Status */}
            {mode === "connect" && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-700 dark:text-green-300">
                  {connectingFrom ? (
                    <div>
                      <div className="font-semibold">🔗 Connecting from selected node</div>
                      <div className="mt-1">Click another node to complete connection</div>
                      <button
                        onClick={() => setConnectingFrom(null)}
                        className="mt-2 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">🎯 Connection Mode</div>
                      <div className="mt-1">Click a node to start connecting</div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <span>
                  Routes ({routeNodes.length}) & Connections ({edges.length})
                </span>
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
              <div>🔗 Connect: Click node → Click another node</div>
              <div>✏️ Draw: Click points → Finish Draw</div>
              <div>🧹 Erase: Click on nodes/lines/walls</div>
              <div>🚧 Wall: Click to create wall segments</div>
              <div>⌨️ Alt + Click: Delete node</div>
              <div>🔄 Drag: Move nodes in POI mode</div>
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
                setRouteNodes([])
                setEdges([])
                setDrawingPath([])
                setWalls([])
                setCurrentWallPath([])
                setConnectingFrom(null)
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
            cursor:
              mode === "draw"
                ? "crosshair"
                : mode === "erase"
                  ? "not-allowed"
                  : mode === "connect"
                    ? "pointer"
                    : "default",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* SVG Overlay for lines and connections */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
            {/* Unified Edges */}
            {showRoutes &&
              edges.map((edge, i) => {
                const from = findNodeById(edge.from)
                const to = findNodeById(edge.to)

                if (!from || !to) return null

                const isRouteConnection = from.type === "ROUTE_NODE" || to.type === "ROUTE_NODE"
                const strokeColor = isRouteConnection ? "#F59E0B" : "#3B82F6"
                const markerId = isRouteConnection ? "arrow-orange" : "arrow-blue"

                return (
                  <g key={`edge-${edge.id}`}>
                    <line
                      x1={`${from.x * 100}%`}
                      y1={`${from.y * 100}%`}
                      x2={`${to.x * 100}%`}
                      y2={`${to.y * 100}%`}
                      stroke={strokeColor}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={isRouteConnection ? "10 5" : "none"}
                      markerMid={`url(#${markerId})`}
                      style={{
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                      }}
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
                </g>
              ))}

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

            {/* Connection Preview */}
            {mode === "connect" && connectingFrom && mousePos && (
              <line
                x1={`${findNodeById(connectingFrom)?.x ? findNodeById(connectingFrom)!.x * 100 : 0}%`}
                y1={`${findNodeById(connectingFrom)?.y ? findNodeById(connectingFrom)!.y * 100 : 0}%`}
                x2={`${mousePos.x * 100}%`}
                y2={`${mousePos.y * 100}%`}
                stroke="#10B981"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="8 4"
                opacity="0.7"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
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
                {mode === "connect" && (connectingFrom ? "🔗" : "🎯")}
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
            pois.map((poi) => {
              const poiType = currentPOITypes.find((type) => type.id === poi.type.toLowerCase())
              const isSelected = connectingFrom === poi.id
              const isConnectable = mode === "connect"
              return (
                <div
                  key={poi.id}
                  className={`absolute z-30 transition-all duration-200 ${
                    mode === "poi" ? "cursor-move" : isConnectable ? "cursor-pointer" : "cursor-default"
                  } ${isSelected ? "ring-4 ring-green-400 ring-opacity-75 scale-110" : isConnectable ? "hover:scale-110" : ""}`}
                  style={{
                    left: `${poi.x * 100}%`,
                    top: `${poi.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={(e) => handleNodeClick(poi.id, e)}
                  onContextMenu={(e) => handleNodeClick(poi.id, e)}
                  onMouseDown={(e) => {
                    if (mode === "poi") handleNodeDrag(poi.id, e)
                  }}
                  title={`${poi.name || poi.type} - (${Math.round(poi.x * width)}, ${Math.round(poi.y * height)})`}
                >
                  <div className="relative">
                    <div
                      className={`w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 ${
                        isSelected ? "border-green-500 bg-green-50" : "border-indigo-500"
                      } flex items-center justify-center hover:scale-110 transition-transform`}
                    >
                      {poiType?.icon ? (
                        <poiType.icon
                          className={`text-xl ${
                            isSelected ? "text-green-600" : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        />
                      ) : (
                        <POIIcon
                          type={poi.type}
                          size={20}
                          className={`${isSelected ? "text-green-600" : "text-indigo-600 dark:text-indigo-400"}`}
                        />
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

          {/* Route Nodes */}
          {showRoutes &&
            routeNodes.map((node) => {
              const isSelected = connectingFrom === node.id
              const isConnectable = mode === "connect"

              return (
                <div
                  key={node.id}
                  className={`absolute z-30 transition-all duration-200 ${
                    mode === "poi" ? "cursor-move" : isConnectable ? "cursor-pointer" : "cursor-default"
                  } ${isSelected ? "ring-4 ring-green-400 ring-opacity-75 scale-110" : isConnectable ? "hover:scale-110" : ""}`}
                  style={{
                    left: `${node.x * 100}%`,
                    top: `${node.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onContextMenu={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => {
                    if (mode === "poi") handleNodeDrag(node.id, e)
                  }}
                  title={`Route Node - (${Math.round(node.x * width)}, ${Math.round(node.y * height)})`}
                >
                  <div
                    className={`w-8 h-8 ${
                      isSelected ? "bg-green-500 border-green-600" : "bg-orange-500"
                    } rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white text-sm font-bold hover:scale-110 transition-transform`}
                  >
                    R
                  </div>
                </div>
              )
            })}

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
                  <span className="text-gray-700 dark:text-gray-300">Route Nodes: {routeNodes.length}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Connections: {edges.length}</span>
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

"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { robotoBase64 } from "../assets/fonts/roboto_base64"
import jsPDF from "jspdf"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useTranslation } from "react-i18next"
import ReactDOM from "react-dom/client"
import {
  FaTrash,
  FaBuilding,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaSearch,
  FaSpinner,
  FaArrowLeft,
  FaQrcode,
  FaRoute,
} from "react-icons/fa"
import { PiExportFill } from "react-icons/pi"
import { BiSolidFilePng } from "react-icons/bi"
import { FaFilePdf } from "react-icons/fa6"
import { useAllBuildings, useFloorsByBuildingId, useNodesByFloor, type Node } from "../services/useBuildingService"
import clsx from "clsx"

interface QRItem {
  label: string
  value: string
  image: string
  buildingId?: number
  floorId?: number
  nodeId?: string
  buildingName?: string
  floorName?: string
  nodeType?: string
}

interface Building {
  id: number
  name: string
  address: string
  type: string
  globalPosition: { x: number; y: number }
}

interface Floor {
  id: number
  name: string
  levelNumber: number
  buildingId: number
  floorPictureUrl?: string
}

// Building type icon mapping
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

// Node type icon mapping
const getNodeTypeIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case "POI":
      return "📍"
    case "ENTRANCE":
      return "🚪"
    case "EXIT":
      return "🚪"
    case "ELEVATOR":
      return "🛗"
    case "STAIRS":
      return "🪜"
    case "RESTROOM":
      return "🚻"
    case "INFO":
      return "ℹ️"
    case "RESTAURANT":
      return "🍽️"
    case "SHOP":
      return "🛍️"
    case "PARKING":
      return "🅿️"
    case "EMERGENCY":
      return "🚨"
    default:
      return "📍"
  }
}

// Get node type display name
const getNodeTypeDisplayName = (type: string) => {
  switch (type?.toUpperCase()) {
    case "POI":
      return "Point of Interest"
    case "ENTRANCE":
      return "Entrance"
    case "EXIT":
      return "Exit"
    case "ELEVATOR":
      return "Elevator"
    case "STAIRS":
      return "Stairs"
    case "RESTROOM":
      return "Restroom"
    case "INFO":
      return "Information"
    case "RESTAURANT":
      return "Restaurant"
    case "SHOP":
      return "Shop"
    case "PARKING":
      return "Parking"
    case "EMERGENCY":
      return "Emergency"
    default:
      return type
  }
}

export default function QRPoints() {
  const { t } = useTranslation()
  const [label, setLabel] = useState("")
  const [qrList, setQrList] = useState<QRItem[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedQrs, setSelectedQrs] = useState<string[]>([])
  const [searchExpanded, setSearchExpanded] = useState(false)

  // Navigation state
  const [navigationStep, setNavigationStep] = useState<"buildings" | "floors" | "nodes" | "qr">("qr")
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null)
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showQRGenerator, setShowQRGenerator] = useState(false)

  // Data fetching
  const { data: buildings = [], isLoading: isLoadingBuildings } = useAllBuildings()
  const { data: floors = [], isLoading: isLoadingFloors } = useFloorsByBuildingId(selectedBuildingId || 0)
  const { data: nodes = [], isLoading: isLoadingNodes } = useNodesByFloor(selectedFloorId || 0)

  // Selected entities
  const selectedBuilding = buildings.find((b: Building) => b.id === selectedBuildingId)
  const selectedFloor = floors.find((f: Floor) => f.id === selectedFloorId)

  useEffect(() => {
    const saved = localStorage.getItem("qrList")
    if (saved) setQrList(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (qrList.length > 0) {
      localStorage.setItem("qrList", JSON.stringify(qrList))
    }
  }, [qrList])

  // Reset selections when navigation changes
  useEffect(() => {
    if (navigationStep === "buildings") {
      setSelectedBuildingId(null)
      setSelectedFloorId(null)
      setSelectedNode(null)
    } else if (navigationStep === "floors") {
      setSelectedFloorId(null)
      setSelectedNode(null)
    } else if (navigationStep === "nodes") {
      setSelectedNode(null)
    }
  }, [navigationStep])

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter((building: Building) => {
    if (!searchQuery.trim()) return true
    return (
      building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Filter nodes based on search query
  const filteredNodes = nodes
    .filter((node: Node) => node.type.toUpperCase() !== "ROUTE_NODE")
    .filter((node: Node) => {
      if (!searchQuery.trim()) return true
      return (
        node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

  const handleGenerate = () => {
    if (!label.trim()) return

    let qrValue = label

    // If we're generating from a node, create a structured value
    if (selectedNode && selectedFloor && selectedBuilding) {
      qrValue = JSON.stringify({
        buildingId: selectedBuilding.id,
        floorId: selectedFloor.id,
        nodeId: selectedNode.id,
        type: "navigation",
        nodeType: selectedNode.type,
        position: selectedNode.pos,
      })
    }

    const tempContainer = document.createElement("div")
    document.body.appendChild(tempContainer)

    const qrElement = <QRCodeCanvas value={qrValue} size={210} level="H" includeMargin />

    const root = ReactDOM.createRoot(tempContainer)
    root.render(qrElement)

    setTimeout(() => {
      const canvas = tempContainer.querySelector("canvas") as HTMLCanvasElement
      if (canvas) {
        const image = canvas.toDataURL("image/png")

        const newQr: QRItem = {
          label,
          value: qrValue,
          image,
          buildingId: selectedBuilding?.id,
          floorId: selectedFloor?.id,
          nodeId: selectedNode?.id,
          buildingName: selectedBuilding?.name,
          floorName: selectedFloor?.name,
          nodeType: selectedNode?.type,
        }

        const updatedList = [...qrList, newQr]
        setQrList(updatedList)

        localStorage.setItem("qrList", JSON.stringify(updatedList))
        setLabel("")
        setShowQRGenerator(false)
        setNavigationStep("qr")
      }

      root.unmount()
      document.body.removeChild(tempContainer)
    }, 100)
  }

  const downloadPDF = (qrItem: QRItem) => {
    const canvas = document.getElementById(`qr-${qrItem.value}`) as HTMLCanvasElement
    if (!canvas) return

    const scale = 2
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvas.width * scale
    tempCanvas.height = canvas.height * scale

    const ctx = tempCanvas.getContext("2d")
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.drawImage(canvas, 0, 0)

    const imgData = tempCanvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64)
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal")

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const qrSize = 120

    // Header
    pdf.setTextColor("#333333")
    pdf.setFontSize(20)
    pdf.setFont("Roboto")
    const title = t("qrCodeTitle")
    const titleWidth = pdf.getTextWidth(title)
    pdf.text(title, (pageWidth - titleWidth) / 2, 25)

    // QR code with frame
    const qrX = (pageWidth - qrSize) / 2
    const qrY = 55
    pdf.setDrawColor(50)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5)
    pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize)

    // Add location info if available
    let yOffset = qrY + qrSize + 15
    if (qrItem.buildingName || qrItem.floorName) {
      pdf.setFontSize(14)
      pdf.setTextColor("#555555")

      let locationText = ""
      if (qrItem.buildingName) locationText += qrItem.buildingName
      if (qrItem.floorName) locationText += ` - ${qrItem.floorName}`

      pdf.text(locationText, pageWidth / 2, yOffset, { align: "center" })
      yOffset += 10
    }

    // Add node type if available
    if (qrItem.nodeType) {
      pdf.setFontSize(12)
      pdf.setTextColor("#666666")
      const nodeTypeText = `${getNodeTypeIcon(qrItem.nodeType)} ${getNodeTypeDisplayName(qrItem.nodeType)}`
      pdf.text(nodeTypeText, pageWidth / 2, yOffset, { align: "center" })
    }

    // Footer
    pdf.setFontSize(12)
    pdf.setTextColor("#888888")
    pdf.text(t("qrCodeFooter"), pageWidth / 2, pageHeight - 20, {
      align: "center",
    })

    pdf.save(`${qrItem.label}.pdf`)
  }

  const exportAllAsZip = async () => {
    const zip = new JSZip()
    const pngFolder = zip.folder("png")
    const pdfFolder = zip.folder("pdf")

    for (const qr of qrList) {
      const canvas = document.getElementById(`qr-${qr.value}`) as HTMLCanvasElement
      if (!canvas) continue

      const scale = 2
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width * scale
      tempCanvas.height = canvas.height * scale
      const ctx = tempCanvas.getContext("2d")
      if (!ctx) continue
      ctx.scale(scale, scale)
      ctx.drawImage(canvas, 0, 0)

      const imgData = tempCanvas.toDataURL("image/png")

      // Save PNG
      const pngBlob = await (await fetch(imgData)).blob()
      pngFolder?.file(`${qr.label}.png`, pngBlob)

      // Generate PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64)
      pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal")

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const qrSize = 120

      // Header
      pdf.setTextColor("#333333")
      pdf.setFontSize(20)
      pdf.setFont("Roboto")
      const title = t("qrCodeTitle")
      const titleWidth = pdf.getTextWidth(title)
      pdf.text(title, (pageWidth - titleWidth) / 2, 25)

      // QR code with frame
      const qrX = (pageWidth - qrSize) / 2
      const qrY = 55
      pdf.setDrawColor(50)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 5, 5)
      pdf.addImage(imgData, "PNG", qrX, qrY, qrSize, qrSize)

      // Add location info if available
      let yOffset = qrY + qrSize + 15
      if (qr.buildingName || qr.floorName) {
        pdf.setFontSize(14)
        pdf.setTextColor("#555555")

        let locationText = ""
        if (qr.buildingName) locationText += qr.buildingName
        if (qr.floorName) locationText += ` - ${qr.floorName}`

        pdf.text(locationText, pageWidth / 2, yOffset, { align: "center" })
        yOffset += 10
      }

      // Add node type if available
      if (qr.nodeType) {
        pdf.setFontSize(12)
        pdf.setTextColor("#666666")
        const nodeTypeText = `${getNodeTypeIcon(qr.nodeType)} ${getNodeTypeDisplayName(qr.nodeType)}`
        pdf.text(nodeTypeText, pageWidth / 2, yOffset, { align: "center" })
      }

      // Footer
      pdf.setFontSize(12)
      pdf.setTextColor("#888888")
      pdf.text(t("qrCodeFooter"), pageWidth / 2, pageHeight - 20, { align: "center" })

      const pdfBlob = pdf.output("blob")
      pdfFolder?.file(`${qr.label}.pdf`, pdfBlob)
    }

    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, t("exportFileName"))
  }

  // Navigation breadcrumbs
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 overflow-x-auto">
        <button
          onClick={() => setNavigationStep("buildings")}
          className={clsx(
            "flex items-center hover:text-indigo-600 dark:hover:text-indigo-400",
            navigationStep === "buildings" && "text-indigo-600 dark:text-indigo-400 font-medium",
          )}
        >
          <FaBuilding className="mr-1" /> {t("buildings")}
        </button>

        {selectedBuilding && (
          <>
            <span className="mx-2">/</span>
            <button
              onClick={() => setNavigationStep("floors")}
              className={clsx(
                "flex items-center hover:text-indigo-600 dark:hover:text-indigo-400",
                navigationStep === "floors" && "text-indigo-600 dark:text-indigo-400 font-medium",
              )}
            >
              <FaLayerGroup className="mr-1" /> {selectedBuilding.name}
            </button>
          </>
        )}

        {selectedFloor && (
          <>
            <span className="mx-2">/</span>
            <button
              onClick={() => setNavigationStep("nodes")}
              className={clsx(
                "flex items-center hover:text-indigo-600 dark:hover:text-indigo-400",
                navigationStep === "nodes" && "text-indigo-600 dark:text-indigo-400 font-medium",
              )}
            >
              <FaMapMarkerAlt className="mr-1" /> {selectedFloor.name}
            </button>
          </>
        )}

        {selectedNode && (
          <>
            <span className="mx-2">/</span>
            <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
              {getNodeTypeIcon(selectedNode.type)} {getNodeTypeDisplayName(selectedNode.type)}
            </span>
          </>
        )}

        {navigationStep === "qr" && !showQRGenerator && (
          <>
            <span className="mx-2">/</span>
            <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
              <FaQrcode className="mr-1" /> {t("qrCodes")}
            </span>
          </>
        )}
      </div>
    )
  }

  // Render buildings selection
  const renderBuildingsSelection = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t("selectBuilding")}</h2>
          <button
            onClick={() => setSearchExpanded(!searchExpanded)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {searchExpanded ? t("hideSearch") : t("showSearch")}
          </button>
        </div>

        {searchExpanded && (
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchBuildings")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {isLoadingBuildings ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="text-4xl text-indigo-500 animate-spin" />
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="text-center py-8">
            <FaBuilding className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery ? t("noBuildingsMatchSearch") : t("noBuildings")}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBuildings.map((building: Building) => (
              <div
                key={building.id}
                onClick={() => {
                  setSelectedBuildingId(building.id)
                  setNavigationStep("floors")
                  setSearchQuery("")
                }}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-2xl">
                    {getBuildingTypeIcon(building.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{building.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{building.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render floors selection
  const renderFloorsSelection = () => {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-1">{selectedBuilding?.name}</h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">{selectedBuilding?.address}</p>
        </div>

        {isLoadingFloors ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="text-4xl text-indigo-500 animate-spin" />
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-8">
            <FaLayerGroup className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("noFloorsAvailable")}</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {floors
              .sort((a, b) => a.levelNumber - b.levelNumber)
              .map((floor) => (
                <div
                  key={floor.id}
                  onClick={() => {
                    setSelectedFloorId(floor.id)
                    setNavigationStep("nodes")
                  }}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <FaLayerGroup className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{floor.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("level")} {floor.levelNumber}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  // Render nodes selection
  const renderNodesSelection = () => {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-1">
            {selectedBuilding?.name} - {selectedFloor?.name}
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {t("level")} {selectedFloor?.levelNumber}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t("selectNode")}</h2>
          <button
            onClick={() => setSearchExpanded(!searchExpanded)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {searchExpanded ? t("hideSearch") : t("showSearch")}
          </button>
        </div>

        {showQRGenerator ? null : (
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("qrPlaceholder")}
              className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
            >
              {t("generate")}
            </button>
          </div>
        )}

        {searchExpanded && (
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchNodes")}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {isLoadingNodes ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="text-4xl text-indigo-500 animate-spin" />
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center py-8">
            <FaMapMarkerAlt className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery ? t("noNodesMatchSearch") : t("noNodesAvailable")}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">{t("noNodesDescription")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNode(node)
                  setLabel(`${getNodeTypeDisplayName(node.type)} - ${node.id.slice(0, 8)}`)
                  setShowQRGenerator(true)
                }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-xl">
                    {getNodeTypeIcon(node.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{getNodeTypeDisplayName(node.type)}</h3>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {node.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {node.id.slice(0, 8)}... | Position: ({node.pos.x}, {node.pos.y})
                    </p>
                    {node.nodes.length > 0 && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        <FaRoute className="inline mr-1" />
                        Connected to {node.nodes.length} node{node.nodes.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render QR generator
  const renderQRGenerator = () => {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-indigo-800 dark:text-indigo-300 mb-1">
            {selectedBuilding?.name} - {selectedFloor?.name}
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {selectedNode && (
              <>
                {getNodeTypeIcon(selectedNode.type)} {getNodeTypeDisplayName(selectedNode.type)}
                <span className="ml-2 text-xs">
                  ({selectedNode.pos.x}, {selectedNode.pos.y})
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("qrPlaceholder")}
            className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <button
            onClick={handleGenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
          >
            {t("generate")}
          </button>
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setShowQRGenerator(false)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <FaArrowLeft /> {t("back")}
          </button>
          <button
            onClick={() => setNavigationStep("qr")}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t("viewAllQRCodes")}
          </button>
        </div>
      </div>
    )
  }

  // Render QR codes list
  const renderQRList = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("generatedQRCodes")}</h3>
          <button
            onClick={() => setNavigationStep("buildings")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
          >
            <FaBuilding /> {t("selectBuilding")}
          </button>
        </div>

        {showQRGenerator ? null : (
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("qrPlaceholder")}
              className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
            >
              {t("generate")}
            </button>
          </div>
        )}

        {qrList.length === 0 ? (
          <div className="text-center py-8">
            <FaQrcode className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("noQRCodesGenerated")}</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">{t("createFirstQRCode")}</p>
            <button
              onClick={() => setNavigationStep("buildings")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              {t("startCreatingQR")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {qrList.map((qr, i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 text-center shadow">
                  <div className="flex justify-center relative">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedQrs.includes(qr.value)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setSelectedQrs((prev) => (checked ? [...prev, qr.value] : prev.filter((v) => v !== qr.value)))
                        }}
                        className="absolute top-1.5 left-1.5 w-4 h-4"
                      />
                    )}
                    <QRCodeCanvas id={`qr-${qr.value}`} value={qr.value} size={210} level="H" includeMargin />
                  </div>
                  <p className="mt-2 font-medium">{qr.label}</p>

                  {/* Location info if available */}
                  {(qr.buildingName || qr.floorName) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {qr.buildingName} {qr.floorName && `- ${qr.floorName}`}
                    </p>
                  )}

                  {/* Node type if available */}
                  {qr.nodeType && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      {getNodeTypeIcon(qr.nodeType)} {getNodeTypeDisplayName(qr.nodeType)}
                    </p>
                  )}

                  <div className="mt-3 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        const canvas = document.getElementById(`qr-${qr.value}`) as HTMLCanvasElement
                        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
                        const link = document.createElement("a")
                        link.href = pngUrl
                        link.download = `${qr.label}.png`
                        link.click()
                      }}
                      className="flex items-center gap-2 text-sm border border-green-600 hover:bg-green-700 hover:text-white text-green-600 px-3 py-2 rounded"
                    >
                      {t("exporT")} <BiSolidFilePng size={22} />
                    </button>
                    <button
                      onClick={() => downloadPDF(qr)}
                      className="flex items-center gap-2 text-sm border border-blue-600 hover:bg-blue-700 hover:text-white text-blue-600 px-3 py-2 rounded"
                    >
                      {t("exporT")} <FaFilePdf size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center items-center gap-3">
              {!selectMode ? (
                <button
                  onClick={() => {
                    setSelectMode(true)
                    setSelectedQrs([])
                  }}
                  className="border border-red-600 flex items-center gap-2 hover:bg-red-700 hover:text-white text-red-600 px-5 py-2 rounded shadow"
                >
                  <FaTrash /> {t("delete")}
                </button>
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => {
                      setSelectMode(false)
                      setSelectedQrs([])
                    }}
                    className="border border-gray-400 hover:bg-gray-500 hover:text-white text-gray-400 px-5 py-2 rounded shadow"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedQrs.length === 0) return
                      const updated = qrList.filter((qr) => !selectedQrs.includes(qr.value))
                      setQrList(updated)
                      setSelectMode(false)
                      setSelectedQrs([])
                      localStorage.setItem("qrList", JSON.stringify(updated))
                    }}
                    className="border border-red-600 hover:bg-red-700 hover:text-white text-red-600 px-5 py-2 rounded shadow"
                  >
                    {t("deleteSelected")}
                  </button>
                </div>
              )}

              {qrList.length > 1 && !selectMode && (
                <button
                  onClick={exportAllAsZip}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded shadow"
                >
                  <PiExportFill size={20} /> {t("exportAll")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 mt-10 text-gray-900 dark:text-white max-w-4xl mx-auto">
      <h1 className="text-3xl text-center my-2 font-bold mb-4">🧭 {t("qrTitle")}</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">{t("qrDescription")}</p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        {/* Breadcrumbs navigation */}
        {renderBreadcrumbs()}

        {/* Content based on navigation step */}
        {navigationStep === "buildings" && renderBuildingsSelection()}
        {navigationStep === "floors" && renderFloorsSelection()}
        {navigationStep === "nodes" && renderNodesSelection()}
        {navigationStep === "qr" && !showQRGenerator && renderQRList()}
        {showQRGenerator && renderQRGenerator()}
      </div>
    </div>
  )
}

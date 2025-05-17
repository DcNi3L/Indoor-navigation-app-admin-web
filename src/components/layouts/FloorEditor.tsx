import { useState, useRef, useEffect } from "react";
import POIIcon from "../ui/POIIcon";
import { FaPlus, FaMinus } from "react-icons/fa";
import { t } from "i18next";

// Типы данных
type POI = {
  id: string;
  x: number;
  y: number;
  type: string;
};

type Edge = {
  from: string;
  to: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type PathPoint = { x: number; y: number };
type WallSegment = { from: PathPoint; to: PathPoint };

// Генерация уникальных идентификаторов
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const TYPES = ["toilet", "kitchen", "bedroom", "children", "bathroom"];

export default function FloorEditor({ imageUrl, width, height }: { imageUrl: string, width: number, height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [drawingPath, setDrawingPath] = useState<PathPoint[]>([]);
  const [selectedType, setSelectedType] = useState("toilet");
  const [imageRatio, setImageRatio] = useState(16 / 9);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [currentWallPath, setCurrentWallPath] = useState<PathPoint[]>([]);
  const [drawnPOIs, setDrawnPOIs] = useState<POI[]>([]);
  const [drawnEdges, setDrawnEdges] = useState<Edge[]>([]);
  const [mode, setMode] = useState<"poi" | "connect" | "draw" | "erase" | "wall">("poi");
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);


  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageRatio(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [imageUrl]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
      setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getRelativePos(e);
    if (!pos) return;

    if (mode === "poi") {
      const newPOI: POI = { 
        id: generateId(), 
        x: pos.x, 
        y: pos.y, 
        type: selectedType.toUpperCase() 
      };
      setPois(prev => [...prev, newPOI]);
    }

    if (mode === "connect" && pois.length >= 2) {
      const lastPOI = pois[pois.length - 1];
      const newEdge: Edge = { from: lastPOI.id, to: generateId(), start: lastPOI, end: pos };
      setEdges((prev: Edge[]) => [...prev, newEdge]);
    }

    if (mode === "draw") {
        setDrawingPath((prev) => [...prev, pos]);
    }

    if (mode === "erase") {
        let erased = false;

        // Стирание обычных краев (edges)
        setEdges((prev:any) => prev.filter((edge:any) => {
            const from = pois[edge.from];
            const to = pois[edge.to];
            const isNear = isPointNearLine(pos, from, to, 0.015);
            if (isNear) erased = true;
            return !isNear;
        }));

        // Стирание стен (walls)
        setWalls((prev) => prev.filter((wall) => {
            const isNear = isPointNearLine(pos, wall.from, wall.to, 0.015);
            if (isNear) erased = true;
            return !isNear;
        }));

        // Стирание нарисованных линий (drawnEdges)
        setDrawnEdges((prev) => prev.filter((edge:any) => {
            const allPOIs = [...pois, ...drawnPOIs];
            const from = allPOIs[edge.from];
            const to = allPOIs[edge.to];
            const isNear = isPointNearLine(pos, from, to, 0.015);
            if (isNear) erased = true;
            return !isNear;
        }));

        // Стирание точек из path (опционально)
        setDrawingPath((prev) =>
            prev.filter(p => Math.abs(p.x - pos.x) > 0.01 || Math.abs(p.y - pos.y) > 0.01)
        );

        if (!erased) {
            console.log("Nothing was near click to erase.");
        }
    }

    if (mode === "wall") {
        setCurrentWallPath(prev => {
            const newPath = [...prev, pos];
            if (newPath.length >= 2) {
                setWalls(prevWalls => [...prevWalls, { from: newPath[newPath.length - 2], to: newPath[newPath.length - 1] }]);
            }
            return newPath;
        });
    }
  };

  const isPointNearLine = (p: PathPoint, a: PathPoint, b: PathPoint, threshold = 0.02): boolean => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
  
    if (lenSq === 0) return false;
  
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
  
    const dist = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
    return dist < threshold;
  };  

  const handlePOIClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === "connect") {
      if (connectingFrom === null) {
        setConnectingFrom(idx);
      } else if (connectingFrom !== idx) {
        setEdges((prev:any) => [...prev, { from: connectingFrom, to: idx }]);
        setConnectingFrom(null);
      } else {
        setConnectingFrom(null);
      }
    }
    if (e.altKey || e.type === "contextmenu") {
      e.preventDefault();
      setPois((prev) => prev.filter((_, i) => i !== idx));
      setEdges((prev:any) => prev.filter((e:any) => e.from !== idx && e.to !== idx));
    }
  };

  const handleDrag = (idx: number, e: React.MouseEvent) => {
    const onMove = (moveEvent: MouseEvent) => {
      const pos = getRelativePos(moveEvent as any);
      if (!pos) return;
      setPois((prev) => {
        const newList = [...prev];
        newList[idx] = { ...newList[idx], ...pos };
        return newList;
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Функция для завершения рисования пути
  const handleDrawFinish = () => {
    if (mode === "draw" && drawingPath.length > 1) {
      const newEdges: Edge[] = [];
      const newPois: POI[] = [];

      // Создаем узлы для всех точек пути
      const pathPOIs = drawingPath.map(point => ({
        id: generateId(),
        ...point,
        type: "ROUTE"
      }));

      // Создаем ребра между последовательными точками
      for (let i = 0; i < pathPOIs.length - 1; i++) {
        newEdges.push({
          from: pathPOIs[i].id,
          to: pathPOIs[i+1].id,
          start: { x: pathPOIs[i].x, y: pathPOIs[i].y },
          end: { x: pathPOIs[i+1].x, y: pathPOIs[i+1].y }
        });
      }

      setDrawnPOIs(prev => [...prev, ...pathPOIs]);
      setDrawnEdges(prev => [...prev, ...newEdges]);
      setDrawingPath([]);
    }
  };

  // Функция для начала перетаскивания узлов (POIs, стен, линий)
  const startDrag = (type: "poi" | "wall" | "edge", index: number, edgePoint: "from" | "to" = "from") => (e: React.MouseEvent) => {
      e.preventDefault();

      const onMove = (moveEvent: MouseEvent) => {
          const pos = getRelativePos(moveEvent);
          if (!pos) return;

          if (type === "poi") {
              setPois((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], ...pos };
                  return updated;
              });
          }

          if (type === "wall") {
              setWalls((prev) => {
                  const updated = [...prev];
                  const wall = updated[index];
                  wall[edgePoint] = pos;
                  return updated;
              });
          }

          if (type === "edge") {
              setEdges((prev:any) => {
                  const updated = [...prev];
                  const edge = updated[index];
                  if (edgePoint === "from") {
                      pois[edge.from] = { ...pois[edge.from], ...pos };
                  } else {
                      pois[edge.to] = { ...pois[edge.to], ...pos };
                  }
                  return updated;
              });
          }
      };

      const onUp = () => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
  };

  // Example usage when saving the data
  const handleExport = () => {
    // Combine all POIs (both manually placed and drawn)
    const allPOIs = [...pois, ...drawnPOIs];
    
    // Combine all edges (both manually connected and drawn)
    const allEdges = [...edges, ...drawnEdges];

    // Format nodes according to the API specification
    const nodeLookup = allPOIs.reduce((acc:any, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const nodes = allPOIs.map(poi => {
    const connections = allEdges
      .filter(edge => edge.from === poi.id || edge.to === poi.id)
      .map(edge => {
        const connectedId = edge.from === poi.id ? edge.to : edge.from;
        const connectedNode = nodeLookup[connectedId];
        return {
          id: connectedId,
          // Дополнительная информация о ребре (опционально)
          distance: Math.sqrt(
            Math.pow((poi.x - connectedNode.x) * width, 2) +
            Math.pow((poi.y - connectedNode.y) * height, 2)
          )
        };
      });

    return {
      id: poi.id,
      x: poi.x * width,
      y: poi.y * height,
      connections, // Теперь содержит ID + расстояние
      type: poi.type === "ROUTE" ? "ROUTE_NODE" : "POI_NODE"
    };
  });

    // Format walls for pathfinding obstacles
    const formattedWalls = walls.map(wall => ({
      from: {
        x: wall.from.x * width, // Convert to meters
        y: wall.from.y * height // Convert to meters
      },
      to: {
        x: wall.to.x * width, // Convert to meters
        y: wall.to.y * height // Convert to meters
      }
    }));

    // Create the final data structure
    const exportData = {
      nodes,
      walls: formattedWalls,
      floorDimensions: {
        width,
        height
      }
    };

    // Export the data
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "floor-navigation-data.json";
    link.click();
  };

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="w-64 h-max bg-white sticky top-20 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-xl flex flex-col gap-5 text-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">{t("selected")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-2 rounded-lg border flex items-center justify-center transition ${
                  selectedType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white"
                }`}
                title={type}
              >
                <POIIcon type={type} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">{t("mode")}</h3>
          <div className="space-y-1">
            {(["poi", "connect", "draw", "erase", "wall"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`w-full px-3 py-2 rounded-lg font-medium capitalize transition ${
                  mode === m
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-around mt-2">
            {drawingPath.length > 0 && (
              <button
                onClick={() => setDrawingPath([])}
                className="flex text-xs text-red-500 hover:underline"
              >
                Clear Path
              </button>
            )}
            {mode === "draw" && drawingPath.length > 1 && (
              <button
                onClick={handleDrawFinish}
                className="text-xs text-indigo-600 hover:underline"
              >
                Finish Draw
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-300 dark:border-gray-700 pt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <div>🖱️ Клик: добавить POI или точку маршрута</div>
          <div>🔗 Connect: клик по двум POI</div>
          <div>✏️ Draw: кликать по точкам → Finish</div>
          <div>🧹 Erase: клик по линии / стене</div>
          <div>🚧 Wall: кликать для отрезков стены</div>
          <div>⌨️ Alt + клик: удалить POI</div>
        </div>

        <div className="space-y-2 pt-4">
          <button
            onClick={() => handleExport()}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {t("export")}
          </button>

          <button
            onClick={() => {
              setPois([]);
              setEdges([]);
              setDrawingPath([]);
              setWalls([]);
              setDrawnEdges([]);
              setDrawnPOIs([]);
              setCurrentWallPath([]);
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {t("clearAll")}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
          ref={containerRef}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
              const pos = getRelativePos(e);
              if (pos) setMousePos(pos);
          }}
          onMouseLeave={() => setMousePos(null)}
          className="relative border -translate-y-14 border-gray-300 dark:border-gray-600 rounded-lg w-full max-w-8xl bg-cover bg-center"
          style={{
              backgroundImage: `url(${imageUrl})`,
              aspectRatio: imageRatio,
              cursor: mode === "draw" ? "crosshair" : "default",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
          }}
      >
        {/* Edges */}
        {/* Edges, Walls и Drawn Edges с поддержкой растягивания */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          {/* Edges с внутренними стрелками */}
          {edges.map((edge:any, i) => {
            const allPOIs = [...pois, ...drawnPOIs]; // Объединяем все узлы
            const from = allPOIs.find(p => p.id === edge.from); // Ищем по ID
            const to = allPOIs.find(p => p.id === edge.to);
            
            if (!from || !to) return null;
            return (
              <>
                <line
                  key={`edge-${edge.from}-${edge.to}-${i}`}
                  x1={`${from.x * 100}%`}
                  y1={`${from.y * 100}%`}
                  x2={`${to.x * 100}%`}
                  y2={`${to.y * 100}%`}
                  stroke="blue"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerMid="url(#arrow-blue)" 
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                />
                {/* Маркеры для перетаскивания */}
                <circle
                  cx={`${from.x * 100}%`}
                  cy={`${from.y * 100}%`}
                  r="8"
                  fill="blue"
                  className="cursor-move"
                  onMouseDown={startDrag("edge", i, "from")}
                />
                <circle
                  cx={`${to.x * 100}%`}
                  cy={`${to.y * 100}%`}
                  r="8"
                  fill="blue"
                  className="cursor-move"
                  onMouseDown={startDrag("edge", i, "to")}
                />
              </>
            );
          })}

          {/* Walls - толстые и без стрелок */}
          {walls.map((seg, i) => (
            <>
              <line
                key={`wall-${i}`}
                x1={`${seg.from.x * 100}%`}
                y1={`${seg.from.y * 100}%`}
                x2={`${seg.to.x * 100}%`}
                y2={`${seg.to.y * 100}%`}
                stroke="red"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12 6"
                style={{
                  filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
                }}
              />
              {/* Маркеры для перетаскивания */}
              <circle
                cx={`${seg.from.x * 100}%`}
                cy={`${seg.from.y * 100}%`}
                r="10"
                fill="red"
                className="cursor-move"
                onMouseDown={startDrag("wall", i, "from")}
              />
              <circle
                cx={`${seg.to.x * 100}%`}
                cy={`${seg.to.y * 100}%`}
                r="10"
                fill="red"
                className="cursor-move"
                onMouseDown={startDrag("wall", i, "to")}
              />
            </>
          ))}

          {/* Drawn Edges */}
          {drawnEdges.map((edge:any, i) => {
            const allPOIs = [...pois, ...drawnPOIs];
            const from = allPOIs.find(p => p.id === edge.from);
            const to = allPOIs.find(p => p.id === edge.to);
            
            if (!from || !to) return null;
            return (
              <>
                <line
                  key={`drawn-${edge.from}-${edge.to}-${i}`}
                  x1={`${from.x * 100}%`}
                  y1={`${from.y * 100}%`}
                  x2={`${to.x * 100}%`}
                  y2={`${to.y * 100}%`}
                  stroke="orange"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 4"
                  markerMid="url(#arrow-orange)"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                />
                {/* Маркеры для перетаскивания */}
                <circle
                  cx={`${from.x * 100}%`}
                  cy={`${from.y * 100}%`}
                  r="8"
                  fill="orange"
                  className="cursor-move"
                  onMouseDown={startDrag("edge", i, "from")}
                />
                <circle
                  cx={`${to.x * 100}%`}
                  cy={`${to.y * 100}%`}
                  r="8"
                  fill="orange"
                  className="cursor-move"
                  onMouseDown={startDrag("edge", i, "to")}
                />
              </>
            );
          })}

          {/* Draw Mode Preview */}
          {mode === "draw" && drawingPath.length > 1 && (
            <>
              {drawingPath.map((pt, i) => {
                const next = drawingPath[i + 1];
                if (!next) return null;
                return (
                  <line
                    key={`preview-${i}`}
                    x1={`${pt.x * 100}%`}
                    y1={`${pt.y * 100}%`}
                    x2={`${next.x * 100}%`}
                    y2={`${next.y * 100}%`}
                    stroke="orange"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="8 4"
                    markerMid="url(#arrow-orange)"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    }}
                  />
                );
              })}

              {/* Последняя линия с текущей позицией мыши */}
              {mousePos && (
                <line
                  x1={`${drawingPath[drawingPath.length - 1].x * 100}%`}
                  y1={`${drawingPath[drawingPath.length - 1].y * 100}%`}
                  x2={`${mousePos.x * 100}%`}
                  y2={`${mousePos.y * 100}%`}
                  stroke="orange"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 4"
                  markerMid="url(#arrow-orange)"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                />
              )}
            </>
          )}

          {/* Определения стрелок */}
          <defs>
            <marker
              id="arrow-blue"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="blue" />
            </marker>

            <marker
              id="arrow-orange"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="orange" />
            </marker>
          </defs>
        </svg>

        {mousePos && (
          <div
            className="absolute text-xs bg-black bg-opacity-70 text-white px-2 py-1 rounded shadow pointer-events-none"
            style={{
              left: `${mousePos.x * 100}%`,
              top: `${mousePos.y * 100}%`,
              transform: "translate(10px, -10px)",
              zIndex: 50,
            }}
          >
            {mode === "draw" && "✏️"}
            {mode === "connect" && "🔗"}
            {mode === "erase" && "🧹"}
            {mode === "wall" && "🚧"}
            {mode === "poi" && "➕"}
          </div>
        )}

        {/* POIs */}
        {pois.map((poi, idx) => {
          if (poi.type === "path") return null;
          return (
            <div
              key={idx}
              className={`absolute z-10 ${
                mode === "poi" ? "cursor-move" : "cursor-crosshair"
              } ${connectingFrom === idx ? "ring-4 ring-indigo-400" : ""}`}
              style={{
                left: `${poi.x * 100}%`,
                top: `${poi.y * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(e) => handlePOIClick(idx, e)}
              onContextMenu={(e) => handlePOIClick(idx, e)}
              onMouseDown={(e) => {
                if (mode === "poi") handleDrag(idx, e);
              }}
            >
              <POIIcon type={poi.type} />
            </div>
          );
        })}
      </div>
      {/* Zoom Controls */}
        <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3">
            <button
                onClick={handleZoomIn}
                className="bg-orange-600 text-white p-2 rounded-lg shadow-lg hover:bg-orange-500 transition"
                title="Zoom In"
            >
                <FaPlus />
            </button>
            <button
                onClick={handleZoomOut}
                className="bg-orange-600 text-white p-2 rounded-lg shadow-lg hover:bg-orange-500 transition"
                title="Zoom Out"
            >
                <FaMinus />
            </button>
        </div>
    </div>
  );
}
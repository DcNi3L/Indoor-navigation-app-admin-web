import { useState, useRef, useEffect } from "react";
import POIIcon from "../ui/POIIcon";

type POI = { x: number; y: number; type: string };
type Edge = { from: number; to: number };
type PathPoint = { x: number; y: number };
type WallSegment = { from: PathPoint; to: PathPoint };

const TYPES = ["toilet", "kitchen", "bedroom", "children", "bathroom"];

export default function FloorEditor({ imageUrl }: { imageUrl: string }) {
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

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageRatio(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [imageUrl]);

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
      setPois([...pois, { ...pos, type: selectedType }]);
    }

    if (mode === "draw") {
      setDrawingPath((prev) => [...prev, pos]);
    }    

    if (mode === "erase") {
      let erased = false;
    
      setEdges((prev) => prev.filter((edge) => {
        const from = pois[edge.from];
        const to = pois[edge.to];
        const isNear = isPointNearLine(pos, from, to, 0.015); // более чувствительно
        if (isNear) erased = true;
        return !isNear;
      }));
    
      setWalls((prev) => prev.filter((wall) => {
        const isNear = isPointNearLine(pos, wall.from, wall.to, 0.015);
        if (isNear) erased = true;
        return !isNear;
      }));
    
      // Можно опционально: очищать точку из path
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
        setEdges((prev) => [...prev, { from: connectingFrom, to: idx }]);
        setConnectingFrom(null);
      } else {
        setConnectingFrom(null);
      }
    }
    if (e.altKey || e.type === "contextmenu") {
      e.preventDefault();
      setPois((prev) => prev.filter((_, i) => i !== idx));
      setEdges((prev) => prev.filter((e) => e.from !== idx && e.to !== idx));
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

  const handleDrawFinish = () => {
    if (mode === "draw" && drawingPath.length > 1) {
      const newEdges: Edge[] = [];
      const newPois: POI[] = [];
  
      for (let i = 0; i < drawingPath.length - 1; i++) {
        const from = drawingPath[i];
        const to = drawingPath[i + 1];
  
        newPois.push({ ...from, type: "path" }, { ...to, type: "path" });
  
        const fromIdx = pois.length + drawnPOIs.length + i * 2;
        const toIdx = pois.length + drawnPOIs.length + i * 2 + 1;
  
        newEdges.push({ from: fromIdx, to: toIdx });
      }
  
      setDrawnPOIs(prev => [...prev, ...newPois]);
      setDrawnEdges(prev => [...prev, ...newEdges]);
      setDrawingPath([]);
    }
  };

  const allPOIs = [...pois, ...drawnPOIs];

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="w-64 h-max bg-white sticky top-20 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-xl flex flex-col gap-5 text-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">Selected POI</h3>
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
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">Editor Mode</h3>
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
            onClick={() => {
              const json = JSON.stringify({
                pois: allPOIs,
                edges: [...edges, ...drawnEdges],
                path: drawingPath,
                walls
              }, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "floor-data.json";
              link.click();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Export JSON
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
            Clear All
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
          cursor: "crosshair",
        }}
      >
        {/* Edges */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          {edges.map((edge, i) => {
            const from = pois[edge.from];
            const to = pois[edge.to];
            return (
              <line
                key={i}
                x1={`${from.x * 100}%`}
                y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`}
                y2={`${to.y * 100}%`}
                stroke="blue"
                strokeWidth={2}
              />
            );
          })}

          {walls.map((seg, i) => (
            <line
              key={`wall-${i}`}
              x1={`${seg.from.x * 100}%`}
              y1={`${seg.from.y * 100}%`}
              x2={`${seg.to.x * 100}%`}
              y2={`${seg.to.y * 100}%`}
              stroke="red"
              strokeWidth={3}
              strokeDasharray="4"
            />
          ))}

          {drawnEdges.map((edge, i) => {
            const from = allPOIs[edge.from];
            const to = allPOIs[edge.to];
            if (!from || !to) return null;
            return (
              <line
                key={`drawn-${i}`}
                x1={`${from.x * 100}%`}
                y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`}
                y2={`${to.y * 100}%`}
                stroke="orange"
                strokeWidth={2}
              />
            );
          })}

          {mode === "draw" && drawingPath.length > 1 &&
            drawingPath.map((pt, i) => {
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
                  strokeWidth={2}
                  strokeDasharray="4"
                />
              );
            })}
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
            {mode === "draw" && "✏️ Draw"}
            {mode === "connect" && "🔗 Connect"}
            {mode === "erase" && "🧹 Erase"}
            {mode === "wall" && "🚧 Wall"}
            {mode === "poi" && "➕ POI"}
          </div>
        )}

        {/* POIs */}
        {pois.map((poi, idx) => {
          if (poi.type === "path") return null; // ⛔️ пропустить "временные" точки
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
    </div>
  );
}
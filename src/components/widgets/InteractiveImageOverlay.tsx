import { Marker, ImageOverlay, Rectangle } from 'react-leaflet';
import { useState, useMemo, useEffect } from 'react';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Центровой маркер
const moveIcon = new L.DivIcon({
  className: 'move-icon',
  html: `<div style="background: #007bff; border-radius: 50%; width: 16px; height: 16px; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type LatLngTuple = [number, number];

export default function InteractiveImageOverlay({ uploadedFile, userLocation }: {
  uploadedFile: File | null,
  userLocation: LatLngTuple | null
}) {
  const [topLeft, setTopLeft] = useState<LatLngTuple | null>(null);
  const [bottomRight, setBottomRight] = useState<LatLngTuple | null>(null);

  useEffect(() => {
    if (userLocation) {
      setTopLeft([userLocation[0] + 0.0002, userLocation[1] - 0.0002]);
      setBottomRight([userLocation[0] - 0.0002, userLocation[1] + 0.0002]);
    }
  }, [userLocation]);

  const center: LatLngTuple | null = useMemo(() => {
    if (!topLeft || !bottomRight) return null;
    return [
      (topLeft[0] + bottomRight[0]) / 2,
      (topLeft[1] + bottomRight[1]) / 2,
    ];
  }, [topLeft, bottomRight]);

  // Только после всех хуков и расчетов — проверка
  if (!uploadedFile || !userLocation || !topLeft || !bottomRight || !center) {
    return null;
  }

  const getBounds = (): [LatLngTuple, LatLngTuple] => [topLeft, bottomRight];

  const bottomLeft: LatLngTuple = [bottomRight[0], topLeft[1]];
  const topRight: LatLngTuple = [topLeft[0], bottomRight[1]];
  
  const handleDrag = (corner: string, newLatLng: LatLngTuple) => {
    switch (corner) {
      case 'topLeft':
        setTopLeft(newLatLng);
        break;
      case 'topRight':
        setTopLeft([newLatLng[0], topLeft[1]]);
        setBottomRight([bottomRight[0], newLatLng[1]]);
        break;
      case 'bottomLeft':
        setTopLeft([topLeft[0], newLatLng[1]]);
        setBottomRight([newLatLng[0], bottomRight[1]]);
        break;
      case 'bottomRight':
        setBottomRight(newLatLng);
        break;
    }
  };

  const renderDraggableCorner = (pos: LatLngTuple, corner: string) => (
    <Marker
      key={corner}
      position={pos}
      draggable={true}
      icon={markerIcon}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          handleDrag(corner, [newPos.lat, newPos.lng]);
        }
      }}
    />
  );

  const handleMoveOverlay = (newCenter: LatLngTuple) => {
    const deltaLat = newCenter[0] - center[0];
    const deltaLng = newCenter[1] - center[1];
    setTopLeft([topLeft[0] + deltaLat, topLeft[1] + deltaLng]);
    setBottomRight([bottomRight[0] + deltaLat, bottomRight[1] + deltaLng]);
  };

  if (!uploadedFile || !userLocation) return null;

  return (
    <>
      <ImageOverlay
        url={URL.createObjectURL(uploadedFile)}
        bounds={getBounds()}
        opacity={0.7}
        zIndex={50}
      />

      <Rectangle
        bounds={getBounds()}
        pathOptions={{ color: 'blue', dashArray: '5, 5' }}
      />

      {renderDraggableCorner(topLeft, 'topLeft')}
      {renderDraggableCorner(topRight, 'topRight')}
      {renderDraggableCorner(bottomLeft, 'bottomLeft')}
      {renderDraggableCorner(bottomRight, 'bottomRight')}

      {/* Центральный маркер для перемещения всей области */}
      <Marker
        position={center}
        draggable={true}
        icon={moveIcon}
        eventHandlers={{
          dragend: (e) => {
            const newPos = e.target.getLatLng();
            handleMoveOverlay([newPos.lat, newPos.lng]);
          }
        }}
      />
    </>
  );
}

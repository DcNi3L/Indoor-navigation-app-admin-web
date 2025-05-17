import { Marker, ImageOverlay, Rectangle, useMapEvent  } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const moveIcon = new L.DivIcon({
  className: 'move-icon',
  html: `<div style="background: #007bff; border-radius: 50%; width: 16px; height: 16px; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type LatLngTuple = [number, number];

const metersToLatDelta = (meters: number): number => {
  const earthRadius = 6378137;
  return (meters / earthRadius) * (180 / Math.PI);
};

const metersToLngDelta = (meters: number, latitude: number): number => {
  const earthRadius = 6378137;
  return (meters / earthRadius) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);
};

function getDistanceInMeters(coord1: LatLngTuple, coord2: LatLngTuple): number {
  const latlng1 = L.latLng(coord1[0], coord1[1]);
  const latlng2 = L.latLng(coord2[0], coord2[1]);
  return latlng1.distanceTo(latlng2);
}

export default function InteractiveImageOverlay({
  uploadedFile,
  userLocation,
  onCenterChange,
  onDimensionsChange,
  opacity,
  dimensionWidth,
  dimensionHeight,
  isEditMode,
  onOverlayClick,
  scaleFactor = 1,
}: {
  uploadedFile: File | null;
  userLocation: LatLngTuple | null;
  onCenterChange?: (center: LatLngTuple) => void;
  onDimensionsChange?: (width: number, height: number) => void;
  opacity?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  isEditMode: boolean;
  onOverlayClick?: () => void;
  scaleFactor?: number;
}) {
  const DEFAULT_WIDTH_METERS = 300;
  const DEFAULT_HEIGHT_METERS = 250;
  const [topLeft, setTopLeft] = useState<LatLngTuple | null>(null);
  const [bottomRight, setBottomRight] = useState<LatLngTuple | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (userLocation && !initializedRef.current) {
      const [centerLat, centerLng] = userLocation;

      const width = (isEditMode && dimensionWidth ? dimensionWidth : DEFAULT_WIDTH_METERS) * scaleFactor;
      const height = (isEditMode && dimensionHeight ? dimensionHeight : DEFAULT_HEIGHT_METERS) * scaleFactor;

      const latDelta = metersToLatDelta(height / 2);
      const lngDelta = metersToLngDelta(width / 2, centerLat);

      const tl: LatLngTuple = [centerLat + latDelta, centerLng - lngDelta];
      const br: LatLngTuple = [centerLat - latDelta, centerLng + lngDelta];

      setTopLeft(tl);
      setBottomRight(br);

      onCenterChange?.([centerLat, centerLng]);
      triggerDimensionChange(tl, br);

      initializedRef.current = true;
    }
  }, [dimensionHeight, dimensionWidth, onCenterChange, scaleFactor, userLocation, isEditMode]);

  const getBounds = (): [LatLngTuple, LatLngTuple] => {
    if (!topLeft || !bottomRight) return [[0, 0], [0, 0]];
    return [topLeft, bottomRight];
  };

  // Проверка клика по схеме
  useMapEvent("click", (e) => {
    const bounds = L.latLngBounds(getBounds());
    if (bounds.contains(e.latlng)) {
      onOverlayClick?.();
    }
  });

  const getCenter = (): LatLngTuple => {
    if (!topLeft || !bottomRight) return [0, 0];
    return [
      (topLeft[0] + bottomRight[0]) / 2,
      (topLeft[1] + bottomRight[1]) / 2,
    ];
  };

  const triggerDimensionChange = (tl: LatLngTuple, br: LatLngTuple) => {
    const width = getDistanceInMeters([tl[0], tl[1]], [tl[0], br[1]]);
    const height = getDistanceInMeters([tl[0], tl[1]], [br[0], tl[1]]);
    onDimensionsChange?.(Math.round(width), Math.round(height));
  };

  const bottomLeft: LatLngTuple | null = topLeft && bottomRight ? [bottomRight[0], topLeft[1]] : null;
  const topRight: LatLngTuple | null = topLeft && bottomRight ? [topLeft[0], bottomRight[1]] : null;

  const [previewTopLeft, setPreviewTopLeft] = useState<LatLngTuple | null>(null);
  const [previewBottomRight, setPreviewBottomRight] = useState<LatLngTuple | null>(null);
  const handleDrag = (corner: string, newLatLng: LatLngTuple) => {
    if (!topLeft || !bottomRight) return;

    // Текущие размеры
    const currentWidth = getDistanceInMeters([topLeft[0], topLeft[1]], [topLeft[0], bottomRight[1]]);
    const currentHeight = getDistanceInMeters([topLeft[0], topLeft[1]], [bottomRight[0], topLeft[1]]);
    const aspectRatio = currentWidth / currentHeight;

    // Инициализация новых координат предпросмотра
    let previewTopLeft = topLeft;
    let previewBottomRight = bottomRight;

    switch (corner) {
        case 'topLeft': {
            const newWidth = getDistanceInMeters([newLatLng[0], bottomRight[1]], bottomRight);
            const newHeight = newWidth / aspectRatio;

            const newLat = bottomRight[0] + metersToLatDelta(newHeight);
            const newLng = bottomRight[1] - metersToLngDelta(newWidth, bottomRight[0]);

            previewTopLeft = [newLatLng[0], newLatLng[1]];
            previewBottomRight = [bottomRight[0], bottomRight[1]];
            break;
        }
        case 'topRight': {
            const newWidth = getDistanceInMeters([bottomRight[0], newLatLng[1]], bottomRight);
            const newHeight = newWidth / aspectRatio;

            const newLat = bottomRight[0] + metersToLatDelta(newHeight);
            const newLng = topLeft[1] + metersToLngDelta(newWidth, topLeft[0]);

            previewTopLeft = [topLeft[0], newLatLng[1]];
            previewBottomRight = [newLatLng[0], bottomRight[1]];
            break;
        }
        case 'bottomLeft': {
            const newWidth = getDistanceInMeters([newLatLng[0], topLeft[1]], topLeft);
            const newHeight = newWidth / aspectRatio;

            const newLat = topLeft[0] - metersToLatDelta(newHeight);
            const newLng = bottomRight[1] - metersToLngDelta(newWidth, bottomRight[0]);

            previewTopLeft = [newLatLng[0], topLeft[1]];
            previewBottomRight = [bottomRight[0], newLatLng[1]];
            break;
        }
        case 'bottomRight': {
            const newWidth = getDistanceInMeters(topLeft, [topLeft[0], newLatLng[1]]);
            const newHeight = newWidth / aspectRatio;

            const newLat = topLeft[0] - metersToLatDelta(newHeight);
            const newLng = topLeft[1] + metersToLngDelta(newWidth, topLeft[0]);

            previewTopLeft = [topLeft[0], topLeft[1]];
            previewBottomRight = [newLatLng[0], newLatLng[1]];
            break;
        }
    }

    // Устанавливаем предпросмотр
    setPreviewTopLeft(previewTopLeft);
    setPreviewBottomRight(previewBottomRight);
  };

  const applyPreview = () => {
      if (previewTopLeft && previewBottomRight) {
          setTopLeft(previewTopLeft);
          setBottomRight(previewBottomRight);
          setPreviewTopLeft(null);
          setPreviewBottomRight(null);
          onCenterChange?.(getCenter());
          triggerDimensionChange(previewTopLeft, previewBottomRight);
      }
  };

  const cancelPreview = () => {
      setPreviewTopLeft(null);
      setPreviewBottomRight(null);
  };

  const handleMoveOverlay = (newCenter: LatLngTuple) => {
    const currentCenter = getCenter();
    const deltaLat = newCenter[0] - currentCenter[0];
    const deltaLng = newCenter[1] - currentCenter[1];

    const newTopLeft: LatLngTuple = [topLeft![0] + deltaLat, topLeft![1] + deltaLng];
    const newBottomRight: LatLngTuple = [bottomRight![0] + deltaLat, bottomRight![1] + deltaLng];

    setTopLeft(newTopLeft);
    setBottomRight(newBottomRight);

    onCenterChange?.(newCenter);
    triggerDimensionChange(newTopLeft, newBottomRight);
  };


  const renderDraggableCorner = (pos: LatLngTuple, corner: string) => (
    <Marker
        key={corner}
        position={pos}
        draggable={true}
        icon={markerIcon}
        eventHandlers={{
            drag: (e) => {
                const newPos = e.target.getLatLng();
                handleDrag(corner, [newPos.lat, newPos.lng]);
            },
            dragend: () => applyPreview(),
            dragstart: cancelPreview,
        }}
    />
  );

  if (!uploadedFile || !userLocation || !topLeft || !bottomRight) return null;

  const center = getCenter();
  const currentTopLeft = previewTopLeft || topLeft;
  const currentBottomRight = previewBottomRight || bottomRight;

  return (
    <>
      <ImageOverlay
        url={URL.createObjectURL(uploadedFile)}
        bounds={[currentTopLeft, currentBottomRight]}
        opacity={opacity ?? 0.7}
        zIndex={50}
    />

    <Rectangle 
        bounds={[currentTopLeft, currentBottomRight]} 
        pathOptions={{dashArray: '5, 5', fillOpacity: 0.2 }} 
    />

    {currentTopLeft && renderDraggableCorner(currentTopLeft, 'topLeft')}
    {topRight && renderDraggableCorner([currentTopLeft[0], currentBottomRight[1]], 'topRight')}
    {bottomLeft && renderDraggableCorner([currentBottomRight[0], currentTopLeft[1]], 'bottomLeft')}
    {currentBottomRight && renderDraggableCorner(currentBottomRight, 'bottomRight')}

      <Marker
        position={center}
        draggable={true}
        icon={moveIcon}
        eventHandlers={{
          dragend: (e) => {
            const newPos = e.target.getLatLng();
            handleMoveOverlay([newPos.lat, newPos.lng]);
          },
        }}
      />
    </>
  );
}

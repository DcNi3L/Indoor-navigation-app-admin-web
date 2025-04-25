import { Marker, ImageOverlay, Rectangle } from 'react-leaflet';
import { useState, useEffect } from 'react';
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

const IMAGE_WIDTH_METERS = 900;
const IMAGE_HEIGHT_METERS = 450;

const metersToLatLngDelta = (meters: number, latitude: number): number => {
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
}: {
  uploadedFile: File | null;
  userLocation: LatLngTuple | null;
  onCenterChange?: (center: LatLngTuple) => void;
  onDimensionsChange?: (width: number, height: number) => void;
  opacity?: number;
}) {
  const [topLeft, setTopLeft] = useState<LatLngTuple | null>(null);
  const [bottomRight, setBottomRight] = useState<LatLngTuple | null>(null);

  useEffect(() => {
    if (userLocation) {
      const [centerLat, centerLng] = userLocation;

      const latDelta = metersToLatLngDelta(IMAGE_HEIGHT_METERS / 2, centerLat);
      const lngDelta = metersToLatLngDelta(IMAGE_WIDTH_METERS / 2, centerLat);

      const tl: LatLngTuple = [centerLat + latDelta, centerLng - lngDelta];
      const br: LatLngTuple = [centerLat - latDelta, centerLng + lngDelta];

      setTopLeft(tl);
      setBottomRight(br);

      onCenterChange?.([centerLat, centerLng]);
      triggerDimensionChange(tl, br);
    }
  }, [userLocation]);

  const getBounds = (): [LatLngTuple, LatLngTuple] => {
    if (!topLeft || !bottomRight) return [[0, 0], [0, 0]];
    return [topLeft, bottomRight];
  };

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

  const handleDrag = (corner: string, newLatLng: LatLngTuple) => {
    let newTopLeft = topLeft!;
    let newBottomRight = bottomRight!;

    switch (corner) {
      case 'topLeft':
        newTopLeft = newLatLng;
        break;
      case 'topRight':
        newTopLeft = [newLatLng[0], topLeft![1]];
        newBottomRight = [bottomRight![0], newLatLng[1]];
        break;
      case 'bottomLeft':
        newTopLeft = [topLeft![0], newLatLng[1]];
        newBottomRight = [newLatLng[0], bottomRight![1]];
        break;
      case 'bottomRight':
        newBottomRight = newLatLng;
        break;
    }

    setTopLeft(newTopLeft);
    setBottomRight(newBottomRight);
    onCenterChange?.(getCenter());
    triggerDimensionChange(newTopLeft, newBottomRight);
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
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          handleDrag(corner, [newPos.lat, newPos.lng]);
        },
      }}
    />
  );

  if (!uploadedFile || !userLocation || !topLeft || !bottomRight) return null;

  const center = getCenter();

  return (
    <>
      <ImageOverlay
        url={URL.createObjectURL(uploadedFile)}
        bounds={getBounds()}
        opacity={opacity ?? 0.7}
        zIndex={50}
      />

      <Rectangle bounds={getBounds()} pathOptions={{ color: 'blue', dashArray: '5, 5', fillOpacity: 0 }} />

      {topLeft && renderDraggableCorner(topLeft, 'topLeft')}
      {topRight && renderDraggableCorner(topRight, 'topRight')}
      {bottomLeft && renderDraggableCorner(bottomLeft, 'bottomLeft')}
      {bottomRight && renderDraggableCorner(bottomRight, 'bottomRight')}

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

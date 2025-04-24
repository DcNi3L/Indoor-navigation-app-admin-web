import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { useState, useEffect, useMemo } from 'react';
import { FaArrowLeftLong, FaLocationDot  } from "react-icons/fa6";
import { renderToStaticMarkup } from 'react-dom/server';
import { useNavigate } from 'react-router-dom';

interface ModeControlProps {
    setMapType: (type: 'standard' | 'satellite') => void;
}

const MapCenter = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
  
    useEffect(() => {
      if (center) {
        map.setView(center, 15); // Center the map on the user's location
      }
    }, [map, center]);
  
    return null;
};

// Custom control for mode switching (Satellite/Standard)
const ModeControl = ({ setMapType }: ModeControlProps) => {
    const map = useMap();
    const [mode, setMode] = useState<'standard' | 'satellite'>('standard');
  
    useEffect(() => {
        const toggleMode = () => {
            const newMode = mode === 'standard' ? 'satellite' : 'standard';
            setMode(newMode);
            setMapType(newMode);
        };

        // Create a custom Leaflet control
        const ModeSwitchControl = L.Control.extend({
            onAdd: () => {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = `<button style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid #ccc; background: white; cursor: pointer;">
                <span>${mode === 'standard' ? '🛰️' : '🗺️'}</span>
            </button>`;
            div.onclick = toggleMode;
            return div;
            },
            onRemove: () => {},
        });
  
        const control = new ModeSwitchControl({ position: 'topright' });
        control.addTo(map);
        
        return () => {
          control.remove();
        };
    }, [map, mode, setMapType]);
  
    return null;
};
  
// Custom control for centering on user's location
const CenterControl = ({ setUserLocation }: { setUserLocation: (latlng: [number, number] | null) => void }) => {
    const map = useMap();
  
    useEffect(() => {
        const centerOnUser = () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserLocation([latitude, longitude]);
                },
                (error) => {
                  console.error('Error getting location:', error);
                  alert('Unable to retrieve your location');
                }
              );
            } else {
              alert('Geolocation is not supported by your browser');
            }
        };

        // Create a custom Leaflet control
        const CenterLocationControl = L.Control.extend({
          onAdd: () => {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = `<button style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid #ccc; background: white; cursor: pointer;">
              <span>🎯</span>
            </button>`;
            div.onclick = centerOnUser;
            return div;
          },
          onRemove: () => {},
        });
      
        const control = new CenterLocationControl({ position: 'topright' });
        control.addTo(map);
      
        return () => {
          control.remove();
        };
    }, [map, setUserLocation]);
  
    return null;
};

const ZoomControl = () => {
    const map = useMap();
  
    useEffect(() => {
      const zoomControl = new L.Control.Zoom({ position: 'topright' });
      zoomControl.addTo(map);
  
      return () => {
        zoomControl.remove();
      };
    }, [map]);
  
    return null;
};

const createCustomIcon = () => {
    const iconMarkup = renderToStaticMarkup(
      <FaLocationDot size={24} color="#FF0000" />
    );
    const iconUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;
  
    return new L.Icon({
      iconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
};


export default function CreateLocation() {
    const navigate = useNavigate();

    const [mapType, setMapType] = useState('standard');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Tile layers for standard and satellite
  const standardLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteLayer = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting initial location:', error);
        }
      );
    }
  }, []);

  const customIcon = useMemo(() => createCustomIcon(), []);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg p-6">
        <div className='flex justify-start gap-10 items-center mb-6'>
            <button onClick={() => navigate('/')} className='text-blue-400'><FaArrowLeftLong size={24} /></button>
            <h2 className="text-xl">Create Location</h2>
        </div>
        <p className="text-sm text-gray-500 mb-2">STEP: 1 OF 2</p>
        <p className="text-sm text-gray-700 mb-4">Upload a file with indoor floor plan. This plan will be used as a map during navigation</p>
        
        <div className="border-2 border-dashed border-blue-400 rounded p-6 text-center cursor-pointer hover:border-blue-600 transition">
          <div className="text-blue-600 text-sm font-semibold">UPLOAD FLOOR PLAN</div>
          <p className="text-xs text-gray-500 mt-2">Maximum size: 5 MB<br/>JPG, PNG or SVG file</p>
        </div>
        <div className='w-full flex mt-2'>
            <button 
                className="mt-6 w-72 py-1.5 px-14 text-sm border-2 outline-none border-blue-400 font-bold 
                text-blue-600 hover:bg-blue-400 hover:text-white transition duration-200"
            >
                Cancel
            </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-full w-full">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={20}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Disable default zoom control
        >
          <TileLayer
            url={mapType === 'standard' ? standardLayer : satelliteLayer}
            attribution={
              mapType === 'standard'
                ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                : '© <a href="https://www.esri.com/">Esri</a>, USGS, NOAA'
            }
          />
          <ZoomControl />
          <CenterControl setUserLocation={setUserLocation} />
          <ModeControl setMapType={setMapType} />
          <MapCenter center={userLocation} />
          {userLocation && (
            <Marker position={userLocation} icon={customIcon}>
              <Popup>You are here!</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

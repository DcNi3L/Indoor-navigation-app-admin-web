import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { useState, useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong, FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiSolidImageAdd } from "react-icons/bi";
import InteractiveImageOverlay from '../components/widgets/InteractiveImageOverlay';

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
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [overlayCenter, setOverlayCenter] = useState<[number, number] | null>(null);
    const [opacity, setOpacity] = useState<number>(0.8);
    const [address, setAddress] = useState('');
    const [dimensionWidth, setDimensionWidth] = useState<number>(0);
    const [dimensionHeight, setDimensionHeight] = useState<number>(0);
    console.log('Image center: ', overlayCenter);


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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];

    // Validate file size (5 MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;

    if (file.size <= maxSize && validTypes.includes(file.type)) {
      setUploadedFile(file);
      setErrorMessage(null);
      setStep(2); // переходим на следующий шаг
    }    

    // If validation passes, store the file and clear any error
    setUploadedFile(file);
    setErrorMessage(null);
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;
  
    const tryNominatim = async (): Promise<[number, number] | null> => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const results = await response.json();
  
        if (results?.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          return [lat, lon];
        }
      } catch (e) {
        console.warn('Nominatim failed:', e);
      }
      return null;
    };
  
    const tryMapbox = async (): Promise<[number, number] | null> => {
      try {
        const token = process.env.REACT_APP_MAPBOX_API_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
        );
        const data = await response.json();
  
        if (data.features && data.features.length > 0) {
          const [lon, lat] = data.features[0].center;
          return [lat, lon];
        }
      } catch (e) {
        console.warn('Mapbox failed:', e);
      }
      return null;
    };
  
    const coords = (await tryNominatim()) || (await tryMapbox());
  
    if (coords) {
      setUserLocation(coords);
      setOverlayCenter(coords);
    } else {
      alert('Address not found in any source');
    }
  };    

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-96 h-full bg-white shadow-lg p-6 flex flex-col justify-between">
        <div>
          <div className='flex justify-start gap-10 items-center mb-6'>
              <button 
                  onClick={() => {if (step === 1) {navigate('/')} else {setStep(1); setUploadedFile(null);}}} 
                  className='text-blue-400 hover:text-blue-600 transition'
              >
                  <FaArrowLeftLong size={28} />
              </button>
              <h2 className="text-xl">Create Location</h2>
          </div>
          {step === 1 && (
            <>
              <p className="text-sm text-gray-500 mb-2">STEP: 1 OF 2</p>
              <p className="text-sm text-gray-700 mb-4">
                Upload a file with indoor floor plan. This plan will be used as a map during navigation.
              </p>
              <div className="border-2 border-dashed border-blue-400 rounded p-6 text-center cursor-pointer hover:border-blue-600 transition">
                <label htmlFor="file-upload" className="cursor-pointer">
                    <p className='flex justify-center'><BiSolidImageAdd size={50} color="#60a5fa" /></p>
                    <div className="text-blue-600 text-sm underline">UPLOAD FLOOR PLAN</div>
                    <p className="text-xs text-gray-500 mt-2">Maximum size: 5 MB<br />JPG, PNG or SVG file</p>
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                {uploadedFile && (
                    <p className="text-xs text-green-600 mt-2">Uploaded: {uploadedFile.name}</p>
                )}
                {errorMessage && (
                    <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-500 mb-2">STEP: 2 OF 2</p>
              <p className="text-sm text-gray-700 mb-4">
                Move, Scale or Rotate your floor plan to align it with the actual position on the map:
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue="House"
                  className="w-full px-3 py-2 text-sm bg-gray-100 rounded border border-gray-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>
                <input
                  type="text"
                  defaultValue="01"
                  className="w-full px-3 py-2 text-sm bg-gray-100 rounded border border-gray-300"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  defaultValue="My house"
                  className="w-full px-3 py-2 text-sm bg-gray-100 rounded border border-gray-300"
                ></textarea>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="border-t pt-4">
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer select-none mb-2 font-medium">Advanced setting</summary>
                  <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-1 pb-1">
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Address:</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-l"
                          placeholder="Search by address..."
                        />
                        <button
                          onClick={handleAddressSearch} 
                          className="px-3 bg-white border border-gray-300 rounded-r"
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="mb-2">
                      <label className="block text-sm mb-1">Latitude:</label>
                      <input
                        type="text"
                        value={overlayCenter ? overlayCenter[0].toFixed(8) : ''}
                        className="w-full px-3 py-2 text-sm bg-gray-100 rounded border border-gray-300"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="block text-sm mb-1">Longitude:</label>
                      <input
                        type="text"
                        value={overlayCenter ? overlayCenter[1].toFixed(8) : ''}
                        className="w-full px-3 py-2 text-sm bg-gray-100 rounded border border-gray-300"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm mb-1">Floor width (m):</label>
                        <input
                          type="number"
                          value={dimensionWidth}
                          onChange={(e) => setDimensionWidth(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Floor height (m):</label>
                        <input
                          type="number"
                          value={dimensionHeight}
                          onChange={(e) => setDimensionHeight(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="block text-sm mb-1 text-gray-600">
                        Plan opacity <span className="text-blue-900 font-semibold">{Math.round(opacity * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full accent-green-500"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </>
          )}
        </div>
        {step === 1 && (
          <div className='w-full flex justify-center mt-2'>
            <button 
                onClick={() => navigate('/')}
                className="mt-6 w-80 py-1.5 px-14 text-sm border-2 outline-none border-blue-400 font-bold 
                text-blue-400 hover:border-red-400 hover:text-red-400 transition duration-200 rounded"
            >
                Cancel
            </button>
          </div>
        )}
        {step === 2 && (
          <div className='flex justify-between mt-2'>
            <button
                onClick={() => {setStep(1); setUploadedFile(null);}}
                className="py-2 px-8 text-sm border-2 outline-none border-blue-400 rounded text-nowrap
                text-blue-400 hover:border-orange-400 hover:text-orange-400 transition duration-200"
            >
                Change Image
            </button>
            <button 
                className="py-2 px-16 text-sm border-2 outline-none border-blue-400 rounded
                text-blue-400 hover:border-green-400 hover:text-green-400 transition duration-200"
            >
                Save
            </button>
          </div>
        )}
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

          <InteractiveImageOverlay
            uploadedFile={uploadedFile}
            userLocation={userLocation}
            onCenterChange={setOverlayCenter}
            onDimensionsChange={(w, h) => {
              setDimensionWidth(w);
              setDimensionHeight(h);
            }}
            opacity={opacity}
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

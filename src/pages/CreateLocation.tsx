import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from "leaflet";

import { useState, useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeftLong, FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiSolidImageAdd } from "react-icons/bi";
import InteractiveImageOverlay from '../components/widgets/InteractiveImageOverlay';
import { supabase } from '../services/supabaseClient';
import { buildingTypes } from '../utils/buildingTypes';
import { useCreateBuilding, useCreateFloor, useFloorsByBuildingId } from "../services/useBuildingService";
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { t } from 'i18next';

interface ModeControlProps {
    setMapType: (type: 'standard' | 'satellite') => void;
}

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

const SetInitialView = ({
  center,
}: {
  center: [number, number];
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 20);
  }, [map, center]);

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
                  alert(t("geolocationError"));
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { mutateAsync: createBuilding } = useCreateBuilding();
  const { mutateAsync: createFloor } = useCreateFloor();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(location.state?.building);
  const existingBuilding = isEditMode ? location.state.building : null;


  const { data: floors = [] } = useFloorsByBuildingId(existingBuilding?.id || 0);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && existingBuilding) {
      setName(existingBuilding.name || '');
      setAddress(existingBuilding.address || '');
      setDescription(existingBuilding.description || '');
      setBuildingId(existingBuilding.id || 0);
      setBuildingType(existingBuilding.type || 'HOUSE');
  
      if (existingBuilding.globalPosition) {
        const { x, y } = existingBuilding.globalPosition;
        const coords: [number, number] = [x, y];
        setUserLocation(coords);
        setOverlayCenter(coords);
      }
  
      setStep(2);
    }
  }, [isEditMode, existingBuilding]);  

  useEffect(() => {
    if (isEditMode && floors.length > 0) {
      const floor = floors[0];
  
      setFloorName(floor.name || 'First Floor');
      setDimensionWidth(floor.dimensionWidth || 0);
      setDimensionHeight(floor.dimensionHeight || 0);
  
      if (floor.floorPictureUrl) {
        fetch(floor.floorPictureUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'floorplan.png', { type: blob.type });
            setUploadedFile(file);
          });
      }
    }
  }, [isEditMode, floors]);  
  

  const [mapType, setMapType] = useState('standard');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [overlayCenter, setOverlayCenter] = useState<[number, number] | null>(null);
  const [opacity, setOpacity] = useState<number>(0.8);
  const [buildingId, setBuildingId] = useState<number>(0);
  const [name, setName] = useState('House');
  const [floorName, setFloorName] = useState('First Floor');
  const [description, setDescription] = useState('My house');
  const [address, setAddress] = useState('');
  const [dimensionWidth, setDimensionWidth] = useState<number>(0);
  const [dimensionHeight, setDimensionHeight] = useState<number>(0);
  const [buildingType, setBuildingType] = useState("HOUSE");
  const userId = Cookies.get('userId');


  // Tile layers for standard and satellite
  const standardLayer = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=DZK1ZN9Z3qB6GJ8ORs9L`;
  const satelliteLayer = 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=DZK1ZN9Z3qB6GJ8ORs9L';
  const darkLayer = `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_API_TOKEN}`;

  useEffect(() => {
    if (mapInstance && userLocation) {
      mapInstance.setView(userLocation, 20);
    }
  }, [mapInstance, userLocation]);  

  useEffect(() => {
    // Только если это новый объект (не редактирование)
    if (!isEditMode && navigator.geolocation) {
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
  }, [isEditMode]);  

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
      alert(t("addressNotFound"));
    }
  };
  
  const handleSave = async () => {
    let uploadedImageUrl = "";
    let filePath = "";
  
    if (!overlayCenter) {
      toast.error(t("selectLocation"));
      return;
    }
  
    if (uploadedFile) {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${floorName}_${Date.now()}.${fileExt}`;
      filePath = `panel/floors/${fileName}`;
  
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, uploadedFile);
  
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        toast.error(t("failedToUpload"));
        return;
      }
  
      const { data: publicUrlData } = supabase
        .storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        console.error("Failed to generate public URL from Supabase.");
        toast.error("Could not retrieve image URL.");
        return;
      }
  
      uploadedImageUrl = publicUrlData.publicUrl;
    }
  
    try {
      const buildingResponse = await createBuilding({
        name,
        address,
        userId,
        description,
        type: buildingType,
        globalPosition: {
          x: Number(overlayCenter[0].toFixed(8)),
          y: Number(overlayCenter[1].toFixed(8)),
        },
      });
  
      const newBuildingId = buildingResponse?.data?.id;
      if (!newBuildingId) {
        toast.error("Building created but ID not returned");
        return;
      }
  
      setBuildingId(newBuildingId);
      toast.success(t("buildingCreated"));
  
      console.log('picture: ', uploadedImageUrl);
      await createFloor({
        buildingId: newBuildingId,
        name: floorName,
        levelNumber: 1,
        dimensionHeight,
        dimensionWidth,
        floorPictureUrl: uploadedImageUrl,
      });
  
      toast.success(t("floorCreated"));
      navigate('/');
    } catch (error) {
      if (filePath) {
        const { error: removeError } = await supabase
          .storage
          .from('profile-images')
          .remove([filePath]);
  
        if (removeError) {
          console.warn("Failed to clean up uploaded image:", removeError);
        } else {
          console.log("Rolled back image upload:", filePath);
        }
      }
  
      console.error("Error creating building/floor:", error);
      toast.error(t("failedToCreateBuilding"));
    }
  };   

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-96 h-full bg-white dark:bg-gray-900 shadow-lg p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-start gap-10 items-center mb-6">
            <button
              onClick={() => { if (step === 1) { navigate(-1) } else { setStep(1); setUploadedFile(null); } }}
              className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-400 transition"
            >
              <FaArrowLeftLong size={28} />
            </button>
            <h2 className="text-xl text-gray-800 dark:text-white">{t("createLocation")}</h2>
          </div>

          {step === 1 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("step1of2")}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {t("uploadFloorPlan")}
              </p>
              <div className="border-2 border-dashed border-blue-400 dark:border-blue-500 rounded p-6 text-center cursor-pointer hover:border-blue-600 dark:hover:border-blue-400 transition">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="flex justify-center"><BiSolidImageAdd size={50} color="#60a5fa" /></p>
                  <div className="text-blue-600 dark:text-blue-400 text-sm uppercase underline">{t("uploadFloorPlanButton")}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("uploadMaxSize")}<br />{t("uploadSupportedFormats")}</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("step2of2")}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {t("moveScaleRotate")}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("floorName")}</label>
                <input
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="w-full dark:text-gray-300 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("description")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full dark:text-gray-300 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                ></textarea>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="border-t dark:border-gray-700 pt-4">
                <details className="text-sm text-gray-600 dark:text-gray-300">
                  <summary className="cursor-pointer select-none mb-2 dark:text-gray-200 font-medium">{t("advancedSettings")}</summary>
                  <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-1 pb-1">
                    <div className="mb-4">
                      <label className="block text-sm dark:text-gray-200 mb-1">{t("address")}:</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l"
                          placeholder={t("searchBy")}
                        />
                        <button
                          onClick={handleAddressSearch}
                          className="px-3 bg-white dark:text-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r"
                        >
                          <FaSearch />
                        </button>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="mb-2">
                      <label className="block text-sm dark:text-gray-200 mb-1">{t("latitude")}:</label>
                      <input
                        type="text"
                        value={overlayCenter ? overlayCenter[0].toFixed(8) : ''}
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="block text-sm dark:text-gray-200 mb-1">{t("longitude")}:</label>
                      <input
                        type="text"
                        value={overlayCenter ? overlayCenter[1].toFixed(8) : ''}
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm dark:text-gray-200 mb-1">{t("floorWidth")}:</label>
                        <input
                          type="number"
                          value={dimensionWidth}
                          onChange={(e) => setDimensionWidth(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm dark:text-gray-200 mb-1">{t("floorHeight")}:</label>
                        <input
                          type="number"
                          value={dimensionHeight}
                          onChange={(e) => setDimensionHeight(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </div>
                    </div>
                    
                    {/* Building type radio */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">{t("buildingType")}:</label>
                      <div className="flex justify-around">
                        {buildingTypes.map((type) => (
                          <label key={type.value} className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input
                              type="radio"
                              name="buildingType"
                              value={type.value}
                              checked={buildingType === type.value}
                              onChange={(e) => setBuildingType(e.target.value)}
                              className="accent-blue-500"
                            />
                            <span className={`${buildingType === type.value ? 'text-blue-500' : ''} text-sm`}>{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Opacity range */}
                    <div className="mb-2">
                      <label className="block text-sm mb-1 text-gray-600 dark:text-gray-200">
                        {t("opacity")} <span className="text-blue-900 dark:text-blue-400 font-semibold">{Math.round(opacity * 100)}%</span>
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

        {/* Buttons */}
        {step === 1 && (
          <div className="w-full flex justify-center mt-2">
            <button
              onClick={() => navigate(-1)}
              className="mt-6 w-80 py-1.5 px-14 text-sm border-2 outline-none border-blue-400 font-bold
              text-blue-400 hover:border-red-400 hover:text-red-400 dark:text-blue-300 dark:hover:text-red-400 transition duration-200 rounded"
            >
              {t("cancel")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex justify-between mt-2">
            <button
              onClick={() => { setStep(1); setUploadedFile(null); }}
              className="py-2 px-8 text-sm border-2 outline-none border-blue-400 rounded text-nowrap
              text-blue-400 hover:border-orange-400 hover:text-orange-400 dark:text-blue-300 dark:hover:text-orange-400 transition duration-200"
            >
              {t("changeImage")}
            </button>
            <button
              onClick={handleSave}
              className="py-2 px-16 text-sm border-2 outline-none border-blue-400 rounded
              text-blue-400 hover:border-green-400 hover:text-green-400 dark:text-blue-300 dark:hover:text-green-400 transition duration-200"
            >
              {t("savE")}
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 h-full w-full">
        <MapContainer
          zoom={20}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Disable default zoom control
        >
          <SetInitialView center={userLocation ?? [51.505, -0.09]} />
          <TileLayer
            url={
              mapType === 'satellite'
                ? satelliteLayer
                : isDarkMode
                  ? darkLayer
                  : standardLayer
            }
            attribution={
              mapType === 'satellite'
                ? '© <a href="https://cloud.maptiler.com/">Maptiler</a>'
                : isDarkMode
                  ? '© <a href="https://cloud.maptiler.com/">Maptiler</a>'
                  : '© <a href="https://mapbox.com/">MapBox</a>'
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
            dimensionWidth={dimensionWidth}
            dimensionHeight={dimensionHeight}
            isEditMode={isEditMode}
          />

          <ZoomControl />
          <CenterControl setUserLocation={setUserLocation} />
          <ModeControl setMapType={setMapType} />
          {userLocation && (
            <Marker position={userLocation} icon={customIcon}>
              <Popup>{t("youAreHere")}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

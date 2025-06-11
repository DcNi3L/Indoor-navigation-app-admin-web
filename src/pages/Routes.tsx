import { useState } from "react";
import { useAllFloors, useAllBuildings } from "../services/useBuildingService";
import FloorEditor from "../components/layouts/FloorEditor";
import { FaBuilding, FaMapMarkedAlt } from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
import { toast } from "react-hot-toast";
import { t } from "i18next";

export default function RoutesPage() {
  const { data: floors = [] } = useAllFloors();
  const { data: buildings = [] } = useAllBuildings();

  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [floorImageUrl, setFloorImageUrl] = useState<string>("");
  const [floorWidth, setFloorWidth] = useState<number>(0);
  const [floorHeight, setFloorHeight] = useState<number>(0);
  const [floorId, setFloorId] = useState<number>(0);

  const handleSelectFloor = (floor: any) => {
    if (!floor.floorPictureUrl) {
      toast.error(t("noFloorImg"));
      return;
    }

    setSelectedFloor(floor);
    setFloorImageUrl(floor.floorPictureUrl);
    setFloorWidth(floor.dimensionWidth);
    setFloorHeight(floor.dimensionHeight);
    setFloorId(floor.id);
  };

  const getBuildingTypeIcon = (buildingType: string) => {
    switch (buildingType?.toLowerCase()) {
      case 'house':
        return '🏠';
      case 'mall':
        return '🏬';
      case 'educational':
        return '🏫';
      case 'medical':
        return '🏥';
      default:
        return '🏢';
    }
  };

  const getBuildingTypeColor = (buildingType: string) => {
    switch (buildingType?.toLowerCase()) {
      case 'house':
        return 'from-green-400 to-green-600';
      case 'mall':
        return 'from-purple-400 to-purple-600';
      case 'educational':
        return 'from-blue-400 to-blue-600';
      case 'medical':
        return 'from-red-400 to-red-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  if (!selectedFloor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6 mt-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                <FaMapMarkedAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("floorSel")}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Select a floor plan to start editing routes and POI nodes
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Floors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{floors.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <FaBuilding className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buildings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{buildings.length}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                  <FaMapMarkedAlt className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready to Edit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {floors.filter((f: any) => f.floorPictureUrl).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <FaArrowLeftLong className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Floor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {floors.map((floor: any) => {
              const building = buildings.find((b: any) => b.id === floor.buildingId);
              const buildingType = building?.type || 'default';
              
              return (
                <div
                  key={floor.id}
                  onClick={() => handleSelectFloor(floor)}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
                  {/* Building Type Badge */}
                  <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r ${getBuildingTypeColor(buildingType)} text-white text-xs font-semibold shadow-lg`}>
                    <span className="mr-1">{getBuildingTypeIcon(buildingType)}</span>
                    {buildingType.toUpperCase()}
                  </div>

                  {/* Floor Image */}
                  <div className="relative h-48 overflow-hidden">
                    {floor.floorPictureUrl ? (
                      <img
                        src={floor.floorPictureUrl || "/placeholder.svg"}
                        alt={`Floor ${floor.name}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <div className="text-center">
                          <FaBuilding className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No Image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Edit Indicator */}
                    {floor.floorPictureUrl && (
                      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaMapMarkedAlt className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* Floor Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {floor.name || `Floor ${floor.floorNumber || 'Unknown'}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {building?.name || 'Unknown Building'}
                        </p>
                      </div>
                    </div>

                    {/* Floor Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Floor Number:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {floor.floorNumber || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {floor.dimensionWidth}×{floor.dimensionHeight}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {floor.floorPictureUrl ? (
                        <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02]">
                          Edit Routes & POIs
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium py-2 px-4 rounded-xl cursor-not-allowed"
                        >
                          No Image Available
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {floors.length === 0 && (
            <div className="text-center py-16">
              <FaBuilding className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No floors available
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Add some floor plans to start creating routes and POIs
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 mt-12 p-4 w-full">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <button 
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-200 dark:to-gray-400 text-white dark:text-gray-800 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            onClick={() => setSelectedFloor(null)}
          >
            <FaArrowLeftLong size={20}/>
          </button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("routeEditing")}: {selectedFloor.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Create and manage navigation routes and points of interest
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Ready to edit</span>
            </div>
          </div>
        </div>

        {/* Floor Editor */}
        <FloorEditor 
          imageUrl={floorImageUrl} 
          width={floorWidth} 
          height={floorHeight} 
          floorId={floorId}
          buildingType={buildings.find((b: any) => b.id === selectedFloor.buildingId)?.type || 'default'}
        />
      </div>
    </div>
  );
}

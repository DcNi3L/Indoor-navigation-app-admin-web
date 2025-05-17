import { useState } from "react";
import { useAllFloors, useAllBuildings } from "../services/useBuildingService";
import FloorEditor from "../components/layouts/FloorEditor";
import { toast } from "react-hot-toast";
import { t } from "i18next";

export default function RoutesPage() {
  const { data: floors = [] } = useAllFloors();
  const { data: buildings = [] } = useAllBuildings();

  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [floorImageUrl, setFloorImageUrl] = useState<string>("");
  const [floorWidth, setFloorWidth] = useState<number>(0);
  const [floorHeight, setFloorHeight] = useState<number>(0);

  const handleSelectFloor = (floor: any) => {
    if (!floor.floorPictureUrl) {
      toast.error(t("noFloorImg"));
      return;
    }

    setSelectedFloor(floor);
    setFloorImageUrl(floor.floorPictureUrl);
    setFloorWidth(floor.dimensionWidth);
    setFloorHeight(floor.dimensionHeight);
  };

  if (!selectedFloor) {
    return (
      <div className="p-6 mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t("floorSel")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {floors.map((floor: any) => {
            const building = buildings.find((b: any) => b.id === floor.buildingId);
            return (
              <div
                key={floor.id}
                onClick={() => handleSelectFloor(floor)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition"
              >
                <img
                  src={floor.floorPictureUrl}
                  alt="schema"
                  className="h-72 w-full object-cover rounded"
                />
                <h3 className="mt-2 font-semibold text-lg text-gray-800 dark:text-white">
                  {floor.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{building?.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 p-4 w-full space-y-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {t("routeEditing")}: {selectedFloor.name}
      </h2>

      {<FloorEditor imageUrl={floorImageUrl} width={floorWidth} height={floorHeight} />}
    </div>
  );
}

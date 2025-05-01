import { JSX, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaHome,
  FaHospital,
  FaUniversity,
} from "react-icons/fa";
import { FaShop } from "react-icons/fa6";
import { useAllBuildings } from "../services/useBuildingService";
import { toast } from "react-hot-toast";

const typeIconMap: Record<string, JSX.Element> = {
  HOUSE: <FaHome className="text-indigo-600 text-6xl w-60 h-60" />,
  MALL: <FaShop className="text-pink-500 text-6xl w-60 h-60" />,
  MEDICAL: <FaHospital className="text-red-500 text-6xl w-60 h-60" />,
  EDUCATIONAL: <FaUniversity className="text-green-500 text-6xl w-60 h-60" />,
};

export default function Buildings() {
  const [filterType, setFilterType] = useState<string>("ALL");
  const BUILDING_TYPES = ["ALL", "HOUSE", "MALL", "MEDICAL", "EDUCATIONAL"];
  const navigate = useNavigate();

  const { data: buildings = [], isLoading } = useAllBuildings()

  const filteredBuildings = filterType === "ALL"
  ? buildings
  : buildings.filter((b: any) => b.type === filterType);

  return (
    <div className="p-6 space-y-6 mt-12 text-gray-900 dark:text-white">
      {/* Add Building */}
      <div className="bg-gradient-to-br from-indigo-50 dark:from-gray-800 to-white dark:to-gray-900 p-6 px-12 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            All Buildings
          </h2>
          <button
            onClick={() => navigate("/create-location")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow transition"
          >
            <FaPlus /> Start From Map
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {BUILDING_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium border transition",
                filterType === type
                  ? "bg-indigo-600 text-white scale-110 border-indigo-600"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 hover:scale-110 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Display Buildings */}
      <div>
        {isLoading ? (
          <p className="text-gray-500 px-12 dark:text-gray-400">Loading...</p>
        ) : buildings.length === 0 ? (
          <p className="text-gray-500 px-12 dark:text-gray-400">No buildings found.</p>
        ) : (
          <div className="grid gap-6 px-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBuildings.map((building: any) => (
              <div
                key={building.id}
                onClick={() =>
                  navigate("/create-location", { state: { building } })
                }
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:ring-2 hover:ring-indigo-500 hover:scale-105 transition cursor-pointer group"
              >
                {/* Icon */}
                <div className="mb-4">
                  {typeIconMap[building.type] ?? typeIconMap["HOUSE"]}
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold mb-1">
                  {building.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {building.address}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {building.globalPosition.x}, {building.globalPosition.y}
                </p>

                {/* Actions */}
                <div className="flex gap-4 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/create-location", { state: { building } });
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 transition"
                    title="Edit"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.error("Удаление ещё не реализовано");
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 transition"
                    title="Delete"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAllFloors, useDeleteFloor, useAllBuildings } from "../services/useBuildingService";
import { useDeleteFileByUrl } from "../services/supabaseClient";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

export default function Floors() {
  const { t } = useTranslation();
  const [buildingFilter, setBuildingFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const BUILDING_TYPES = ["ALL", "HOUSE", "MALL", "MEDICAL", "EDUCATIONAL"];
  const navigate = useNavigate();

  const { data: floors = [], isLoading } = useAllFloors();
  const { data: buildings = [] } = useAllBuildings();
  const { mutateAsync: deleteFloor } = useDeleteFloor();
  const { mutateAsync: deleteFileByUrl } = useDeleteFileByUrl();
  const queryClient = useQueryClient();

  const buildingNames = useMemo(() => {
    return buildings.map((b: any) => b.name).filter(Boolean);
  }, [buildings]);

  const suggestions = useMemo(() => {
    return buildingNames
      .filter((name: any) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }, [searchTerm, buildingNames]);

  const filteredFloors = floors.filter((floor: any) => {
    const building = buildings.find((b: any) => b.id === floor.buildingId);
    const matchesType =
      buildingFilter === "ALL" || building?.type === buildingFilter;
    const matchesSearch =
      searchTerm.trim() === "" ||
      building?.name.toLowerCase().includes(searchTerm.toLowerCase());
  
    return matchesType && matchesSearch;
  });

  const handleDelete = async (e: React.MouseEvent, id: number, picture_url: string) => {
    e.stopPropagation();
    try {
      await deleteFileByUrl(picture_url);
      await deleteFloor(id);
      toast.success(t("floorDeleted"));
      queryClient.invalidateQueries({
        queryKey: ['allFloors']
      });
    } catch (e) {
      console.error("Delete failed:", e);
      toast.error(t("floorDeleteError"));
    }
  };

  return (
    <div className="p-6 space-y-6 mt-12 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 dark:from-gray-800 to-white dark:to-gray-900 p-6 px-12 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            {t("allFloors")}
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t("searchPlaceholder")}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.map((suggestion: any) => (
                    <li
                      key={suggestion}
                      onMouseDown={() => {
                        setSearchTerm(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => navigate("/create-location")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow transition"
            >
              + {t("addFloor")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {BUILDING_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setBuildingFilter(type)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium border transition",
                buildingFilter === type
                  ? "bg-indigo-600 text-white scale-110 border-indigo-600"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 hover:scale-110 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {t(type.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Cards */}
      <div>
        {isLoading ? (
          <p className="text-gray-500 px-12 dark:text-gray-400">{t("loading")}</p>
        ) : filteredFloors.length === 0 ? (
          <p className="text-gray-500 px-12 dark:text-gray-400">{t("noFloorsFound")}</p>
        ) : (
          <div className="grid gap-6 px-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFloors.map((floor: any) => {
              const building = buildings.find((b: any) => b.id === floor.buildingId);

              return (
                <div
                  key={floor.id}
                  onClick={() =>
                    navigate("/create-location", { state: { floor } })
                  }
                  className="bg-white relative dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:ring-2 hover:ring-indigo-500 hover:scale-105 transition cursor-pointer group"
                >
                  <p className="absolute bottom-5 left-6 text-gray-500">{t(building.type.toLowerCase())}</p>
                  
                  {/* Image Floor */}
                  <div className="mb-4">
                    <img 
                      className="object-cover text-indigo-600 text-6xl w-auto h-96" 
                      src={floor.floorPictureUrl} 
                      alt="Floor schema"/>
                  </div>

                  {/* Info */}
                  <h3 className="text-lg font-semibold mb-1">{floor.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("building")} - {building.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {floor.dimensionWidth}m × {floor.dimensionHeight}m
                  </p>

                  {/* Actions */}
                  <div className="flex gap-4 mt-auto">
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 transition"
                      title={t("edit")}
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, floor.id, floor.floorPictureUrl)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 transition"
                      title={t("delete")}
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

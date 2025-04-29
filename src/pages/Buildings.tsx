import { useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useBuildingsByUser, useCreateBuilding } from "../services/useBuildingService";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

export default function Buildings() {
  const userId = Number(Cookies.get("userId")); // или из context/auth
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingAddress, setNewBuildingAddress] = useState("");

  const { data: buildings = [], isLoading } = useBuildingsByUser(userId);
  const { mutateAsync: createBuilding } = useCreateBuilding();

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim() || !newBuildingAddress.trim()) return;

    try {
      await createBuilding({
        name: newBuildingName,
        address: newBuildingAddress,
        userId,
        description: "",
        type: "HOUSE",
        globalPosition: { x: 0, y: 0 }
      });
      toast.success("Building created");
      setNewBuildingName("");
      setNewBuildingAddress("");
    } catch (e) {
      toast.error("Failed to create building");
    }
  };

  return (
    <div className="p-6 space-y-6 mt-12 text-gray-900 dark:text-white">
      {/* Добавление нового здания */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Add New Building</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Building Name"
            value={newBuildingName}
            onChange={(e) => setNewBuildingName(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Address"
            value={newBuildingAddress}
            onChange={(e) => setNewBuildingAddress(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleAddBuilding}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <FaPlus /> Add
          </button>
        </div>
      </div>

      {/* Список зданий */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">All Buildings</h2>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : buildings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No buildings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Address</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {buildings.map((building: any, index: any) => (
                  <tr key={building.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{building.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{building.address}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600">
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

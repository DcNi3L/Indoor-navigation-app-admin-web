import StatCard from "../components/ui/StatCard";
import { FaBuilding, FaMap, FaRoute, FaQrcode, FaUserCog, FaDatabase } from "react-icons/fa";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 mt-10">
      {/* Метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Buildings" value={3} icon={<FaBuilding />} color="bg-blue-50" />
        <StatCard title="Floors" value={7} icon={<FaMap />} color="bg-green-50" />
        <StatCard title="Routes" value={14} icon={<FaRoute />} color="bg-yellow-50" />
        <StatCard title="QR Points" value={20} icon={<FaQrcode />} color="bg-red-50" />
        <StatCard title="Admins" value={2} icon={<FaUserCog />} color="bg-purple-50" />
        <StatCard title="Storage Size" value="14.2MB" icon={<FaDatabase />} color="bg-gray-100" />
      </div>

      {/* Раздел: Последние действия */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✅ New floor added to Building A</li>
          <li>✅ Route "Main Corridor" updated</li>
          <li>⚠️ QR Code #231 missing location</li>
          <li>✅ Building B schema uploaded</li>
        </ul>
      </div>

      {/* Раздел: Быстрые действия */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">Add New Building</button>
          <button className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">Upload Floor Plan</button>
          <button className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition">Create New Route</button>
          <button className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition">Scan QR Code</button>
          <button className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition">Manage Admins</button>
        </div>
      </div>
    </div>
  );
}

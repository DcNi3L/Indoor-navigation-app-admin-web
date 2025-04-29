import { useNavigate } from "react-router-dom";
import StatCard from "../components/ui/StatCard";
import {
  FaBuilding,
  FaMap,
  FaRoute,
  FaQrcode,
  FaUserCog,
  FaDatabase,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { getFullBucketSize } from "../services/supabaseClient";
import { useState } from "react";
import { getAllAdmins } from "../services/api";

export default function Dashboard() {
  const [size, setSize] = useState('0');
  const [adminCount, setAdminCount] = useState(0);
  const navigate = useNavigate();

  getAllAdmins().then((data) => {
    setAdminCount(data.length);
  });

  getFullBucketSize('profile-images').then((result) => {
    setSize(String(result ?? 0));
  });

  return (
    <div className="p-6 space-y-6 mt-10 dark:bg-gray-900">
      {/* Метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Buildings"
          value={3}
          icon={<FaBuilding size={24} />}
          color="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800"
        />
        <StatCard
          title="Floors"
          value={7}
          icon={<FaMap size={24} />}
          color="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-700 dark:to-green-800"
        />
        <StatCard
          title="Routes"
          value={14}
          icon={<FaRoute size={24} />}
          color="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-700 dark:to-yellow-800"
        />
        <StatCard
          title="QR Points"
          value={20}
          icon={<FaQrcode size={24} />}
          color="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-700 dark:to-red-800"
        />
        <StatCard
          title="Admins"
          value={adminCount}
          icon={<FaUserCog size={24} />}
          color="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-700 dark:to-purple-800"
        />
        <StatCard
          title="Storage Size"
          value={`${size}MB / 50MB`}
          icon={<FaDatabase size={24} />}
          color="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
        />
      </div>

      {/* Раздел: Последние действия */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Activity</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-center space-x-2">
            <FaCheckCircle className="text-green-500" />
            <span>New floor added to Building A</span>
          </li>
          <li className="flex items-center space-x-2">
            <FaCheckCircle className="text-green-500" />
            <span>Route "Main Corridor" updated</span>
          </li>
          <li className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-yellow-500" />
            <span>QR Code #231 missing location</span>
          </li>
          <li className="flex items-center space-x-2">
            <FaCheckCircle className="text-green-500" />
            <span>Building B schema uploaded</span>
          </li>
        </ul>
      </div>

      {/* Раздел: Быстрые действия */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Quick Actions</h3>
        <div className="z-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/create-location")}
            className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-transform duration-300 ease-in-out transform hover:scale-105"
          >
            <FaBuilding className="mr-2" /> Add New Location
          </button>
          <button className="flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg shadow hover:bg-green-700 transition-transform duration-300 ease-in-out transform hover:scale-105">
            <FaMap className="mr-2" /> Upload Floor Plan
          </button>
          <button className="flex items-center justify-center bg-yellow-600 text-white py-3 px-4 rounded-lg shadow hover:bg-yellow-700 transition-transform duration-300 ease-in-out transform hover:scale-105">
            <FaRoute className="mr-2" /> Create New Route
          </button>
          <button className="flex items-center justify-center bg-red-600 text-white py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-transform duration-300 ease-in-out transform hover:scale-105">
            <FaQrcode className="mr-2" /> Scan QR Code
          </button>
          <button className="flex items-center justify-center bg-purple-600 text-white py-3 px-4 rounded-lg shadow hover:bg-purple-700 transition-transform duration-300 ease-in-out transform hover:scale-105">
            <FaUserCog className="mr-2" /> Manage Admins
          </button>
        </div>
      </div>
    </div>
  );
}
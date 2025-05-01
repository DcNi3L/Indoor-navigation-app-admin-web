import { useNavigate } from "react-router-dom";
import ActionCard from "../components/ui/ActionCard";
import AdminCards from "../components/ui/AdminCard";
import { useFullBucketSize } from "../services/supabaseClient";
import { useAllAdmins } from "../services/authApiService";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaBuilding, FaMap, FaRoute, FaQrcode, FaUserCog } from "react-icons/fa";
import { useBuildingsByUser, useAllFloors } from "../services/useBuildingService";
import Cookies from "js-cookie";

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = Cookies.get('userId') || '';
  const userEmail = Cookies.get('userEmail') || '';

  // Получаем всех админов через React Query
  const { data: admins = [] } = useAllAdmins();

  // Получаем размер хранилища через React Query
  const { data: result = 0 } = useFullBucketSize('profile-images');
  let size = Number((result / (1024 * 1024)).toFixed(2));

  const { data: buildings = [] } = useBuildingsByUser(Number(userId));

  const { data: floors = [] } = useAllFloors();


  const storageData = [
    { name: 'Used', value: size },
    { name: 'Free', value: 50 - size },
  ];

  const colors = ['#FF0000', '#00FF00'];

  const buildingsData = [
    { name: "Buildings", value: buildings.length, to: "buildings" },
    { name: "Floors", value: floors.length, to: "floors" },
    { name: "Routes", value: 14, to: "routes" },
    { name: "QR Points", value: 20, to: "qr" },
  ];

  const barColors = [
    '#6366F1', // Buildings - Indigo
    '#34D399', // Floors - Green
    '#FBBF24', // Routes - Yellow
    '#F87171', // QR Points - Red
  ];

  return (
    <div className="p-6 space-y-6 mt-12 dark:bg-gray-900">
      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buildings/Floors/Routes/QR */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide mb-4">System Entities</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {buildingsData.map((entry, index) => (
                  <Cell 
                    onClick={() => {navigate(`/${entry.to}`)}} 
                    key={`cell-${index}`} 
                    fill={barColors[index % barColors.length]}
                    className="cursor-pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Хранилище */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide mb-4">Storage Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={storageData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {storageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            Used <span className="text-red-500">{size}MB</span> of <span className="text-green-500">50MB</span>
          </div>
        </div>
      </div>

      {/* Карточки админов */}
      {Array.isArray(admins) &&
        admins
          .filter((admin: any) => admin.email !== userEmail)
          .map((admin: any) => (
            <AdminCards key={admin.id} admins={admin} />
          ))}

      {/* Быстрые действия */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ActionCard
            color="bg-indigo-500 hover:bg-indigo-600"
            icon={<FaBuilding size={28} />}
            title="Add Building"
            onClick={() => navigate("/buildings")}
          />
          <ActionCard
            color="bg-green-500 hover:bg-green-600"
            icon={<FaMap size={28} />}
            title="Upload Floor"
            onClick={() => navigate("/floors")}
          />
          <ActionCard
            color="bg-yellow-400 hover:bg-yellow-500"
            icon={<FaRoute size={28} />}
            title="Create Route"
            onClick={() => navigate("/routes")}
          />
          <ActionCard
            color="bg-red-500 hover:bg-red-600"
            icon={<FaQrcode size={28} />}
            title="Scan QR"
            onClick={() => navigate("/qr")}
          />
          <ActionCard
            color="bg-purple-500 hover:bg-purple-600"
            icon={<FaUserCog size={28} />}
            title="Manage Admins"
          />
        </div>
      </div>
    </div>
  );
}

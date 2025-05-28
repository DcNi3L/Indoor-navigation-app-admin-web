import { useNavigate } from "react-router-dom";
import ActionCard from "../components/ui/ActionCard";
import AdminCards from "../components/ui/AdminCard";
import { useDeleteAllFilesInFolder, useFullBucketSize } from "../services/supabaseClient";
import { useAllAdmins } from "../services/authApiService";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FaBuilding, FaMap, FaRoute, FaQrcode } from "react-icons/fa";
import { useAllBuildings, useAllFloors } from "../services/useBuildingService";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: admins = [] } = useAllAdmins();
  const { data: result = 0 } = useFullBucketSize('profile-images');
  let size = Number((result as any / (1024 * 1024)).toFixed(2));
  const { data: buildings = [] } = useAllBuildings();
  const { data: floors = [] } = useAllFloors();
  const qrCodes = JSON.parse(localStorage.getItem("qrList") || "[]");
  const deleteAllFilesMutation = useDeleteAllFilesInFolder();
  const [isDeleting, setIsDeleting] = useState(false);
  const [routeCounts, setRouteCounts] = useState<{ floorId: number; routeCount: number }[]>([]);

  useEffect(() => {
    async function getRoutesPerFloor() {
      try {
        const floorsRes = await axios.get(`${process.env.REACT_APP_INDOOR_URL}/floors`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("accessToken")}`
          }
        });

        const floors = floorsRes.data || [];

        const results = await Promise.all(
          floors.map(async (floor: any) => {
            try {
              const nodesRes = await axios.get(
                `${process.env.REACT_APP_INDOOR_URL}/floors/${floor.id}/nodes`,
                {
                  headers: {
                    Authorization: `Bearer ${Cookies.get("accessToken")}`
                  }
                }
              );

              const nodes = nodesRes.data || [];
              const routeNodeCount = nodes.filter((n: any) => n.type === "ROUTE_NODE").length;

              return {
                floorId: floor.id,
                routeCount: routeNodeCount
              };
            } catch {
              return {
                floorId: floor.id,
                routeCount: 0
              };
            }
          })
        );

        setRouteCounts(results);
      } catch (err) {
        console.error("Ошибка при получении этажей:", err);
      }
    }

    getRoutesPerFloor();
  }, []);

  const handleClearStorage = () => {
    if (window.confirm(t("confirmClearStorage"))) {
      setIsDeleting(true);
      deleteAllFilesMutation.mutate(
        { bucketName: 'profile-images', path: '' },
        {
          onSettled: () => setIsDeleting(false),
        }
      );
    }
  };

  const freeValue = 50 - size;

  const storageData = [
    { name: t("used"), value: size },
    { name: t("free"), value: Math.floor(freeValue * 100) / 100 },
  ];

  const colors = ['#FF0000', '#00FF00'];

  const totalRoutes = routeCounts.reduce((sum, r) => sum + r.routeCount, 0);
  const buildingsData = [
    { name: t("buildings"), [t("value")]: buildings.length, to: "buildings" },
    { name: t("floors"), [t("value")]: floors.length, to: "floors" },
    { name: t("routes"), [t("value")]: totalRoutes, to: "routes" },
    { name: t("qrPoints"), [t("value")]: qrCodes.length, to: "qr" },
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
          <h2 className="text-xl text-center font-bold text-gray-800 dark:text-white tracking-wide mb-4">
            {t("systemEntities")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey={t("value")} radius={[8, 8, 0, 0]}>
                {buildingsData.map((entry, index) => (
                  <Cell 
                    onClick={() => navigate(`/${entry.to}`)} 
                    key={`cell-${index}`} 
                    fill={barColors[index % barColors.length]}
                    className="cursor-pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Хранилище */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide mb-4">
            {t("storageUsage")}
          </h2>

          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={250} className="mb-4">
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

          {/* Storage Info */}
          <div className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t("used")} <span className="text-red-500">{size}MB</span> {t("of")} <span className="text-green-500">50MB</span>
          </div>

          {/* Clear Storage Button */}
          <button
            onClick={handleClearStorage}
            disabled={isDeleting || deleteAllFilesMutation.status === 'pending'}
            className={`px-6 py-2 rounded-full font-semibold text-white transition-all ${
              isDeleting || deleteAllFilesMutation.status === 'pending'
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 shadow-md'
            }`}
          >
            {isDeleting || deleteAllFilesMutation.status === 'pending'
              ? t("clearingStorage")
              : t("clearStorage")}
          </button>
        </div>
      </div>

      {/* Карточки админов */}
      {Array.isArray(admins) && <AdminCards admins={admins} />}

      {/* Быстрые действия */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          {t("quickActions")}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ActionCard
            color="bg-indigo-500 hover:bg-indigo-600"
            icon={<FaBuilding size={28} />}
            title={t("addBuilding")}
            onClick={() => navigate("/buildings")}
          />
          <ActionCard
            color="bg-green-500 hover:bg-green-600"
            icon={<FaMap size={28} />}
            title={t("uploadFloor")}
            onClick={() => navigate("/floors")}
          />
          <ActionCard
            color="bg-yellow-400 hover:bg-yellow-500"
            icon={<FaRoute size={28} />}
            title={t("createRoute")}
            onClick={() => navigate("/routes")}
          />
          <ActionCard
            color="bg-red-500 hover:bg-red-600"
            icon={<FaQrcode size={28} />}
            title={t("scanQR")}
            onClick={() => navigate("/qr")}
          />
        </div>
      </div>
    </div>
  );
}

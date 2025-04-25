import { JSX } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaHome, FaBuilding, FaMap, FaRoute, FaQrcode } from "react-icons/fa";
import { LuLayoutPanelLeft } from "react-icons/lu";

interface SidebarItemProps {
  to: string;
  icon: JSX.Element;
  label: string;
  active: boolean;
}

function SidebarItem({ to, icon, label, active }: SidebarItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 py-2 px-4 rounded-lg transition-colors duration-300 ${
        active
          ? "bg-blue-500 text-white dark:bg-blue-600"
          : "text-gray-800 hover:bg-blue-500 hover:text-white dark:text-gray-300 dark:hover:bg-blue-600"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();

  // Список пунктов меню
  const menuItems = [
    {to: "/", icon: <FaHome size={20} />, label: "Home"},
    { to: "/buildings", icon: <FaBuilding size={20} />, label: "Buildings" },
    { to: "/floors", icon: <FaMap size={20} />, label: "Floors" },
    { to: "/routes", icon: <FaRoute size={20} />, label: "Routes" },
    { to: "/qr", icon: <FaQrcode size={20} />, label: "QR Points" },
  ];

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-white dark:bg-gray-900 p-6 z-40 shadow-md dark:shadow-gray-700">
      {/* Заголовок */}
      <Link to={"/"} className="text-2xl font-bold mb-8 tracking-wide text-gray-800 dark:text-white flex gap-4 items-center">
        <LuLayoutPanelLeft size={30}/>
        Indoor Panel
      </Link>

      {/* Меню */}
      <nav className="space-y-4">
        {menuItems.map((item) => {
          const isActive =
            item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);

          return (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={isActive}
            />
          );
        })}
      </nav>
    </aside>
  );
}
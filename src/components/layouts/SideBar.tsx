import { JSX } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaBuilding, FaMap, FaRoute, FaQrcode } from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarItemProps {
  to: string;
  icon: JSX.Element;
  labelKey: string;
  active: boolean;
}

function SidebarItem({ to, icon, labelKey, active }: SidebarItemProps) {
  const { t } = useTranslation();

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
      <span className="font-medium">{t(labelKey)}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { to: "/", icon: <FaHome size={20} />, labelKey: "dashboard" },
    { to: "/buildings", icon: <FaBuilding size={20} />, labelKey: "buildings" },
    { to: "/floors", icon: <FaMap size={20} />, labelKey: "floors" },
    { to: "/routes", icon: <FaRoute size={20} />, labelKey: "routes" },
    { to: "/qr", icon: <FaQrcode size={20} />, labelKey: "qrPoints" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 p-6 shadow-md dark:shadow-gray-700 transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
      }`}
    >
      {/* Заголовок */}
      <Link
        to={"/"}
        className="text-2xl font-bold mb-8 tracking-wide text-gray-800 dark:text-white flex gap-2 items-center"
      >
        <img src='/assets/logo.png' className="w-10 h-10 object-contain" alt="Logo" />
        {t('appName')}
      </Link>

      {/* Меню */}
      <nav className="space-y-4">
        {menuItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          return (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              labelKey={item.labelKey}
              active={isActive}
            />
          );
        })}
      </nav>
    </aside>
  );
}

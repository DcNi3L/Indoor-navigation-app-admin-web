import { useState } from "react";
import { useLocation } from "react-router-dom";
import { FaBell, FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { translations } from "../../utils/translations";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({darkMode, toggleDarkMode}: NavbarProps) {
  const [language, setLanguage] = useState<"EN" | "RU">("EN");
  const t = translations[language]; 
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/buildings")) return t.buildings;
    if (path.startsWith("/floors")) return t.floors;
    if (path.startsWith("/routes")) return t.routes;
    if (path.startsWith("/qr")) return t.qrPoints;
    if (path === "/") return t.dashboard;
    return t.adminPanel;
  };

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "RU" : "EN");
  };

  return (
    <nav className="bg-white fixed top-0 left-64 right-0 dark:bg-gray-900 shadow dark:shadow-gray-700 px-6 py-4 flex justify-between items-center transition-colors duration-300">
      {/* Название текущей страницы */}
      <h1 className="text-2xl font-bold tracking-wider text-gray-800 dark:text-white">
        {getPageTitle()}
      </h1>

      {/* Элементы управления */}
      <div className="flex items-center space-x-6">
        {/* Переключение языка */}
        <button
          onClick={toggleLanguage}
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
        >
          {language}
        </button>

        {/* Переключение темы */}
        <button
          onClick={toggleDarkMode}
          className="text-xl text-gray-600 dark:text-gray-300 hover:text-yellow-500"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Уведомления */}
        <button className="relative text-xl text-gray-600 dark:text-gray-300 hover:text-blue-600">
          <FaBell />
          <span className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
        </button>

        {/* Профиль */}
        <div className="relative group cursor-pointer">
          <div className="flex items-center text-gray-600 dark:text-gray-300 space-x-1 hover:text-blue-500">
            <FaUserCircle className="text-2xl" />
            <IoIosArrowDown />
          </div>
          <div className="absolute right-0 top-10 hidden group-hover:block bg-white dark:bg-gray-800 shadow-lg rounded-md w-40 py-2 z-50">
            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
              Profile
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

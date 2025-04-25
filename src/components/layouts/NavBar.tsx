import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FaBell, FaMoon, FaSun, FaUserCircle, FaUser } from "react-icons/fa";
import { IoExit } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { translations } from "../../utils/translations";
import ProfileModal from "../ui/ProfileModal";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({darkMode, toggleDarkMode}: NavbarProps) {
  const [language, setLanguage] = useState<"EN" | "RU">("EN");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const t = translations[language]; 
  const location = useLocation();
  const navigate = useNavigate();

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
          className="text-xl text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-500"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Уведомления */}
        <button className="relative text-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500">
          <FaBell />
          <span className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
        </button>

        {/* Профиль */}
        <div className="relative group cursor-pointer">
          <div
            className="flex items-center text-gray-600 dark:text-gray-300 space-x-1 hover:text-blue-500 dark:hover:text-blue-500"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <FaUserCircle className="text-2xl" />
            <IoIosArrowDown />
          </div>
          <div
            className="absolute right-0 top-10 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 shadow-lg rounded-md w-40 py-2 z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="profile-menu"
          >
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full text-left px-4 py-2 text-sm flex gap-2 items-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
            >
              <FaUser /> Profile
            </button>
            <hr className="border-t border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => {navigate('/login')}}
              className="flex gap-2 items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
              role="menuitem"
            >
              <IoExit /> Logout
            </button>
          </div>
        </div>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} language={language} />
    </nav>
  );
}

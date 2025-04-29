import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({ children, darkMode, toggleDarkMode }: LayoutProps) {
  const location = useLocation();
  const hiddenPaths = ["/create-location"];
  const shouldHideLayout = hiddenPaths.includes(location.pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex">
      {/* Sidebar (отображается только если не скрыт) */}
      {!shouldHideLayout && <Sidebar isOpen={sidebarOpen} />}

      {/* Основной контент */}
      <div
        className={`w-full min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300 ${
          !shouldHideLayout && sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Navbar (только если не скрыт) */}
        {!shouldHideLayout && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} toggleSidebar={toggleSidebar} isOpen={sidebarOpen} />}

        {/* Контент страницы */}
        <main className={shouldHideLayout ? "" : "p-6"}>{children}</main>
      </div>
    </div>
  );
}

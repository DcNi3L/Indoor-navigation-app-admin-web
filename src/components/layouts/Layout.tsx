import { ReactNode } from "react";
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

  return (
    <div className="flex">
      {/* Sidebar (отображается только если не скрыт) */}
      {!shouldHideLayout && <Sidebar />}

      {/* Основной контент */}
      <div
        className={`w-full min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors ${
          shouldHideLayout ? "" : "ml-64"
        }`}
      >
        {/* Navbar (только если не скрыт) */}
        {!shouldHideLayout && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}

        {/* Контент страницы */}
        <main className={shouldHideLayout ? "" : "p-6"}>{children}</main>
      </div>
    </div>
  );
}

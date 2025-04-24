import { ReactNode } from "react";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({ children, darkMode, toggleDarkMode }: LayoutProps) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 w-full min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

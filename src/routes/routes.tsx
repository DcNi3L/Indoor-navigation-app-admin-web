import { Outlet, RouteObject } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import CreateLocation from "../pages/CreateLocation";
import Layout from "../components/layouts/Layout";
import { useEffect, useState } from "react";

export const appRoutes: RouteObject[] = [
  {
    element: <LayoutWrapper />, // все страницы с layout
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      // другие страницы
    ],
  },
  {
    path: "/create-location",
    element: <CreateLocation />, // без layout
  },
];


function LayoutWrapper() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <Layout darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
      <Outlet />
    </Layout>
  );
}

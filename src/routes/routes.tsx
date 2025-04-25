import { Outlet, RouteObject } from "react-router-dom";
import Layout from "../components/layouts/Layout";
import { useEffect, useState } from "react";
import Dashboard from "../pages/Dashboard";
import Buildings from "../pages/Buildings";
import Floors from "../pages/Floors";
import Routes from "../pages/Routes";
import QRPoints from "../pages/QRPoints";
import CreateLocation from "../pages/CreateLocation";
import Login from "../pages/Login";
import Register from "../pages/Register";

export const appRoutes: RouteObject[] = [
  {
    element: <LayoutWrapper />, // все страницы с layout
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/buildings",
        element: <Buildings />,
      },
      {
        path: "/floors",
        element: <Floors />,
      },
      {
        path: "/routes",
        element: <Routes />,
      },
      {
        path: "/qr",
        element: <QRPoints />,
      },
    ],
  },
  {
    path: "/create-location",
    element: <CreateLocation />, // без layout
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
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

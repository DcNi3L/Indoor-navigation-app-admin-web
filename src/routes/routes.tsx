import { Outlet, RouteObject } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import AuthGuard from "../components/guards/AuthGuard";
import GuestGuard from "../components/guards/GuestGuard";
import Dashboard from "../pages/Dashboard";
import Buildings from "../pages/Buildings";
import Floors from "../pages/Floors";
import Routes from "../pages/Routes";
import QRPoints from "../pages/QRPoints";
import CreateLocation from "../pages/CreateLocation";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminProfile from "../pages/admins/AdminProfile";

export const appRoutes: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <LayoutWrapper />
      </AuthGuard>
    ),
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
      {
        path: "/admins/:id",
        element: <AdminProfile />,
      },
    ],
  },
  {
    path: "/create-location",
    element: (
      <AuthGuard>
        <CreateLocation />
      </AuthGuard>
    ),
  },
  {
    path: "/login",
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestGuard>
        <Register />
      </GuestGuard>
    ),
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

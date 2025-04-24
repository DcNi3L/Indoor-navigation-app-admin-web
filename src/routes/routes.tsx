// src/routes/routes.tsx
import { RouteObject } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
// import Buildings from "../pages/Buildings";
// import FloorPlans from "../pages/FloorPlans";
// import Navigation from "../pages/Navigation";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Dashboard />,
  },
//   {
//     path: "/buildings",
//     element: <Buildings />,
//   },
//   {
//     path: "/floor-plans",
//     element: <FloorPlans />,
//   },
//   {
//     path: "/navigation",
//     element: <Navigation />,
//   },
];

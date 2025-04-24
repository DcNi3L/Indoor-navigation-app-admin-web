import { useRoutes } from "react-router-dom";
import { appRoutes } from "./routes";

export default function AppRoutes() {
    return useRoutes(appRoutes);
  }
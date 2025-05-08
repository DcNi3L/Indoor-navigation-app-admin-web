import { useRoutes } from "react-router-dom";
import { appRoutes } from "./routes";
import { usePageTitle } from "../components/hooks/usePageTitle";

export default function AppRoutes() {
    usePageTitle();
    return useRoutes(appRoutes);
  }
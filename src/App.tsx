import {BrowserRouter as Router} from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import {useEffect} from "react";
import Cookies from "js-cookie";
import {scheduleTokenRefresh, stopTokenRefresh} from "./services/scheduleToken";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient(); // Если создаете здесь

export default function App() {

  useEffect(() => {
    const refreshToken = Cookies.get("refreshToken");
    const accessToken = Cookies.get("accessToken");

    if (refreshToken && accessToken) {
      console.log("[App] Scheduling token refresh...");
      scheduleTokenRefresh();
    } else {
      if (window.location.pathname !== "/login") {
        console.log("[App] Missing tokens, ensuring logout state.");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("userEmail");
        Cookies.remove("userId");
        localStorage.removeItem("token_expiry");
        stopTokenRefresh();
        window.location.href = "/login";
      }
    }

    return () => {
        console.log("[App] Stopping token refresh on unmount.");
        stopTokenRefresh();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <AppRoutes/>
    </Router>
    </QueryClientProvider>
  );
}
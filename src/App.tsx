import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { scheduleTokenRefresh } from "./services/scheduleToken";

export default function App() {
  useEffect(() => {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      console.log("[App] Scheduling token refresh...");
      scheduleTokenRefresh();
    }
  }, []);

  return(
   <Router>
     <AppRoutes />
   </Router>
 );
}

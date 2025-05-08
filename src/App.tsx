import {BrowserRouter as Router} from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import {useEffect} from "react";
import Cookies from "js-cookie";
import {scheduleTokenRefresh} from "./services/scheduleToken";

export default function App() {
  console.log(process.env.REACT_APP_SUPABASE_URL)
  useEffect(() => {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      console.log("[App] Scheduling token refresh...");
      scheduleTokenRefresh();
    }
  }, []);

  return (
    <Router>
      <AppRoutes/>
    </Router>
  );
}

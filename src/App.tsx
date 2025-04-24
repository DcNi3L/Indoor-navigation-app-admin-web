import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/layouts/Layout";
import { appRoutes } from "./routes/routes";
// import Buildings from "./pages/Buildings";
// import FloorPlans from "./pages/FloorPlans";
// import Navigation from "./pages/Navigation";

export default function App() {

  function AppRoutes({ darkMode, toggleDarkMode }: { darkMode: boolean; toggleDarkMode: () => void }) {
    const routes = useRoutes(appRoutes);
    return (
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        {routes}
      </Layout>
    );
  }

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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
    <Router>
      <AppRoutes darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
    </Router>
  );
}

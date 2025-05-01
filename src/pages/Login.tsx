import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FaSun, FaMoon } from "react-icons/fa";
import { translations } from "../utils/translations";
import { usePanelLogin, fetchUserByEmail } from "../services/authApiService";
import { scheduleTokenRefresh } from "../services/scheduleToken";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"EN" | "RU">("EN");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();
  const { mutateAsync: login } = usePanelLogin();

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
    
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
    
      setError("");
    
      const { accessToken, refreshToken } = await login({ email, password });
      const { data: user } = await fetchUserByEmail(email);
    
      Cookies.set('accessToken', accessToken, { expires: 3400 / 86400 });
      Cookies.set('refreshToken', refreshToken, { expires: 7 });
      Cookies.set('userEmail', email, { expires: 7 });
      Cookies.set('userId', user?.id.toString(), { expires: 3400 / 86400 });
    
      scheduleTokenRefresh();
    
      setTimeout(() => {
        navigate('/');
        window.location.href = "/";
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';
    
      setError(message);
    }    
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

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

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "RU" : "EN");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">

      {/* Форма */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Login
        </h2>

        {error && (
          <div className="mb-4 text-red-500 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded transition-all duration-300"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>

        <hr className="w-full my-6 border-gray-300 dark:border-gray-600" />

        {/* Переключатели темы и языка */}
        <div className="flex items-center justify-center space-x-6">
          {/* Переключатель языка */}
          <button
            onClick={toggleLanguage}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {language}
          </button>

          {/* Переключатель темы */}
          <button
            onClick={toggleDarkMode}
            className="text-xl text-gray-700 dark:text-gray-300 hover:text-yellow-400 transition"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </div>
  );
}

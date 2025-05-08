import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "RU">(i18n.language.toUpperCase() as "EN" | "RU");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const changeLanguage = (lang: "EN" | "RU") => {
    i18n.changeLanguage(lang.toLowerCase());
    setLanguage(lang);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="text-xl font-sans focus:outline-none hover:text-blue-600 dark:hover:text-blue-400"
      >
        {language === "EN" ? 
          <img src="https://flagcdn.com/gb.svg" width="24" alt="EN" /> 
          : 
          <img src="https://flagcdn.com/ru.svg" width="24" alt="RU" />}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-7 w-32 bg-white outline-none border-none dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 transition-all">
          <button
            onClick={() => changeLanguage("EN")}
            className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
          >
            <img src="https://flagcdn.com/gb.svg" width="24" alt="EN" /> English
          </button>
          <hr className="border-t border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => changeLanguage("RU")}
            className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
          >
            <img src="https://flagcdn.com/ru.svg" width="24" alt="RU" /> Русский
          </button>
        </div>
      )}
    </div>
  );
}

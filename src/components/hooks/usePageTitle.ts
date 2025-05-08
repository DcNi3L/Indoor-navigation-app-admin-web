import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function usePageTitle() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname;

    let pageKey = "adminPanel";

    if (path === "/") pageKey = "dashboard";
    else if (path.startsWith("/buildings")) pageKey = "buildings";
    else if (path.startsWith("/floors")) pageKey = "floors";
    else if (path.startsWith("/routes")) pageKey = "routes";
    else if (path.startsWith("/qr")) pageKey = "qrPoints";
    else if (path.startsWith("/admins")) pageKey = "admin";

    document.title = `${t(pageKey)}`;
  }, [location.pathname, i18n.language, t]);
}

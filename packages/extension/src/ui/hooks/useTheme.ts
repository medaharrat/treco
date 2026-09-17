import { useEffect } from "react";
import { useStorage } from "../state/StorageContext.js";

export function useTheme() {
  const { settings } = useStorage();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", settings.theme);
    }
  }, [settings.theme]);
}

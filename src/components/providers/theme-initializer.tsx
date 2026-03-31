"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "real-buzzer-theme";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const shouldUseDark = storedTheme ? storedTheme === "dark" : true;

      document.documentElement.classList.toggle("dark", shouldUseDark);
      document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    } catch {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  return null;
}

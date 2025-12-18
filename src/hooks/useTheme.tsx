import { useEffect, useState, useCallback } from "react";

export type Theme = "student" | "admin";

const THEME_KEY = "theme";

export default function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      return stored || "student";
    } catch (e) {
      return "student";
    }
  });

  useEffect(() => {
    // ensure only the active theme class is present on body
    document.body.classList.remove("student", "admin");
    document.body.classList.add(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "student" ? "admin" : "student")), []);

  return { theme, setTheme, toggleTheme } as const;
}

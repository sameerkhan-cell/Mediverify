import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  portal: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [portal, setPortal] = useState<string>("public");
  const [theme, setThemeState] = useState<Theme>("light");

  const getPortal = (path: string): string => {
    if (path.startsWith("/dashboard")) {
      if (user?.role) {
        const role = user.role.toLowerCase();
        if (role === "admin" || role === "super_admin" || role === "drap_admin") return "admin";
        if (role === "manufacturer") return "manufacturer";
        if (role === "pharmacy") return "pharmacy";
        if (role === "regulator") return "regulator";
        if (role === "customer" || role === "patient") return "patient";
      }

      // Path fallback
      if (path.includes("/dashboard/admin")) return "admin";
      if (path.includes("/dashboard/manufacturer")) return "manufacturer";
      if (path.includes("/dashboard/pharmacy")) return "pharmacy";
      if (path.includes("/dashboard/regulator")) return "regulator";
      if (path.includes("/dashboard/patient")) return "patient";
      return "patient"; // Default dashboard portal is patient/customer
    }
    return "public";
  };

  const applyTheme = (themeValue: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (themeValue === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(themeValue);
    }
  };

  // Sync theme when pathname or user role changes
  useEffect(() => {
    const currentPortal = getPortal(location.pathname);
    setPortal(currentPortal);

    const savedTheme = (localStorage.getItem(`theme-${currentPortal}`) as Theme) || "light";
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, [location.pathname, user?.role]);

  const setTheme = (newTheme: Theme) => {
    const currentPortal = getPortal(location.pathname);
    setThemeState(newTheme);
    localStorage.setItem(`theme-${currentPortal}`, newTheme);
    applyTheme(newTheme);
  };

  // Add listener for prefers-color-scheme changes when system theme is active
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, location.pathname]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, portal }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

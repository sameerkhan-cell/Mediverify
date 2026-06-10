/**
 * DashboardContext — sidebar collapse state + user role context
 * Used by DashShell, DashSidebar, DashNavbar.
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import type { UserRole } from "@/types/auth";

interface DashboardCtxValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  role: UserRole;
}

const DashboardCtx = createContext<DashboardCtxValue | null>(null);

const STORAGE_KEY = "mv_sidebar_collapsed";

export function DashboardProvider({
  children,
  role = "customer",
}: {
  children: ReactNode;
  role?: UserRole;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <DashboardCtx.Provider value={{ collapsed, toggleCollapsed, mobileOpen, setMobileOpen, role }}>
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

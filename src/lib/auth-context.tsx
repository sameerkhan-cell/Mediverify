import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, AuthSession } from "@/types/auth";
import { getStoredSession, storeSession, clearSession } from "@/services/auth";
import { useQRStore } from "@/store/qr-store";

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (session: AuthSession, persistent?: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) setSession(stored);
    setIsLoading(false);
  }, []);

  const signIn = useCallback((sess: AuthSession, persistent = false) => {
    storeSession(sess, persistent);
    setSession(sess);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: AuthSession = { ...prev, user: { ...prev.user, ...updates } };
      const persistent =
        typeof window !== "undefined" && !!localStorage.getItem("mediverify_session");
      storeSession(next, persistent);
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    useQRStore.getState().clearStore();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isLoading,
        isAuthenticated: !!session,
        signIn,
        updateUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

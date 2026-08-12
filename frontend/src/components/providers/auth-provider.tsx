"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  clearSession,
  getServerSessionSnapshot,
  getSessionSnapshot,
  setSession,
  subscribeSession,
} from "@/lib/auth-storage";
import { disconnectSocket } from "@/lib/socket";
import type { AdminUser, Session } from "@/types/auth";

interface AuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  function login(newSession: Session) {
    setSession(newSession);
  }

  function logout() {
    disconnectSocket();
    clearSession();
  }

  return (
    <AuthContext.Provider
      value={{
        admin: session?.admin ?? null,
        token: session?.token ?? null,
        isAuthenticated: session !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return context;
}

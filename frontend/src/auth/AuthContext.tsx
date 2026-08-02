import { createContext, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, logoutRequest } from "../api/client";

export interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasStoredAccessToken(): boolean {
  return Boolean(localStorage.getItem("access"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredAccessToken);
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string) => {
    const { access, refresh } = await loginRequest(username, password);
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate]);

  const value: AuthContextValue = { isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

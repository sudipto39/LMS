// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Role } from "../types";
import { tokenStore } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateToken: (token: string) => void;
  updateUser: (user: User) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount — try to restore session (check localStorage first, fall back to refresh token cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        let token = localStorage.getItem("giteaforge_token");

        // If no token in localStorage, try cookie-based silent refresh
        if (!token) {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/v1/auth/refresh-token`,
            {
              method: "POST",
              credentials: "include",
            }
          );
          if (res.ok) {
            const json = await res.json();
            token = json.accessToken as string;
            if (token) {
              localStorage.setItem("giteaforge_token", token);
            }
          }
        }

        if (!token) throw new Error("No session token found");

        // Fetch user profile with the token
        const userRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/v1/users/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const userJson = await userRes.json();
        const user = userJson.data as User;

        setState({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        localStorage.removeItem("giteaforge_token");
        // No valid session — start fresh
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    restoreSession();
  }, []);

  // Sync state.accessToken with tokenStore so Axios/Fetch API can authenticate requests
  useEffect(() => {
    tokenStore.set(state.accessToken);
  }, [state.accessToken]);

  const setAuth = useCallback((user: User, token: string) => {
    localStorage.setItem("giteaforge_token", token);
    setState({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("giteaforge_token");
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateToken = useCallback((token: string) => {
    localStorage.setItem("giteaforge_token", token);
    setState((prev) => ({ ...prev, accessToken: token }));
  }, []);

  const updateUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, setAuth, clearAuth, updateToken, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}

// ─── Role helper ──────────────────────────────────────────────────────────────

export function getRoleAsLower(role: Role): "student" | "supervisor" | "admin" {
  return role.toLowerCase() as "student" | "supervisor" | "admin";
}
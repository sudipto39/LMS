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

  // On mount — try to restore session via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Attempt silent refresh — cookie is sent automatically
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/v1/auth/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("No session");

        const json = await res.json();
        const newToken = json.accessToken as string;

        // Fetch user profile with the new token
        const userRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/v1/users/me`,
          {
            headers: { Authorization: `Bearer ${newToken}` },
            credentials: "include",
          }
        );

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const userJson = await userRes.json();
        const user = userJson.data as User;

        setState({
          user,
          accessToken: newToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
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

  const setAuth = useCallback((user: User, token: string) => {
    setState({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateToken = useCallback((token: string) => {
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
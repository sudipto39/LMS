// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Role, LoginPayload, RegisterPayload, VerifyEmailPayload } from "../types";
import { tokenStore, getErrorMessage } from "../api/client";
import { authApi } from "../api";
import env from "../config/env";

export const initialMockUsers: User[] = [];

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload, selectedRole?: Role) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ userId?: string }>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
  updateUser: (user: Partial<User>) => void;
  exploreDemo: (role: Role) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    role: "STUDENT",
  });

  // ── Session Restoration on Mount ───────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const fallbackRt = sessionStorage.getItem("giteaforge_rt");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (fallbackRt) {
          headers["X-Refresh-Token"] = fallbackRt;
        }

        // Attempt silent refresh via HTTP-only cookie or fallback token
        const res = await fetch(`${env.API_BASE_URL}/v1/auth/refresh-token`, {
          method: "POST",
          headers,
          body: fallbackRt ? JSON.stringify({ refreshToken: fallbackRt }) : JSON.stringify({}),
          credentials: "include",
        });

        if (res.ok) {
          const json = await res.json();
          const token = json.accessToken as string;
          if (json.refreshToken) {
            sessionStorage.setItem("giteaforge_rt", json.refreshToken);
          }
          if (token) {
            tokenStore.set(token);
            const userRes = await fetch(`${env.API_BASE_URL}/v1/users/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: "include",
            });
            if (userRes.ok) {
              const userJson = await userRes.json();
              const fetchedUser = userJson.data as User;
              const mappedUser: User = {
                ...fetchedUser,
                avatar:
                  fetchedUser.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    fetchedUser.name || fetchedUser.email || "User"
                  )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
                dept: fetchedUser.dept || fetchedUser.department || "CSE",
                idNo: fetchedUser.idNo || fetchedUser.universityId || "CS1001",
              };
              setState({
                user: mappedUser,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
                role: mappedUser.role || "STUDENT",
              });
              return;
            }
          }
        }
        throw new Error("No active server session");
      } catch {
        sessionStorage.removeItem("giteaforge_rt");
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          role: "STUDENT",
        });
      }
    };

    restoreSession();

    // Listen for custom logout events from API client
    const handleRemoteLogout = () => {
      tokenStore.clear();
      sessionStorage.removeItem("giteaforge_rt");
      sessionStorage.removeItem("giteaforge_demo_auth");
      sessionStorage.removeItem("giteaforge_role");
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        role: "STUDENT",
      });
    };

    window.addEventListener("auth:logout", handleRemoteLogout);
    return () => window.removeEventListener("auth:logout", handleRemoteLogout);
  }, []);

  // ── Sync in-memory tokenStore ──────────────────────────────────────────────
  useEffect(() => {
    tokenStore.set(state.accessToken);
  }, [state.accessToken]);

  // ── Login (Strict Production Mode) ──────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload, selectedRole: Role = "STUDENT") => {
      try {
        const res = await authApi.login(payload);
        if (res.accessToken) {
          tokenStore.set(res.accessToken);
          if (res.refreshToken) {
            sessionStorage.setItem("giteaforge_rt", res.refreshToken);
          }
          let userObj = res.data?.user;
          if (!userObj) {
            const meRes = await authApi.getMe();
            userObj = meRes.data;
          }
          if (userObj) {
            const mappedUser: User = {
              ...userObj,
              avatar:
                userObj.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  userObj.name || userObj.email || "User"
                )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
              dept: userObj.dept || (userObj as any).department || "CSE",
              idNo: userObj.idNo || userObj.universityId || "CS1001",
              giteaUsername:
                userObj.giteaUsername ||
                (userObj.name
                  ? userObj.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                  : undefined),
            };
            setState({
              user: mappedUser,
              accessToken: res.accessToken,
              isAuthenticated: true,
              isLoading: false,
              role: mappedUser.role || selectedRole,
            });
            return;
          }
        }
        throw new Error("Authentication failed: No token received from server");
      } catch (err: any) {
        const msg = getErrorMessage(err);
        throw new Error(msg || "Invalid email or password");
      }
    },
    []
  );

  // ── Register (Strict Production Mode) ───────────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const res = await authApi.register(payload);
      return { userId: res.data?.userId };
    } catch (err: any) {
      const msg = getErrorMessage(err);
      throw new Error(msg || "Registration failed");
    }
  }, []);

  // ── Verify Email (Strict Production Mode) ───────────────────────────────────
  const verifyEmail = useCallback(
    async (payload: VerifyEmailPayload) => {
      try {
        const res = await authApi.verifyEmail(payload);
        if (res.accessToken) {
          tokenStore.set(res.accessToken);
          const meRes = await authApi.getMe();
          const userObj = meRes.data;
          if (userObj) {
            const mappedUser: User = {
              ...userObj,
              avatar:
                userObj.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  userObj.name || userObj.email || "User"
                )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
              dept: userObj.dept || (userObj as any).department || "CSE",
              idNo: userObj.idNo || userObj.universityId || "CS1001",
            };
            setState({
              user: mappedUser,
              accessToken: res.accessToken,
              isAuthenticated: true,
              isLoading: false,
              role: mappedUser.role || "STUDENT",
            });
            return;
          }
        }
      } catch (err: any) {
        const msg = getErrorMessage(err);
        throw new Error(msg || "Verification failed");
      }
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    tokenStore.clear();
    sessionStorage.removeItem("giteaforge_rt");
    sessionStorage.removeItem("giteaforge_demo_auth");
    sessionStorage.removeItem("giteaforge_role");
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      role: "STUDENT",
    });
  }, []);

  const getFallbackDemoUser = (r: Role): User => ({
    id: `demo_${r.toLowerCase()}`,
    name:
      r === "ADMIN"
        ? "Demo Administrator"
        : r === "SUPERVISOR"
        ? "Prof. Alan Turing (Supervisor)"
        : "Alex Chen (Student)",
    email: `demo.${r.toLowerCase()}@giteaforge.local`,
    role: r,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Demo${r}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`,
    dept: "Computer Science & Engineering",
    batch: "Batch 2024–2028",
    idNo: r === "STUDENT" ? "GF-2024-DEMO" : "GF-FACULTY-01",
  });

  // ── Set Role & Explore Demo ────────────────────────────────────────────────
  const setRole = useCallback(
    (role: Role) => {
      // When authenticated, role is strictly locked to the verified user account
      if (state.isAuthenticated && state.user?.role) {
        return;
      }
      sessionStorage.setItem("giteaforge_role", role);
      const targetUser =
        users.find((u) => u.role === role) ||
        users[0] ||
        getFallbackDemoUser(role);
      setState((prev) => ({
        ...prev,
        role,
        user: targetUser,
      }));
    },
    [users, state.isAuthenticated, state.user?.role]
  );

  const exploreDemo = useCallback(
    (role: Role) => {
      sessionStorage.setItem("giteaforge_demo_auth", "true");
      sessionStorage.setItem("giteaforge_role", role);
      const targetUser =
        users.find((u) => u.role === role) ||
        users[0] ||
        getFallbackDemoUser(role);
      setState({
        user: targetUser,
        accessToken: null,
        isAuthenticated: true,
        isLoading: false,
        role,
      });
    },
    [users]
  );

  const updateUser = useCallback((updated: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updated };
      return { ...prev, user: newUser };
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === state.user?.id ? { ...u, ...updated } : u))
    );
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verifyEmail,
        logout,
        setRole,
        updateUser,
        exploreDemo,
        users,
        setUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

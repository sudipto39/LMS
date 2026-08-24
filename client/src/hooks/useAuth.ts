// /**
//  * ============================================
//  * useAuth Hook
//  * ============================================
//  * Manages authentication state.
//  * In the real app, wrap <App> with AuthProvider context.
//  * For now this hook reads from localStorage.
//  *
//  * USAGE:
//  *   const { user, login, logout, isAuthenticated } = useAuth();
//  */

// import { useState, useCallback, useEffect } from 'react';
// import authAPI, { User } from '../api/auth';
// import { getErrorMessage } from '../api/client';

// interface AuthState {
//   user: User | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
// }

// export function useAuth() {
//   const [state, setState] = useState<AuthState>({
//     user: null,
//     token: localStorage.getItem('token'),
//     isAuthenticated: false,
//     isLoading: true,
//     error: null,
//   });

//   // On mount, validate the stored token
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       // Don't validate on every page load - trust the token until it expires
//       // The server will return 401 if token is invalid, which will trigger logout
//       setState({
//         user: null, // Will be fetched lazily when needed
//         token,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });
      
//       // Optionally fetch user data in background (non-blocking)
//       authAPI.getMe()
//         .then((res) => {
//           const user = res.data.data?.user || res.data;
//           setState((prev) => ({
//             ...prev,
//             user: user as User,
//           }));
//         })
//         .catch((err) => {
//           // Only logout if token is actually invalid
//           const isAuthError = err?.response?.status === 401 || err?.response?.status === 403;
//           if (isAuthError) {
//             localStorage.removeItem('token');
//             localStorage.removeItem('refresh_token');
//             setState({
//               user: null,
//               token: null,
//               isAuthenticated: false,
//               isLoading: false,
//               error: null,
//             });
//           }
//           // For other errors, keep user logged in
//         });
//     } else {
//       setState((s) => ({ ...s, isLoading: false }));
//     }
//   }, []);

//   const login = useCallback(async (email: string, password: string) => {
//     setState((s) => ({ ...s, isLoading: true, error: null }));
//     try {
//       const res = await authAPI.login({ email, password });
//       // Handle response: { status, token, user } or { status, token, data: { user } }
//       const responseData = res.data;
//       const token = responseData.token;
//       const refreshToken = responseData.refreshToken || '';
//       const user = responseData.user || responseData.data?.user;
      
//       if (!token || !user) {
//         throw new Error('Invalid response from server');
//       }
      
//       localStorage.setItem('token', token);
//       if (refreshToken) {
//         localStorage.setItem('refresh_token', refreshToken);
//       }
      
//       setState({
//         user,
//         token,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });
//       return user;
//     } catch (err) {
//       const message = getErrorMessage(err);
//       setState((s) => ({ ...s, isLoading: false, error: message }));
//       throw new Error(message);
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     const refreshToken = localStorage.getItem('refresh_token');
//     try { 
//       await authAPI.logout(refreshToken || undefined); 
//     } catch { 
//       /* ignore logout errors */ 
//     }
//     localStorage.removeItem('token');
//     localStorage.removeItem('refresh_token');
//     setState({
//       user: null,
//       token: null,
//       isAuthenticated: false,
//       isLoading: false,
//       error: null,
//     });
//   }, []);

//   const clearError = useCallback(() => {
//     setState((s) => ({ ...s, error: null }));
//   }, []);

//   return {
//     ...state,
//     login,
//     logout,
//     clearError,
//   };
// }

// src/hooks/useAuth.ts
import { useCallback } from "react";
import { useAuthContext, getRoleAsLower } from "../context/AuthContext";
import { tokenStore } from "../api/client";
import authAPI from "../api/auth";
import { getErrorMessage } from "../api/client";
import type { Role, User } from "../types";
import type { RegisterPayload } from "../api/auth";

export function useAuth() {
  const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth, updateUser } =
    useAuthContext();

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await authAPI.login({ email, password });
      const { accessToken: token, data } = res.data;
      tokenStore.set(token);
      setAuth(data.user, token);
      return data.user;
    },
    [setAuth]
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authAPI.register(payload);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout errors
    }
    tokenStore.clear();
    localStorage.removeItem("activeProjectId");
    localStorage.removeItem("projectsUpdatedAt");
    clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      updateUser(res.data.data);
    } catch {
      // ignore
    }
  }, [updateUser]);

  // Derived role in lowercase for Sidebar compatibility
  const role = user?.role
    ? getRoleAsLower(user.role as Role)
    : "student";

  const defaultPage = () => {
    if (!user) return "landing" as const;
    if (user.role === "ADMIN") return "admin-dashboard" as const;
    if (user.role === "SUPERVISOR") return "supervisor-dashboard" as const;
    return "student-dashboard" as const;
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    role,
    defaultPage,
    login,
    register,
    logout,
    refreshUser,
    getErrorMessage,
  };
}
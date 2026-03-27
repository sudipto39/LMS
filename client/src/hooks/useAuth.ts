/**
 * ============================================
 * useAuth Hook
 * ============================================
 * Manages authentication state.
 * In the real app, wrap <App> with AuthProvider context.
 * For now this hook reads from localStorage.
 *
 * USAGE:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */

import { useState, useCallback, useEffect } from 'react';
import authAPI, { User } from '../api/auth';
import { getErrorMessage } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // On mount, validate the stored token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Don't validate on every page load - trust the token until it expires
      // The server will return 401 if token is invalid, which will trigger logout
      setState({
        user: null, // Will be fetched lazily when needed
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Optionally fetch user data in background (non-blocking)
      authAPI.getMe()
        .then((res) => {
          const user = res.data.data?.user || res.data;
          setState((prev) => ({
            ...prev,
            user: user as User,
          }));
        })
        .catch((err) => {
          // Only logout if token is actually invalid
          const isAuthError = err?.response?.status === 401 || err?.response?.status === 403;
          if (isAuthError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
          // For other errors, keep user logged in
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await authAPI.login({ email, password });
      // Handle response: { status, token, user } or { status, token, data: { user } }
      const responseData = res.data;
      const token = responseData.token;
      const refreshToken = responseData.refreshToken || '';
      const user = responseData.user || responseData.data?.user;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const message = getErrorMessage(err);
      setState((s) => ({ ...s, isLoading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try { 
      await authAPI.logout(refreshToken || undefined); 
    } catch { 
      /* ignore logout errors */ 
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    clearError,
  };
}

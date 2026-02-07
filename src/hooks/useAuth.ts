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
import authAPI, { LoginResponse } from '../api/auth';
import { getErrorMessage } from '../api/client';

interface AuthState {
  user: LoginResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('giteaforge_token'),
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // On mount, validate the stored token
  useEffect(() => {
    const token = localStorage.getItem('giteaforge_token');
    if (token) {
      authAPI.getMe()
        .then((res) => {
          setState({
            user: res.data,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        })
        .catch(() => {
          localStorage.removeItem('giteaforge_token');
          localStorage.removeItem('giteaforge_refresh_token');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await authAPI.login({ email, password });
      const { token, refreshToken, user } = res.data;
      localStorage.setItem('giteaforge_token', token);
      localStorage.setItem('giteaforge_refresh_token', refreshToken);
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
    const refreshToken = localStorage.getItem('giteaforge_refresh_token');
    if (refreshToken) {
      try { await authAPI.logout(refreshToken); } catch { /* ignore */ }
    }
    localStorage.removeItem('giteaforge_token');
    localStorage.removeItem('giteaforge_refresh_token');
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

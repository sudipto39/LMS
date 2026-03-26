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
      authAPI.getMe()
        .then((res) => {
          // Handle response: { status, data: { user } }
          const user = res.data.data?.user || res.data;
          setState({
            user: user as User,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        })
        .catch((err) => {
          // Only remove token if it's actually invalid (401/403)
          // For other errors (network, server down, etc.), keep the token
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
          } else {
            // Network error or server issue - keep token and set authenticated state
            // User can still use the app, token is likely still valid
            setState({
              user: null, // We don't have user data yet, but keep token
              token,
              isAuthenticated: true, // Trust the token until proven invalid
              isLoading: false,
              error: 'Unable to verify session. You may need to refresh.',
            });
          }
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

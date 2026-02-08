/**
 * ============================================
 * useAPI Hook — Generic data fetching hook
 * ============================================
 * Provides loading, error, data states for any API call.
 *
 * USAGE:
 *   const { data, loading, error, refetch } = useAPI(
 *     () => projectsAPI.getAll({ status: 'active' }),
 *     [dependencies]
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage } from '../api/client';
import { AxiosResponse } from 'axios';

interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAPI<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  deps: unknown[] = [],
  options?: { immediate?: boolean }
) {
  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    loading: options?.immediate !== false,
    error: null,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const response = await apiCall();
      if (isMounted.current) {
        setState({ data: response.data, loading: false, error: null });
      }
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      if (isMounted.current) {
        setState({ data: null, loading: false, error: message });
      }
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (options?.immediate !== false) {
      execute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return {
    ...state,
    refetch: execute,
    setData: (data: T) => setState((s) => ({ ...s, data })),
  };
}

/**
 * useMutation — for POST/PATCH/DELETE calls
 *
 * USAGE:
 *   const { execute, loading, error } = useMutation(
 *     (data) => projectsAPI.create(data)
 *   );
 *   await execute(formData);
 */
export function useMutation<TPayload, TResponse>(
  apiCall: (payload: TPayload) => Promise<AxiosResponse<TResponse>>
) {
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  const execute = useCallback(async (payload: TPayload): Promise<TResponse> => {
    setState({ loading: true, error: null });
    try {
      const response = await apiCall(payload);
      setState({ loading: false, error: null });
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      setState({ loading: false, error: message });
      throw new Error(message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    clearError: () => setState((s) => ({ ...s, error: null })),
  };
}

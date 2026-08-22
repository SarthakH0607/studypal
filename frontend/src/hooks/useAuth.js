/**
 * useAuth hook — Authentication convenience wrapper
 */
import { useCallback } from 'react';
import { api } from '../lib/api';
import useStore from '../store/useStore';

export function useAuth() {
  const { user, profile, isAuthenticated, authLoading, setAuth, logout } = useStore();

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setAuth(data.user, data.access_token);
    return data;
  }, [setAuth]);

  const signup = useCallback(async (email, password, fullName) => {
    const data = await api.signup(email, password, fullName);
    return data;
  }, []);

  return { user, profile, isAuthenticated, authLoading, login, signup, logout };
}

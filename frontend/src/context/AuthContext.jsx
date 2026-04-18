import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mb_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('mb_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('mb_token', data.token);
    localStorage.setItem('mb_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { data } = await authApi.register({ email, password, name });
    localStorage.setItem('mb_token', data.token);
    localStorage.setItem('mb_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    setUser(null);
  }, []);

  // Refresh user from server (e.g. after subscribe)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      localStorage.setItem('mb_user', JSON.stringify(data.user));
      // Also update token tier_status by re-login isn't feasible without password
      // We update local state which is sufficient for UI
    } catch {}
  }, []);

  const isAdmin = user?.role === 'admin';
  const isPremium = user?.tier_status === 'premium' && user?.sub_end_date && new Date(user.sub_end_date) > new Date();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

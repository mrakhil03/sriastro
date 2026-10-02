import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, setUnauthorizedHandler } from './api';

interface AuthState {
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAdminPath = useLocation().pathname.startsWith('/admin');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(isAdminPath);
  const checked = useRef(false);

  useEffect(() => {
    setUnauthorizedHandler(() => setEmail(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Customers on "/" never trigger an auth check; it runs once, the first time an /admin page is opened.
  useEffect(() => {
    if (!isAdminPath || checked.current) return;
    checked.current = true;
    setLoading(true);
    api.get('/auth/me').then((r) => setEmail(r.data.admin?.email ?? null)).catch(() => setEmail(null)).finally(() => setLoading(false));
  }, [isAdminPath]);

  const login = useCallback(async (e: string, p: string) => {
    const r = await api.post('/auth/login', { email: e, password: p });
    setEmail(r.data.admin.email);
  }, []);
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setEmail(null); }
  }, []);

  const value = useMemo(() => ({ email, loading, login, logout }), [email, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}

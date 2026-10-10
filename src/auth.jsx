// AuthContext: stores the logged-in user and exposes login / register / logout to every page
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  // On page refresh: if a token exists, ask the server who we are
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const finish = (d) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const login = async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (form) => finish(await api('/auth/register', { method: 'POST', body: form }));
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}

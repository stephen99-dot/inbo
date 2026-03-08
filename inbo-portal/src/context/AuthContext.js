import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('inbo_token');
    if (token) {
      api.get('/auth/me')
        .then(setUser)
        .catch(() => localStorage.removeItem('inbo_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('inbo_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(email, password, fullName, company, phone) {
    const data = await api.post('/auth/register', { email, password, fullName, company, phone });
    localStorage.setItem('inbo_token', data.token);
    setUser(data.user);
    // Seed demo emails
    try { await api.post('/emails/seed-demo', {}); } catch {}
    return data.user;
  }

  function logout() {
    localStorage.removeItem('inbo_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

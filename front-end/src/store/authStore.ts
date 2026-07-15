import { create } from 'zustand';
import type { User } from '../types';
import { USERS } from '../data/mockData';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('cybertrace_token'),
  isAuthenticated: false,
  loginError: null,
  isLoggingIn: false,

  login: async (username: string, password: string) => {
    set({ isLoggingIn: true, loginError: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cybertrace_token', data.token);
        localStorage.setItem('cybertrace_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true, isLoggingIn: false });
        return true;
      } else {
        const err = await res.json();
        set({ loginError: err.error || 'Invalid credentials', isLoggingIn: false });
        return false;
      }
    } catch (e) {
      // Offline fallback
      const entry = USERS[username];
      if (entry && entry.password === password) {
        const fallbackToken = `jwt.${username}.${Date.now()}`;
        localStorage.setItem('cybertrace_token', fallbackToken);
        localStorage.setItem('cybertrace_user', JSON.stringify(entry.user));
        set({ user: entry.user, token: fallbackToken, isAuthenticated: true, isLoggingIn: false });
        return true;
      } else {
        set({ loginError: 'Invalid credentials', isLoggingIn: false });
        return false;
      }
    }
  },

  logout: () => {
    // Audit logout request to backend (best-effort)
    const user = get().user;
    if (user) {
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: user.username, action: 'LOGOUT', resource: 'System', details: 'User logged out' })
      }).catch(() => {});
    }
    localStorage.removeItem('cybertrace_token');
    localStorage.removeItem('cybertrace_user');
    set({ user: null, token: null, isAuthenticated: false, loginError: null });
  },
}));

// Rehydrate from localStorage on load
const savedUser = localStorage.getItem('cybertrace_user');
const savedToken = localStorage.getItem('cybertrace_token');
if (savedUser && savedToken) {
  try {
    const user = JSON.parse(savedUser) as User;
    useAuthStore.setState({ user, token: savedToken, isAuthenticated: true });
  } catch {
    // ignore
  }
}

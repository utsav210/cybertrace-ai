import { create } from 'zustand';
import type { User } from '../types';
import { USERS } from '../data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
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
        set({ user: data.user, isAuthenticated: true, isLoggingIn: false });
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
        localStorage.setItem('cybertrace_token', `jwt.${username}.${Date.now()}`);
        localStorage.setItem('cybertrace_user', JSON.stringify(entry.user));
        set({ user: entry.user, isAuthenticated: true, isLoggingIn: false });
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
    set({ user: null, isAuthenticated: false, loginError: null });
  },
}));

// Rehydrate from localStorage on load
const savedUser = localStorage.getItem('cybertrace_user');
if (savedUser) {
  try {
    const user = JSON.parse(savedUser) as User;
    useAuthStore.setState({ user, isAuthenticated: true });
  } catch {
    // ignore
  }
}

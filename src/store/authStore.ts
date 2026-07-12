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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loginError: null,
  isLoggingIn: false,

  login: async (username: string, password: string) => {
    set({ isLoggingIn: true, loginError: null });
    await new Promise((r) => setTimeout(r, 1200));

    const entry = USERS[username];
    if (entry && entry.password === password) {
      // Simulate JWT token storage
      localStorage.setItem('cybertrace_token', `jwt.${username}.${Date.now()}`);
      localStorage.setItem('cybertrace_user', JSON.stringify(entry.user));
      set({ user: entry.user, isAuthenticated: true, isLoggingIn: false });
      return true;
    } else {
      set({ loginError: 'Invalid credentials', isLoggingIn: false });
      return false;
    }
  },

  logout: () => {
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

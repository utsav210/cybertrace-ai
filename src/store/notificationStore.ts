import { create } from 'zustand';
import type { Notification } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,

  markAsRead: (id) => {
    set((s) => {
      const updated = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    });
  },

  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (n) => {
    const newNotif: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((s) => ({
      notifications: [newNotif, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }));
  },
}));

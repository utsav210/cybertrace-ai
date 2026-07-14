import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useEffect } from 'react';
import clsx from 'clsx';

const POLL_NOTIFS = [
  { title: 'Entity Review Reminder', message: 'Case CCB/2026/0001 has 5 pending entities awaiting review.', type: 'info' as const, caseId: 'case-001' },
  { title: 'Auto-Analysis Complete', message: 'AI analysis complete for case CCB/2026/0002. New patterns found.', type: 'success' as const, caseId: 'case-002' },
];

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pollIndex, setPollIndex] = useState(0);

  // Simulate notification polling every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      if (pollIndex < POLL_NOTIFS.length) {
        addNotification(POLL_NOTIFS[pollIndex]);
        setPollIndex((i) => i + 1);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [pollIndex]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={clsx(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarOpen ? 'lg:pl-60' : 'lg:pl-16'
        )}
      >
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

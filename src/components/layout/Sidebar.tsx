import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FolderOpen, ScrollText, Settings, LogOut, Shield, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard' },
    { icon: FolderOpen, label: t('nav.cases'), to: '/cases' },
    ...(user?.role === 'admin' ? [{ icon: ScrollText, label: t('nav.audit'), to: '/admin/audit' }] : []),
    { icon: Settings, label: t('nav.settings'), to: '/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-16 bottom-0 z-40 flex flex-col transition-all duration-300',
          'lg:translate-x-0',
          open ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0 lg:w-16'
        )}
        style={{
          background: 'rgba(10,17,40,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                clsx('nav-item', isActive && 'active')
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className={clsx('transition-all duration-300', open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden lg:hidden')}>
                {item.label}
              </span>
              {open && <ChevronRight size={14} className="ml-auto opacity-30" />}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: role badge + logout */}
        <div className="p-2 border-t border-white/06">
          {open && (
            <div className="mb-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-xs font-semibold text-white/80">{user?.name}</div>
              <div className="text-xs text-amber-400 capitalize">{user?.role}</div>
              <div className="text-xs text-white/30 mt-0.5">{user?.badgeNumber}</div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="nav-item w-full text-red-400 hover:text-red-300"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className={clsx('transition-all duration-300', open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden lg:hidden')}>
              {t('nav.logout')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

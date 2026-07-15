import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FolderOpen, ScrollText, Settings, LogOut, Shield, ChevronRight,
  ShieldAlert, Users, Globe
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const navItems = user?.role === 'citizen'
    ? [
        { icon: Users, label: t('nav.portal', 'Citizen Portal'), to: '/portal' },
        { icon: Settings, label: t('nav.settings'), to: '/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard' },
        { icon: FolderOpen, label: t('nav.cases'), to: '/cases' },
        { icon: Globe, label: t('nav.osint', 'OSINT Gathering'), to: '/osint' },
        { icon: ShieldAlert, label: t('nav.analytics', 'Threat Intel'), to: '/analytics' },
        { icon: Users, label: t('nav.portal', 'Citizen Portal'), to: '/portal' },
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
          background: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(10,17,40,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: theme === 'light' ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.to}>
              <NavLink
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

              {/* Expandable OSINT sub-menu when sidebar is open */}
              {open && item.to === '/osint' && (
                <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-2">
                  {[
                    { label: 'Username OSINT', tab: 'username' },
                    { label: 'Domain / DNS', tab: 'domain' },
                    { label: 'IP / Network', tab: 'ip' },
                    { label: 'Email OSINT', tab: 'email' },
                    { label: 'Phone OSINT', tab: 'phone' },
                    { label: 'UPI ID OSINT', tab: 'upi' },
                    { label: 'Image Forensics', tab: 'image' },
                    { label: 'Audit History', tab: 'history' },
                  ].map((sub) => (
                    <NavLink
                      key={sub.tab}
                      to={`/osint`}
                      className="block py-1 px-2.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/05 transition-all"
                    >
                      • {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom: role badge + logout */}
        <div className="p-2 border-t border-white/06">
          {open && (
            <div className="mb-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-xs font-semibold text-white/80">{user?.name}</div>
              <div className="text-xs text-amber-400 capitalize font-medium">
                {user?.role === 'citizen' ? 'Citizen / Helpdesk' : user?.role === 'admin' ? 'Administrator' : 'Investigation Officer'}
              </div>
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

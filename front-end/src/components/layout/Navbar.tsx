import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Bell, ChevronDown, Globe, LogOut, User,
  CheckCheck, AlertTriangle, Info, CheckCircle, Menu, X, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', short: 'HI' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🟠', short: 'GU' },
];

export const Navbar: React.FC<{ onMenuToggle: () => void; sidebarOpen: boolean }> = ({ onMenuToggle, sidebarOpen }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [prevUnread, setPrevUnread] = useState(unreadCount);
  const [bellAnim, setBellAnim] = useState(false);

  const notifsRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (unreadCount > prevUnread) setBellAnim(true);
    setPrevUnread(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const notifIcon = (type: string) => {
    if (type === 'success') return <CheckCircle size={14} className="text-green-400" />;
    if (type === 'warning') return <AlertTriangle size={14} className="text-amber-400" />;
    return <Info size={14} className="text-blue-400" />;
  };

  const handleNotifClick = (notif: typeof notifications[0]) => {
    markAsRead(notif.id);
    setShowNotifs(false);
    if (notif.caseId) navigate(`/cases/${notif.caseId}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 gap-4"
      style={{ background: 'rgba(10,17,40,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      
      {/* Menu toggle */}
      <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-auto">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563eb)' }}>
          <Shield size={18} className="text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight">CyberTrace AI</div>
          <div className="text-xs text-white/40 leading-none">Smart Policing</div>
        </div>
      </div>

      {/* Theme Switcher */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 border border-white/10"
      >
        {theme === 'dark' ? (
          <>
            <Sun size={17} className="text-amber-400 animate-spin-slow" />
            <span className="text-xs font-semibold hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <Moon size={17} className="text-blue-500" />
            <span className="text-xs font-semibold hidden sm:inline">Dark</span>
          </>
        )}
      </button>

      {/* Language Switcher */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setShowLang(!showLang)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/08 transition-all"
        >
          <Globe size={15} />
          <span>{currentLang.flag}</span>
          <span className="font-medium">{currentLang.short}</span>
          <ChevronDown size={13} />
        </button>
        <AnimatePresence>
          {showLang && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-40 glass-modal overflow-hidden z-50"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false); }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left',
                    i18n.language === lang.code
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/70 hover:text-white hover:bg-white/08'
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifsRef}>
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
          onAnimationEnd={() => setBellAnim(false)}
        >
          <Bell size={18} className={clsx('text-white/70', bellAnim && 'badge-pulse')} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white badge-pulse"
              style={{ background: '#DC2626' }}>
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-80 glass-modal overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/08">
                <span className="text-sm font-semibold">{t('dashboard.notifications')}</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    <CheckCheck size={12} /> {t('dashboard.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-white/40">{t('dashboard.noNotifications')}</div>
                ) : notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={clsx(
                      'w-full text-left px-4 py-3 border-b border-white/05 transition-colors hover:bg-white/05',
                      !notif.read && 'bg-amber-500/05'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{notifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {notif.title}
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5 line-clamp-2">{notif.message}</div>
                        <div className="text-xs text-white/30 mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setShowUser(!showUser)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/08 transition-colors"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #F59E0B)' }}>
            {user?.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-white">{user?.name}</div>
            <div className="text-xs text-white/40">{user?.role}</div>
          </div>
          <ChevronDown size={13} className="text-white/40" />
        </button>

        <AnimatePresence>
          {showUser && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-52 glass-modal overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-white/08">
                <div className="text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-white/40">{t('dashboard.badge')}: {user?.badgeNumber}</div>
              </div>
              <button
                onClick={() => { setShowUser(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/08 transition-colors"
              >
                <User size={14} /> Profile
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} /> {t('nav.logout')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

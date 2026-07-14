import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, ChevronRight, Users, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, loginError, isLoggingIn, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [username, setUsername] = useState('officer.raj');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (loginError) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1128 0%, #1C305C 50%, #0A1128 100%)' }}>
      
      {/* Top Right Controls: Theme Toggle & Multilingual Switcher */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-full backdrop-blur-md shadow-lg">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} className="text-amber-400 animate-spin-slow" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-blue-500" />
              <span>Dark</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-white/20 mx-0.5" />

        {[
          { code: 'en', label: 'English', flag: '🇬🇧' },
          { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
          { code: 'gu', label: 'ગુજરાતી', flag: '🟠' }
        ].map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              (i18n.language || 'en') === lang.code
                ? 'bg-amber-400 text-[#0a1128] shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #1E3A8A, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`w-full max-w-md ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}
        style={{ animation: shake ? 'shake 0.5s ease' : undefined }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563eb)' }}
          >
            <Shield size={40} className="text-amber-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CyberTrace AI</h1>
          <p className="text-white/50 text-sm mt-1">{t('login.subtitle')}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/40">Secure Portal · Gujarat Cyber Crime Branch</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-modal p-8">
          {/* Error */}
          {loginError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm text-red-400"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              {t('login.error')}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="form-label">{t('login.username')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input pl-9"
                  placeholder="officer.raj"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-9 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              id="login-submit"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: isLoggingIn
                  ? 'rgba(245,158,11,0.5)'
                  : 'linear-gradient(135deg, #D97706, #F59E0B)',
                color: 'white',
                boxShadow: isLoggingIn ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('login.logging')}
                </>
              ) : (
                <>
                  {t('login.login')}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-4 border-t border-white/08">
            <p className="text-xs text-white/30 text-center">
              💡 {t('login.demoHint')}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                type="button"
                onClick={() => { setUsername('citizen.desai'); setPassword('citizen123'); }}
                className="text-xs py-2 px-1 rounded-lg text-emerald-400/80 hover:text-emerald-300 font-medium transition-colors text-center border border-emerald-500/20"
                style={{ background: 'rgba(16,185,129,0.08)' }}
              >
                👤 Citizen Login
              </button>
              <button
                type="button"
                onClick={() => { setUsername('officer.raj'); setPassword('password123'); }}
                className="text-xs py-2 px-1 rounded-lg text-amber-400/80 hover:text-amber-300 font-medium transition-colors text-center border border-amber-500/20"
                style={{ background: 'rgba(245,158,11,0.08)' }}
              >
                🛡️ Officer Login
              </button>
              <button
                type="button"
                onClick={() => { setUsername('admin.sharma'); setPassword('admin123'); }}
                className="text-xs py-2 px-1 rounded-lg text-blue-400/80 hover:text-blue-300 font-medium transition-colors text-center border border-blue-500/20"
                style={{ background: 'rgba(59,130,246,0.08)' }}
              >
                ⚙️ Admin Login
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/06">
              <button
                type="button"
                onClick={() => navigate('/citizen-portal')}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center justify-center gap-2 border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15"
              >
                <Users size={15} />
                Public & Citizen Walk-in Helpdesk (Report / Track NCRP)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          © 2026 Gujarat Cyber Crime Branch · CyberTrace AI v2.0
        </p>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

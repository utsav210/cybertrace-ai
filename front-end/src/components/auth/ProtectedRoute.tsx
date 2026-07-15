import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Lock, Users, LayoutDashboard, ScrollText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Defensive Check 1: Must be authenticated and have a valid user object
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Defensive Check 2: Role Authorization Gate
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const handleReturnHome = () => {
      if (user.role === 'citizen') {
        navigate('/citizen-portal', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/audit', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    };

    const getRoleTitle = (role: UserRole) => {
      if (role === 'citizen') return t('login.citizenLogin', 'Citizen / Public Helpdesk');
      if (role === 'admin') return t('login.adminLogin', 'System Administrator');
      return t('login.officerLogin', 'Investigation Officer');
    };

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card max-w-lg w-full p-8 text-center relative overflow-hidden border border-red-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)' }}
        >
          {/* Top Security Banner */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 mb-6 border border-red-500/40 shadow-lg">
            <ShieldAlert size={36} className="animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
              HTTP 403 · Security Restriction
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {t('rbac.accessDenied', 'Access Denied · Unauthorized Route')}
          </h2>

          <p className="text-sm text-white/70 leading-relaxed mb-6">
            {t(
              'rbac.unauthorizedDesc',
              'Your active security clearance does not permit access to this specific law enforcement or administrative workspace.'
            )}
          </p>

          {/* User Role Clearance Info */}
          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10 text-left">
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">
              Active Security Profile
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{user.name} ({user.username})</div>
                <div className="text-xs text-amber-400 mt-0.5 font-medium">{getRoleTitle(user.role)}</div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/05 border border-white/10 text-xs font-mono text-white/60">
                {user.badgeNumber}
              </div>
            </div>
          </div>

          {/* Return Action */}
          <button
            onClick={handleReturnHome}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A, #2563eb)',
              color: 'white',
            }}
          >
            <ArrowLeft size={16} />
            {t('rbac.returnHome', 'Return to Authorized Workspace')}
          </button>

          <p className="text-[11px] text-white/30 mt-4">
            Security Incident Logged · Gujarat Cyber Crime Branch System Audit
          </p>
        </motion.div>
      </div>
    );
  }

  // If all validation passes, render authorized route
  return <>{children}</>;
};

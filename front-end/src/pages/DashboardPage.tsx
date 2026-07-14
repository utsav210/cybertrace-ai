import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, FolderOpen, Activity, CheckCircle, AlertTriangle,
  ArrowRight, Calendar, Banknote, X, User, Phone, FileText
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCaseStore } from '../store/caseStore';
import { useNotificationStore } from '../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Case } from '../types';
import clsx from 'clsx';

// ─── Animated Counter ──────────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: number; duration?: number }> = ({ target, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count}</span>;
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Case['status'] }> = ({ status }) => {
  const { t } = useTranslation();
  const map = {
    open: { cls: 'badge-open', label: t('case.open') },
    active: { cls: 'badge-active', label: t('case.active') },
    closed: { cls: 'badge-closed', label: t('case.closed') },
  };
  const { cls, label } = map[status];
  return <span className={cls}>{label}</span>;
};

// ─── Create Case Modal ─────────────────────────────────────────────────────────
const CreateCaseModal: React.FC<{ onClose: () => void; onCreated: (c: Case) => void }> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const { addCase, cases } = useCaseStore();
  const [form, setForm] = useState({ title: '', description: '', complainant: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 1000));
    const newCase = await addCase({
      title: form.title,
      description: form.description,
      complainant: form.complainant || 'Unknown',
      complainantPhone: form.phone || '',
      status: 'open',
      assignedTo: 'officer.raj',
    });
    setCreating(false);
    onCreated(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-modal w-full max-w-lg relative z-10 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">{t('modal.createCase')}</h2>
            <p className="text-xs text-white/40 mt-0.5">Next case: CCB/2026/00{String(cases.length + 1).padStart(2, '0')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="form-label">{t('modal.caseTitle')} *</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-input pl-8"
                placeholder="e.g. UPI Fraud via Phishing Link"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">{t('modal.caseDescription')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input resize-none h-24"
              placeholder="Describe the case..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{t('modal.complainantName')}</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={form.complainant}
                  onChange={(e) => setForm({ ...form, complainant: e.target.value })}
                  className="form-input pl-8"
                  placeholder="Vikram Desai"
                />
              </div>
            </div>
            <div>
              <label className="form-label">{t('modal.complainantPhone')}</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="form-input pl-8"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/08 transition-all border border-white/10">
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={creating || !form.title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563eb)', color: 'white' }}
            >
              {creating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('modal.creating')}</>
              ) : (
                <>{t('modal.create')}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { cases, initializeCases } = useCaseStore();
  const { initializeNotifications } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeCases();
    initializeNotifications();
  }, [initializeCases, initializeNotifications]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recentCreated, setRecentCreated] = useState<Case | null>(null);

  const openCases = cases.filter((c) => c.status === 'open').length;
  const activeCases = cases.filter((c) => c.status === 'active').length;
  const closedCases = cases.filter((c) => c.status === 'closed').length;

  const stats = [
    {
      label: t('dashboard.openCases'),
      value: openCases,
      icon: FolderOpen,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)',
    },
    {
      label: t('dashboard.activeInvestigations'),
      value: activeCases,
      icon: Activity,
      color: '#60a5fa',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
    },
    {
      label: t('dashboard.closedCases'),
      value: closedCases,
      icon: CheckCircle,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
    },
  ];

  const formatAmount = (amount?: number) => {
    if (!amount) return '–';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t('dashboard.welcome')} <span className="text-amber-400">Inspector {user?.name}</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-white/40">{t('dashboard.badge')}: {user?.badgeNumber}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          id="new-case-btn"
          onClick={() => setShowCreateModal(true)}
          className="btn-accent"
        >
          <Plus size={16} />
          {t('dashboard.newCase')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {stat.label}
                </p>
                <p className="text-4xl font-bold mt-2 text-white">
                  <AnimatedCounter target={stat.value} duration={1200 + i * 200} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <AlertTriangle size={11} />
              <span>{t('dashboard.asOf', 'As of')} {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Created Case Banner */}
      <AnimatePresence>
        {recentCreated && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            <div className="flex-1 text-sm text-green-300">
              Case <strong>{recentCreated.caseNumber}</strong> – "{recentCreated.title}" {t('dashboard.createdSuccess', 'created successfully!')}
            </div>
            <button
              onClick={() => navigate(`/cases/${recentCreated.id}`)}
              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
            >
              {t('portal.viewCase', 'View Case')} <ArrowRight size={12} />
            </button>
            <button onClick={() => setRecentCreated(null)} className="p-1 hover:bg-white/10 rounded transition-colors">
              <X size={14} className="text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Cases Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t('dashboard.recentCases')}</h2>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            {t('dashboard.viewAll', 'View All')} <ArrowRight size={12} />
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('case.caseNumber')}</th>
                  <th>{t('case.title')}</th>
                  <th>{t('case.complainant')}</th>
                  <th>{t('case.status')}</th>
                  <th>{t('case.amountLost')}</th>
                  <th>{t('case.createdAt')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 6).map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <td>
                      <span className="font-mono text-xs text-amber-400">{c.caseNumber}</span>
                    </td>
                    <td>
                      <span className="font-medium">{c.title}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-white/60">
                        <User size={12} />
                        {c.complainant}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      {c.amountLost ? (
                        <div className="flex items-center gap-1 text-red-400 font-medium text-sm">
                          <Banknote size={13} />
                          {formatAmount(c.amountLost)}
                        </div>
                      ) : '–'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Calendar size={11} />
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Case Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCaseModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(c) => setRecentCreated(c)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

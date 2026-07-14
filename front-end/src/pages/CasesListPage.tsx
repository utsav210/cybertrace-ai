import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen, ArrowRight, Banknote, User, Calendar, Plus
} from 'lucide-react';
import { useCaseStore } from '../store/caseStore';
import { useThemeStore } from '../store/themeStore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  active: 'badge-active',
  closed: 'badge-closed',
};

export const CasesListPage: React.FC = () => {
  const { t } = useTranslation();
  const { cases, initializeCases } = useCaseStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeCases();
  }, [initializeCases]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'active' | 'closed'>('all');

  const filtered = statusFilter === 'all' ? cases : cases.filter((c) => c.status === statusFilter);

  const formatAmount = (amount?: number) =>
    amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount) : null;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen size={22} className="text-amber-400" />
            {t('nav.cases')}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">{cases.length} {t('case.casesInDb', 'cases in database')}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'active', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border capitalize shadow-sm"
            style={{
              background: statusFilter === s
                ? (theme === 'light' ? '#FEF3C7' : 'rgba(245,158,11,0.12)')
                : (theme === 'light' ? '#FFFFFF' : 'transparent'),
              borderColor: statusFilter === s
                ? (theme === 'light' ? '#D97706' : 'rgba(245,158,11,0.4)')
                : (theme === 'light' ? '#CBD5E1' : 'rgba(255,255,255,0.1)'),
              color: statusFilter === s
                ? (theme === 'light' ? '#B45309' : '#F59E0B')
                : (theme === 'light' ? '#475569' : 'rgba(255,255,255,0.4)'),
            }}
          >
            {s === 'all' ? t('case.allCases', 'All Cases') : t(`case.${s}`)} {s !== 'all' && `(${cases.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="glass-card p-4 cursor-pointer group hover:border-amber-400/20 transition-all duration-200"
              style={{ border: theme === 'light' ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs text-amber-400 font-semibold">{c.caseNumber}</span>
                <span className={STATUS_BADGE[c.status]}>{t(`case.${c.status}`)}</span>
              </div>
              <h3 className="font-bold text-white text-sm mb-2 group-hover:text-amber-100 transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-white/40 line-clamp-2 mb-3">{c.description}</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <User size={11} /> {c.complainant}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <Calendar size={11} /> {new Date(c.createdAt).toLocaleDateString('en-IN')}
                </div>
                {c.amountLost && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <Banknote size={11} /> {formatAmount(c.amountLost)}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-white/06 flex items-center justify-end">
                <span className="text-xs text-white/30 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                  {t('portal.viewCase', 'View Case')} <ArrowRight size={11} />
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

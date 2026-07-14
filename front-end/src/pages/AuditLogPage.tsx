import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ScrollText, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AUDIT_LOGS } from '../data/mockData';
import { motion } from 'framer-motion';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'rgba(59,130,246,0.2)',
  LOGOUT: 'rgba(148,163,184,0.1)',
  CASE_CREATED: 'rgba(16,185,129,0.2)',
  CASE_UPDATED: 'rgba(245,158,11,0.2)',
  EVIDENCE_UPLOADED: 'rgba(139,92,246,0.2)',
  ENTITY_ACCEPTED: 'rgba(16,185,129,0.15)',
  ENTITY_REJECTED: 'rgba(220,38,38,0.15)',
  REPORT_GENERATED: 'rgba(6,182,212,0.2)',
  FIR_DRAFTED: 'rgba(251,146,60,0.2)',
  TRANSACTION_IMPORTED: 'rgba(52,211,153,0.2)',
};

const ACTION_TEXT_COLORS: Record<string, string> = {
  LOGIN: '#60a5fa',
  LOGOUT: '#94a3b8',
  CASE_CREATED: '#10B981',
  CASE_UPDATED: '#F59E0B',
  EVIDENCE_UPLOADED: '#a78bfa',
  ENTITY_ACCEPTED: '#34d399',
  ENTITY_REJECTED: '#f87171',
  REPORT_GENERATED: '#22d3ee',
  FIR_DRAFTED: '#fb923c',
  TRANSACTION_IMPORTED: '#6ee7b7',
};

const PAGE_SIZE = 8;

export const AuditLogPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [actorFilter, setActorFilter] = useState('all');

  // Admin only
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield size={48} className="text-red-400/50" />
        <p className="text-white/60 text-lg font-semibold">Access Denied</p>
        <p className="text-white/30 text-sm">Audit logs are only accessible to Administrators.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">← Back to Dashboard</button>
      </div>
    );
  }

  const actors = ['all', ...new Set(AUDIT_LOGS.map((l) => l.actor))];
  const filtered = actorFilter === 'all' ? AUDIT_LOGS : AUDIT_LOGS.filter((l) => l.actor === actorFilter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText size={20} className="text-amber-400" />
            {t('audit.title')}
          </h1>
          <p className="text-xs text-white/30 mt-0.5">Showing all system events · {AUDIT_LOGS.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40">Filter by Actor:</span>
        <div className="flex gap-2 flex-wrap">
          {actors.map((actor) => (
            <button
              key={actor}
              onClick={() => { setActorFilter(actor); setPage(1); }}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
              style={{
                background: actorFilter === actor ? 'rgba(245,158,11,0.1)' : 'transparent',
                borderColor: actorFilter === actor ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)',
                color: actorFilter === actor ? '#F59E0B' : 'rgba(255,255,255,0.4)',
              }}
            >
              {actor}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('audit.timestamp')}</th>
                <th>{t('audit.actor')}</th>
                <th>{t('audit.action')}</th>
                <th>{t('audit.resource')}</th>
                <th>{t('audit.ipAddress')}</th>
                <th>{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td>
                    <span className="font-mono text-xs text-white/50">{log.timestamp}</span>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-blue-300">{log.actor}</span>
                  </td>
                  <td>
                    <span
                      className="text-xs font-mono font-semibold px-2 py-1 rounded-md"
                      style={{
                        background: ACTION_COLORS[log.action] || 'rgba(255,255,255,0.05)',
                        color: ACTION_TEXT_COLORS[log.action] || 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-white/65">{log.resource}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-white/40">{log.ipAddress}</span>
                  </td>
                  <td>
                    <span className="text-xs text-white/40">{log.details || '–'}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/08">
          <span className="text-xs text-white/30">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: page === i + 1 ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: page === i + 1 ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                  border: page === i + 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

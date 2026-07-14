import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, FolderOpen, ChevronRight, FileText, Users, BarChart2,
  GitBranch, AlertTriangle, FileOutput, Banknote, User, Calendar
} from 'lucide-react';
import { useCaseStore } from '../store/caseStore';
import { EvidenceTab } from '../components/case/EvidenceTab';
import { EntitiesTab } from '../components/case/EntitiesTab';
import { TransactionsTab } from '../components/case/TransactionsTab';
import { MoneyTrailTab } from '../components/case/MoneyTrailTab';
import { FraudFindingsTab } from '../components/case/FraudFindingsTab';
import { ReportTab } from '../components/case/ReportTab';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  active: 'badge-active',
  closed: 'badge-closed',
};

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cases, entities, fraudAlerts } = useCaseStore();

  const [activeTab, setActiveTab] = useState(0);

  const case_ = cases.find((c) => c.id === id);
  if (!case_) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FolderOpen size={48} className="text-white/20" />
        <p className="text-white/40">Case not found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">← Back to Dashboard</button>
      </div>
    );
  }

  const acceptedEntities = entities.filter((e) => e.caseId === id && e.status === 'accepted').length;
  const pendingAlerts = fraudAlerts.filter((a) => a.caseId === id && a.status === 'pending').length;

  const tabs = [
    { label: t('tabs.evidence'), icon: FileText, id: 'evidence-tab' },
    { label: t('tabs.entities'), icon: Users, badge: acceptedEntities || undefined, id: 'entities-tab' },
    { label: t('tabs.transactions'), icon: BarChart2, id: 'transactions-tab' },
    { label: t('tabs.moneyTrail'), icon: GitBranch, id: 'money-trail-tab' },
    { label: t('tabs.fraudFindings'), icon: AlertTriangle, badge: pendingAlerts || undefined, badgeColor: 'red', id: 'fraud-tab' },
    { label: t('tabs.report'), icon: FileOutput, id: 'report-tab' },
  ];

  const formatAmount = (amount?: number) =>
    amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount) : undefined;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <ChevronRight size={13} />
        <button onClick={() => navigate('/cases')} className="hover:text-white transition-colors">Cases</button>
        <ChevronRight size={13} />
        <span className="text-amber-400 font-mono">{case_.caseNumber}</span>
      </div>

      {/* Case Header */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-amber-400 font-semibold">{case_.caseNumber}</span>
              <span className={STATUS_BADGE[case_.status]}>{case_.status}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{case_.title}</h1>
            <p className="text-sm text-white/50 mt-1 max-w-xl">{case_.description}</p>
          </div>

          {case_.amountLost && (
            <div className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <Banknote size={16} className="text-red-400" />
              <div>
                <div className="text-xs text-white/40">Amount Lost</div>
                <div className="font-bold text-red-400">{formatAmount(case_.amountLost)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/08">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <User size={12} />
            <span className="font-medium">{case_.complainant}</span>
            <span className="text-white/30">· {case_.complainantPhone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Calendar size={12} />
            {new Date(case_.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-white/08">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              id={tab.id}
              onClick={() => setActiveTab(i)}
              className={clsx('tab-btn', activeTab === i && 'active')}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: tab.badgeColor === 'red' ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.2)',
                    color: tab.badgeColor === 'red' ? '#DC2626' : '#10B981',
                    border: `1px solid ${tab.badgeColor === 'red' ? 'rgba(220,38,38,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 0 && <EvidenceTab caseId={case_.id} />}
              {activeTab === 1 && <EntitiesTab caseId={case_.id} />}
              {activeTab === 2 && <TransactionsTab caseId={case_.id} />}
              {activeTab === 3 && <MoneyTrailTab />}
              {activeTab === 4 && <FraudFindingsTab caseId={case_.id} />}
              {activeTab === 5 && <ReportTab case_={case_} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

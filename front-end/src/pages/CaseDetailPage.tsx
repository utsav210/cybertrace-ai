import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, FolderOpen, ChevronRight, FileText, Users, BarChart2,
  GitBranch, AlertTriangle, FileOutput, Banknote, User, Calendar,
  Landmark, Shield, Globe, MapPin, CreditCard, Hash
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
  const { cases, evidence, entities, fraudAlerts, loadCaseDetails, initializeCases } = useCaseStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      setLoading(true);
      Promise.all([initializeCases(), loadCaseDetails(id)]).finally(() => {
        if (isMounted) setLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, [id, loadCaseDetails, initializeCases]);

  const case_ = cases.find((c) => c.id === id);

  if (!case_) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in space-y-3">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-base font-bold text-white/80">Synchronizing Case Records...</h3>
          <p className="text-xs text-white/50">Fetching live investigation attributes from the central database and NCRP node.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <FolderOpen size={48} className="text-white/20 mb-3" />
        <h3 className="text-lg font-bold text-white/70">{t('case.caseNotFound', 'Case not found')}</h3>
        <p className="text-xs text-white/40 mt-1 mb-4">{t('case.maybeDeleted', 'The case you are looking for does not exist or has been deleted.')}</p>
        <button onClick={() => navigate('/cases')} className="btn-secondary text-xs">
          <ArrowLeft size={14} /> {t('portal.backToPortal', 'Back to Cases')}
        </button>
      </div>
    );
  }

  const evidenceCount = evidence.filter((e) => e.caseId === id).length;
  const acceptedEntities = entities.filter((e) => e.caseId === id && e.status === 'accepted').length;
  const pendingAlerts = fraudAlerts.filter((a) => a.caseId === id && a.status === 'pending').length;

  const formatAmount = (amount?: number) =>
    amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount) : null;

  const tabs = [
    { label: t('tabs.evidence', 'Evidence & OCR'), icon: FileText, badge: evidenceCount || undefined, id: 'evidence-tab' },
    { label: t('tabs.entities', 'AI Entities Graph'), icon: Users, badge: acceptedEntities || undefined, id: 'entities-tab' },
    { label: t('tabs.transactions', 'UPI Transactions'), icon: BarChart2, id: 'transactions-tab' },
    { label: t('tabs.moneyTrail', 'Money Trail Path'), icon: GitBranch, id: 'money-trail-tab' },
    { label: t('tabs.fraudFindings', 'Fraud Engine Findings'), icon: AlertTriangle, badge: pendingAlerts || 3, badgeColor: 'red', id: 'fraud-tab' },
    { label: t('tabs.report', 'Generate FIR / Report'), icon: FileOutput, id: 'report-tab' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <button onClick={() => navigate('/cases')} className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={12} /> {t('nav.cases', 'Cases')}
        </button>
        <ChevronRight size={12} />
        <span className="text-white/80 font-mono">{case_.caseNumber}</span>
      </div>

      {/* Case Header Card */}
      <div className="glass-card p-6 border-l-4 border-amber-400">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-amber-400 font-semibold">{case_.caseNumber}</span>
              <span className={STATUS_BADGE[case_.status] || 'badge-open'}>{case_.status}</span>
              {case_.category && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {case_.category}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{case_.title}</h1>
            <p className="text-sm text-white/60 mt-1 max-w-2xl leading-relaxed">{case_.description}</p>
          </div>

          {case_.amountLost !== undefined && case_.amountLost > 0 && (
            <div className="px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm flex-shrink-0"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)' }}>
              <Banknote size={20} className="text-red-400" />
              <div>
                <div className="text-[11px] text-white/50 uppercase font-bold tracking-wider">Total Loss Reported</div>
                <div className="text-lg font-extrabold text-red-400 font-mono">{formatAmount(case_.amountLost)}</div>
              </div>
            </div>
          )}
        </div>

        {/* NCRP / 1930 I4C Profile Summary Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <User size={14} className="text-amber-400 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-white/40 uppercase">Complainant</div>
              <div className="font-semibold text-white truncate">{case_.complainant}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Globe size={14} className="text-blue-400 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-white/40 uppercase">Platform / Medium</div>
              <div className="font-semibold text-white truncate">{case_.platform || 'General Intake'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin size={14} className="text-green-400 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-white/40 uppercase">Jurisdiction / State</div>
              <div className="font-semibold text-white truncate">{case_.state ? `${case_.district ? `${case_.district}, ` : ''}${case_.state}` : 'Gujarat'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <CreditCard size={14} className="text-purple-400 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-white/40 uppercase">1930 Banking UTR / Acc</div>
              <div className="font-semibold font-mono text-white truncate">{case_.utrNumber || case_.bankAccount || 'Under Investigation'}</div>
            </div>
          </div>
        </div>

        {case_.suspectDetails && (
          <div className="mt-3.5 pt-3.5 border-t border-white/10 flex items-start gap-2.5 text-xs text-amber-200/80 bg-amber-500/05 p-3 rounded-xl border border-amber-500/20">
            <Shield size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-400">Captured Suspect IOCs (Phase 1 AI Indexing): </span>
              <span className="font-mono text-[11px] whitespace-pre-wrap">{case_.suspectDetails}</span>
            </div>
          </div>
        )}
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

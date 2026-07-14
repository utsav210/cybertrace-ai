import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import type { FraudAlert } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Props { caseId: string }

const SeverityBadge: React.FC<{ severity: FraudAlert['severity'] }> = ({ severity }) => {
  const map = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-open',
  };
  return <span className={map[severity]}>{severity.toUpperCase()}</span>;
};

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const { t } = useTranslation();
  const color = score >= 75 ? '#DC2626' : score >= 50 ? '#F59E0B' : '#10B981';
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle
          cx="35" cy="35" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference / 4}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        <text x="35" y="35" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-xs text-white/40">{t('fraudFindings.riskScore', 'Risk Score')}</span>
    </div>
  );
};

export const FraudFindingsTab: React.FC<Props> = ({ caseId }) => {
  const { t } = useTranslation();
  const { fraudAlerts, acceptFraudAlert, rejectFraudAlert } = useCaseStore();
  const caseAlerts = fraudAlerts.filter((a) => a.caseId === caseId);

  const alertIcon = (type: string) => {
    if (type.includes('Mule')) return <AlertTriangle size={18} className="text-red-400" />;
    if (type.includes('Circular')) return <Activity size={18} className="text-orange-400" />;
    return <Shield size={18} className="text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="stat-card px-4 py-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <div>
            <div className="text-xs text-white/40">{t('fraudFindings.totalAlerts', 'Total Alerts')}</div>
            <div className="text-sm font-bold text-white">{caseAlerts.length}</div>
          </div>
        </div>
        <div className="stat-card px-4 py-2 flex items-center gap-2">
          <Check size={14} className="text-green-400" />
          <div>
            <div className="text-xs text-white/40">{t('fraudFindings.acceptedCount', 'Accepted')}</div>
            <div className="text-sm font-bold text-green-400">{caseAlerts.filter(a => a.status === 'accepted').length}</div>
          </div>
        </div>
        <div className="stat-card px-4 py-2 flex items-center gap-2">
          <X size={14} className="text-red-400" />
          <div>
            <div className="text-xs text-white/40">{t('fraudFindings.falsePositives', 'False Positives')}</div>
            <div className="text-sm font-bold text-red-400">{caseAlerts.filter(a => a.status === 'rejected').length}</div>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {caseAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={clsx(
                'p-5 rounded-2xl border transition-all duration-300',
                alert.status === 'accepted' && 'border-green-500/40 bg-green-500/5',
                alert.status === 'rejected' && 'border-white/08 bg-white/02 opacity-50',
                alert.status === 'pending' && 'border-white/10 bg-white/03',
              )}
              style={
                alert.status === 'accepted'
                  ? { boxShadow: '0 0 20px rgba(16,185,129,0.1)' }
                  : alert.status === 'pending'
                  ? { boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }
                  : {}
              }
            >
              <div className="flex gap-4">
                {/* Risk Gauge */}
                <div className="flex-shrink-0">
                  <RiskGauge score={alert.riskScore} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {alertIcon(alert.type)}
                      <h3 className="font-bold text-white">{alert.type}</h3>
                      <SeverityBadge severity={alert.severity} />
                      {alert.status === 'accepted' && (
                        <span className="flex items-center gap-1 text-xs text-green-400 px-2 py-0.5 rounded-full border border-green-400/30"
                          style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <Check size={10} /> {t('fraudFindings.accepted')}
                        </span>
                      )}
                      {alert.status === 'rejected' && (
                        <span className="flex items-center gap-1 text-xs text-white/40 px-2 py-0.5 rounded-full border border-white/10"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <X size={10} /> {t('fraudFindings.rejected')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/65 mb-3 leading-relaxed">{alert.description}</p>

                  {/* Involved Entities */}
                  <div className="mb-3">
                    <span className="text-xs text-white/40 mr-2">{t('fraudFindings.involvedEntities')}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {alert.involvedEntities.map((e) => (
                        <span key={e} className="text-xs font-mono px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Confidence */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs text-white/40">{t('fraudFindings.aiConfidence')}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 risk-bar-wrapper">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${alert.aiConfidence * 100}%`,
                            background: `linear-gradient(90deg, #60a5fa, #3b82f6)`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-blue-400">{(alert.aiConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {alert.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptFraudAlert(alert.id)}
                        className="btn-success flex items-center gap-1.5"
                      >
                        <Check size={13} /> {t('fraudFindings.acceptFinding')}
                      </button>
                      <button
                        onClick={() => rejectFraudAlert(alert.id)}
                        className="btn-danger flex items-center gap-1.5"
                      >
                        <X size={13} /> {t('fraudFindings.rejectFinding')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

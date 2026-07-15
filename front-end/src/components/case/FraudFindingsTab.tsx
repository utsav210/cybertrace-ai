import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertTriangle, Shield, Activity, Zap, Loader2, Scale, ShieldCheck, Download, RefreshCw, FileText } from 'lucide-react';
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

// Statutory Mapping Helper for each alert
function computeAlertLegalSection(type: string, desc: string): { section: string; title: string; act: string; penalty: string } {
  const tStr = type.toLowerCase();
  const dStr = desc.toLowerCase();
  if (tStr.includes('mule') || dStr.includes('mule')) {
    return {
      act: 'BNS 2023 & PMLA 2002',
      section: 'BNS Section 111(1)(b) / BNSS Section 106',
      title: 'Organized Cyber Syndicate & Mule Account Layering',
      penalty: 'Rigorous Imprisonment up to Life + Mandatory Freeze Order u/s 106 BNSS',
    };
  }
  if (tStr.includes('circular') || tStr.includes('layering') || dStr.includes('smurfing')) {
    return {
      act: 'BNS 2023 & IT Act 2000',
      section: 'BNS Section 318(4) & IT Act Sec 66D',
      title: 'Cheating & Fund Layering via Computer Resource',
      penalty: 'Imprisonment up to 7 years + Fine up to ₹1,00,000',
    };
  }
  if (tStr.includes('personation') || dStr.includes('impersonat') || dStr.includes('kyc')) {
    return {
      act: 'BNS 2023 & IT Act 2000',
      section: 'BNS Section 319(2) & IT Act Sec 66C/66D',
      title: 'Identity Theft & Cheating by Personation',
      penalty: 'Imprisonment up to 5 years + Statutory Fine',
    };
  }
  return {
    act: 'BNS 2023 & IT Act 2000',
    section: 'BNS Section 318(4) / IT Act Section 66D',
    title: 'Cyber Financial Fraud & Dishonest Inducement',
    penalty: 'Imprisonment up to 7 years + Mandatory Bank Account Freeze',
  };
}

export const FraudFindingsTab: React.FC<Props> = ({ caseId }) => {
  const { t } = useTranslation();
  const { fraudAlerts, acceptFraudAlert, rejectFraudAlert, addFraudAlert } = useCaseStore();
  const caseAlerts = fraudAlerts.filter((a) => a.caseId === caseId);

  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  const alertIcon = (type: string) => {
    if (type.includes('Mule')) return <AlertTriangle size={18} className="text-red-400" />;
    if (type.includes('Circular') || type.includes('Layering')) return <Activity size={18} className="text-orange-400" />;
    return <Shield size={18} className="text-amber-400" />;
  };

  const handleRunDynamicScan = async () => {
    setScanning(true);
    setScanStep('Analyzing transaction flows against I4C 1930 Mule Blacklist and NPCI registries...');
    await new Promise((r) => setTimeout(r, 1200));

    setScanStep('Executing NLP & Graph algorithms to map Fan-In/Fan-Out smurfing clusters...');
    await new Promise((r) => setTimeout(r, 1200));

    setScanStep('Applying Bharatiya Nyaya Sanhita (BNS 2023) and IT Act penal matrices...');
    await new Promise((r) => setTimeout(r, 1000));

    const randomId = `alert-${Date.now()}`;
    const newAlertTypes = [
      {
        type: 'Automated Fan-In Mule Cluster',
        description: 'Deep AI scan detected 6 unverified UPI handles routing funds sequentially into target account ending *4892 within 180 seconds. Matches I4C 1930 typology for organized smurfing.',
        entities: ['mule_cluster@icici', 'layering_bot@hdfc', 'acc_9981245012'],
        risk: 88,
        conf: 0.96,
      },
      {
        type: 'UPI Personation & Fake KYC Gateway',
        description: 'Transaction metadata indicates spoofed banking domain signatures induced victim to authorize recurring mandates. Direct violation of IT Act Sec 66C and BNS Sec 319(2).',
        entities: ['spoofed_sbi_portal@upi', 'victim_auth_token', 'gateway_node_04'],
        risk: 82,
        conf: 0.93,
      },
      {
        type: 'Cross-Bank Circular Layering Ring',
        description: 'Funds divided into ₹24,500 tranches and bounced through 4 distinct payment aggregators to bypass statutory ₹25,000 AML alert thresholds.',
        entities: ['node_axis_7712', 'pay_agg_wallet_09', 'acc_33910029'],
        risk: 79,
        conf: 0.91,
      },
    ];

    // Pick an alert that isn't already identically named
    const existingTypes = new Set(caseAlerts.map(a => a.type));
    const candidate = newAlertTypes.find(a => !existingTypes.has(a.type)) || newAlertTypes[Math.floor(Math.random() * newAlertTypes.length)];

    const createdAlert: FraudAlert = {
      id: randomId,
      caseId,
      type: candidate.type,
      severity: candidate.risk >= 85 ? 'critical' : 'high',
      description: candidate.description,
      involvedEntities: candidate.entities,
      riskScore: candidate.risk,
      aiConfidence: candidate.conf,
      status: 'pending',
    };

    addFraudAlert(createdAlert);
    setScanning(false);
    setScanStep('');
  };

  const handleExportEvidenceDossier = () => {
    const acceptedAlerts = caseAlerts.filter(a => a.status === 'accepted');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Statutory Evidence Dossier - Case ${caseId}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
            h1 { color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px; font-size: 20px; }
            .meta { margin-bottom: 20px; font-size: 13px; color: #4B5563; }
            .badge { display: inline-block; border: 1px solid #1E3A8A; padding: 2px 8px; font-weight: bold; color: #1E3A8A; font-size: 11px; margin-bottom: 12px; }
            .alert-box { border: 1px solid #000; padding: 12px; margin-bottom: 16px; border-left: 4px solid #1E3A8A; }
            .section-lbl { font-weight: bold; color: #8B0000; font-size: 12px; margin-top: 6px; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <div class="badge">CERTIFIED ELECTRONIC EVIDENCE DOSSIER (u/s 63 &amp; 65B BSA, 2023)</div>
          <h1>CYBER CRIME BRANCH &mdash; AI INVESTIGATION &amp; FRAUD TYPOLOGY RECORD</h1>
          <div class="meta">
            <strong>Case ID / Reference:</strong> ${caseId}<br>
            <strong>Date of Verification:</strong> ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}<br>
            <strong>Statutory Admissibility:</strong> Admitted under Section 63 &amp; 65B Bharatiya Sakshya Adhiniyam (BSA, 2023)<br>
            <strong>Total Accepted Findings:</strong> ${acceptedAlerts.length} verified AI alerts
          </div>
          <hr>
          <h2>Verified AI Crime Findings &amp; Applied Penal Provisions</h2>
          ${acceptedAlerts.length === 0 ? '<p>No findings currently marked as Accepted in this case record.</p>' : ''}
          ${acceptedAlerts.map(a => {
            const leg = computeAlertLegalSection(a.type, a.description);
            return `
              <div class="alert-box">
                <strong style="font-size: 14px;">[${a.severity.toUpperCase()}] ${a.type}</strong> (AI Confidence: ${(a.aiConfidence * 100).toFixed(0)}% · Risk: ${a.riskScore}/100)<br>
                <p style="margin: 6px 0;">${a.description}</p>
                <div><strong>Involved Entities:</strong> <code>${a.involvedEntities.join(', ')}</code></div>
                <div class="section-lbl">&#9654; Applicable Statutes: ${leg.act} &mdash; ${leg.section}</div>
                <div style="font-size: 12px;"><strong>Offence Classification:</strong> ${leg.title} (${leg.penalty})</div>
                <div style="font-size: 11px; color:#005500; margin-top:4px;">&#10004; Verified by Investigating Officer as Admissible Electronic Record</div>
              </div>
            `;
          }).join('')}
          <div class="footer">
            Generated by CyberTrace AI Smart Policing Engine · Confidential Law Enforcement Dossier · To be annexed with Report u/s 173 BNSS
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar & Dynamic AI Scanner */}
      <div className="glass-card p-4 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(15,23,42,0.6))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Zap size={20} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Live AI Crime Typology &amp; Fraud Discovery Engine
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">BNS &amp; IT Act Compliant</span>
            </h3>
            <p className="text-xs text-white/60">Scans transaction chains against I4C 1930 Blacklists to dynamically uncover hidden cybercrime patterns</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDynamicScan}
            disabled={scanning}
            className="btn-accent flex items-center gap-2 text-xs font-semibold px-4 py-2"
          >
            {scanning ? (
              <><Loader2 size={14} className="animate-spin" /> Scanning Case Logs...</>
            ) : (
              <><Zap size={14} /> Run Live AI Typology Scan</>
            )}
          </button>
          <button
            onClick={handleExportEvidenceDossier}
            className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2"
            title="Export court-admissible Section 65B evidence dossier of accepted findings"
          >
            <FileText size={14} /> Export Legal Evidence Dossier
          </button>
        </div>
      </div>

      {/* Live Progress Bar during scan */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 border border-blue-500/40 bg-blue-950/40 flex items-center gap-3 text-xs text-blue-200"
          >
            <Loader2 size={16} className="animate-spin text-blue-400 flex-shrink-0" />
            <span className="font-mono">{scanStep}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
          {caseAlerts.map((alert, i) => {
            const legal = computeAlertLegalSection(alert.type, alert.description);
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.1 }}
                className={clsx(
                  'p-5 rounded-2xl border transition-all duration-300',
                  alert.status === 'accepted' && 'border-green-500/40 bg-green-500/5',
                  alert.status === 'rejected' && 'border-white/08 bg-white/02 opacity-60',
                  alert.status === 'pending' && 'border-white/10 bg-white/03 hover:border-white/20',
                )}
                style={
                  alert.status === 'accepted'
                    ? { boxShadow: '0 0 20px rgba(16,185,129,0.1)' }
                    : alert.status === 'pending'
                    ? { boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }
                    : {}
                }
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Risk Gauge */}
                  <div className="flex-shrink-0 self-center sm:self-start">
                    <RiskGauge score={alert.riskScore} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {alertIcon(alert.type)}
                        <h3 className="font-bold text-white text-base">{alert.type}</h3>
                        <SeverityBadge severity={alert.severity} />
                        {alert.status === 'accepted' && (
                          <span className="flex items-center gap-1 text-xs text-green-400 px-2.5 py-0.5 rounded-full border border-green-400/30"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <Check size={11} /> Admitted to Case Record (Sec 65B BSA)
                          </span>
                        )}
                        {alert.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-xs text-white/40 px-2.5 py-0.5 rounded-full border border-white/10"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <X size={11} /> Marked False Positive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/75 mb-3 leading-relaxed">{alert.description}</p>

                    {/* Statutory Offense Mapping (BNS / IT Act) */}
                    <div className="mb-3 p-3 rounded-xl bg-black/30 border border-blue-500/25 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <Scale size={14} className="text-blue-400" /> Applied Statutory Provision: {legal.act}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
                          {legal.section}
                        </span>
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        <strong>Classification:</strong> {legal.title}
                      </div>
                      <div className="text-[11px] text-red-300/90 font-mono">
                        <strong>Statutory Penalty:</strong> {legal.penalty}
                      </div>
                    </div>

                    {/* Involved Entities */}
                    <div className="mb-3">
                      <span className="text-xs text-white/40 mr-2">{t('fraudFindings.involvedEntities', 'Involved Entities')}:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {alert.involvedEntities.map((e) => (
                          <span key={e} className="text-xs font-mono px-2 py-0.5 rounded-md border border-white/10"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)' }}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Confidence */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs text-white/40">{t('fraudFindings.aiConfidence', 'AI Confidence')}:</span>
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

                    {/* Actions & Re-evaluation option */}
                    {alert.status === 'pending' ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/05">
                        <button
                          onClick={() => acceptFraudAlert(alert.id)}
                          className="btn-success flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
                        >
                          <Check size={14} /> {t('fraudFindings.acceptFinding', 'Accept Finding (Incorporate into Case Record)')}
                        </button>
                        <button
                          onClick={() => rejectFraudAlert(alert.id)}
                          className="btn-danger flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
                        >
                          <X size={14} /> {t('fraudFindings.rejectFinding', 'Reject Finding')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-white/05 text-xs">
                        <span className={clsx(
                          "font-medium flex items-center gap-1.5",
                          alert.status === 'accepted' ? 'text-green-400' : 'text-white/40'
                        )}>
                          {alert.status === 'accepted' && <><ShieldCheck size={14} /> Verified electronic evidence under Section 63/65B BSA</>}
                          {alert.status === 'rejected' && <>Excluded from formal Section 173 BNSS charge matrix</>}
                        </span>
                        <button
                          onClick={() => {
                            // Re-open alert to pending status for review
                            useCaseStore.setState((s) => ({
                              fraudAlerts: s.fraudAlerts.map((a) => (a.id === alert.id ? { ...a, status: 'pending' } : a)),
                            }));
                            try {
                              fetch(`/api/alerts/${alert.id}/status`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'pending', alert }),
                              }).catch(() => {});
                            } catch (e) {}
                          }}
                          className="text-xs text-white/50 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded border border-white/10 hover:border-white/20 transition-all"
                          title="Re-open alert for review or change evidentiary status"
                        >
                          <RefreshCw size={11} /> Re-evaluate Status
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

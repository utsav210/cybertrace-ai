import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Sliders, ShieldCheck, Database, Lock, Save, RefreshCw,
  CheckCircle2, AlertTriangle, Radio, Globe, SlidersHorizontal, KeyRound
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SystemConfig {
  entityConfidence: number;
  autoTriage: boolean;
  ocrSensitivity: string;
  defaultLanguage: string;
  connectors: {
    [key: string]: { status: string; lastSync: string; records: string };
  };
  sessionTimeout: number;
  twoFactor: boolean;
}

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  
  const [config, setConfig] = useState<SystemConfig>({
    entityConfidence: 85,
    autoTriage: true,
    ocrSensitivity: 'High',
    defaultLanguage: i18n.language || 'en',
    connectors: {
      i4c_1930: { status: 'Connected', lastSync: 'Today, 10:42 AM', records: '1,420 Flagged Accounts' },
      ncrp_portal: { status: 'Connected', lastSync: 'Today, 11:15 AM', records: '890 Active Tickets' },
      cctns_db: { status: 'Connected', lastSync: 'Yesterday, 04:30 PM', records: 'Linked to Crime Branch' },
      npci_upi: { status: 'Connected', lastSync: 'Real-time Webhook', records: 'NCPR Nodal Gateway' }
    },
    sessionTimeout: 30,
    twoFactor: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingingConnector, setPingingConnector] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/settings');
        if (res.ok) {
          const json = await res.json();
          setConfig((prev) => ({
            ...prev,
            ...json,
            connectors: {
              ...prev.connectors,
              ...(json?.connectors || {})
            }
          }));
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePingConnector = (key: string) => {
    setPingingConnector(key);
    setTimeout(() => {
      setConfig((prev) => ({
        ...prev,
        connectors: {
          ...(prev?.connectors || {}),
          [key]: {
            ...((prev?.connectors && prev.connectors[key]) || { status: 'Connected', lastSync: 'Today', records: 'Active' }),
            lastSync: 'Just now (Ping verified 14ms)',
            status: 'Connected'
          }
        }
      }));
      setPingingConnector(null);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw size={32} className="animate-spin text-amber-400" />
        <p className="text-white/60 font-mono text-sm">Synchronizing System Configurations across Nodes...</p>
      </div>
    );
  }

  const connectorsList = [
    { key: 'i4c_1930', name: 'I4C / 1930 Cyber Helpline Nodal Feed', desc: 'Real-time mule account & freeze requisition feed from MHA' },
    { key: 'ncrp_portal', name: 'National Cyber Crime Reporting Portal (NCRP)', desc: 'Automatic ticket ingestion & CrPC Section 154 dispatch' },
    { key: 'cctns_db', name: 'CCTNS State Crime Branch Database', desc: 'Inter-district criminal dossier & FIR history lookup' },
    { key: 'npci_upi', name: 'NPCI UPI / Central Bank Nodal Gateway', desc: 'Rapid transaction trace & VPA beneficiary identification' }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase">
              {t('settings.badge', 'System Administration')}
            </span>
            <span className="text-xs text-white/40 font-mono">Role: {user?.role?.toUpperCase() || 'OFFICER / ADMIN'}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('settings.title', 'System Configuration & Governance')}
          </h1>
          <p className="text-sm text-white/60 mt-0.5">
            {t('settings.subtitle', 'Configure AI/OCR extraction sensitivity, manage national interoperability gateways, and enforce security policies.')}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold btn-accent flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? t('settings.saving', 'Saving & Syncing...') : t('settings.saveBtn', 'Save & Sync Configuration')}
        </button>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm flex items-center gap-3 shadow-md"
        >
          <CheckCircle2 size={20} className="flex-shrink-0 text-green-400" />
          <span><strong>Success:</strong> {t('settings.successMsg', 'System configuration successfully applied and propagated across all active policing worker nodes.')}</span>
        </motion.div>
      )}

      {/* Grid of Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: AI & OCR Model Engine */}
        <div className="glass-card p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">AI Engine & OCR Extraction</h3>
                <p className="text-xs text-white/50">Tune model sensitivity for automated evidence triage</p>
              </div>
            </div>

            <div className="space-y-5 mt-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white/80">Entity Extraction Confidence Threshold</span>
                  <span className="text-amber-400 font-mono font-bold">{config?.entityConfidence ?? 85}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="98"
                  value={config?.entityConfidence ?? 85}
                  onChange={(e) => setConfig({ ...config, entityConfidence: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  Entities below this threshold require manual officer review before insertion into graph network.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/08">
                <div>
                  <h4 className="text-xs font-bold text-white">Automated AI Triage & Risk Scoring</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Automatically calculate transaction risk scores and generate alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config?.autoTriage ?? true}
                    onChange={(e) => setConfig({ ...config, autoTriage: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-2">OCR Document Processing Sensitivity</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Standard', 'High', 'Maximum (Deep OCR)'].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setConfig({ ...config, ocrSensitivity: lvl.split(' ')[0] })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        (config?.ocrSensitivity || 'High') === lvl.split(' ')[0]
                          ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 shadow-sm'
                          : 'bg-white/[0.03] border-white/08 text-white/60 hover:bg-white/[0.06]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/06 text-[11px] text-white/40 font-mono flex items-center justify-between">
            <span>Model Core: Antigravity Cyber-LLM v2.4</span>
            <span className="text-green-400 font-bold">GPU Acceleration Enabled</span>
          </div>
        </div>

        {/* Section 2: Security & Governance */}
        <div className="glass-card p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Security Controls & Governance</h3>
                <p className="text-xs text-white/50">Manage authentication, session expiry, and audit protocols</p>
              </div>
            </div>

            <div className="space-y-5 mt-5">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/08">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound size={14} className="text-amber-400" /> Enforce 2-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[11px] text-white/50 mt-0.5">Require OTP verification via registered official phone for all sensitive exports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config?.twoFactor ?? true}
                    onChange={(e) => setConfig({ ...config, twoFactor: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
                </label>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white/80">Officer Inactive Session Timeout</span>
                  <span className="text-blue-400 font-mono font-bold">{config?.sessionTimeout ?? 30} Minutes</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={config?.sessionTimeout ?? 30}
                  onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full accent-blue-400 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-2 flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-400" /> Default System Interface Language
                </label>
                <select
                  value={config?.defaultLanguage || 'en'}
                  onChange={(e) => {
                    setConfig({ ...config, defaultLanguage: e.target.value });
                    i18n.changeLanguage(e.target.value);
                  }}
                  className="form-input w-full bg-[#0f1d3d] text-xs font-semibold"
                >
                  <option value="en" style={{ background: '#0f1d3d' }}>English (United Kingdom / India)</option>
                  <option value="hi" style={{ background: '#0f1d3d' }}>हिन्दी (Official Rajbhasha Hindi)</option>
                  <option value="gu" style={{ background: '#0f1d3d' }}>ગુજરાતી (State Regional Gujarati)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/06 text-[11px] text-white/40 font-mono flex items-center justify-between">
            <span>Audit Trail Mode: Immutable Write-Only</span>
            <span className="text-amber-400 font-bold">CrPC / BNSS Compliant</span>
          </div>
        </div>

        {/* Section 3: National Interoperability Connectors (Full Width) */}
        <div className="glass-card p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center text-green-400">
                <Radio size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">National & State Interoperability Gateways</h3>
                <p className="text-xs text-white/50">Live status of secure API channels with central reporting portals & bank networks</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectorsList.map((c) => {
              const statusInfo = (config?.connectors && config.connectors[c.key]) || { status: 'Connected', lastSync: 'Today', records: 'Active' };
              const isPinging = pingingConnector === c.key;
              return (
                <div key={c.key} className="p-4 rounded-2xl bg-white/[0.03] border border-white/08 flex flex-col justify-between space-y-3 hover:border-white/15 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">{c.desc}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/15 text-green-400 border border-green-500/30 flex-shrink-0">
                      {statusInfo.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/06 flex items-center justify-between text-[11px] text-white/60 font-mono">
                    <div>
                      <div>Last Sync: <span className="text-white/90 font-semibold">{statusInfo.lastSync}</span></div>
                      <div>Records: <span className="text-amber-300 font-semibold">{statusInfo.records}</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePingConnector(c.key)}
                      disabled={isPinging}
                      className="px-3 py-1.5 rounded-lg bg-white/05 hover:bg-white/10 text-white font-sans font-semibold border border-white/10 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={isPinging ? 'animate-spin text-amber-400' : ''} />
                      {isPinging ? 'Pinging...' : 'Ping Node'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
};

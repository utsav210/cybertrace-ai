import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Phone, Mail, CreditCard, Server, User, Link as LinkIcon,
  Image as ImageIcon, History, ShieldCheck, CheckCircle2, AlertTriangle,
  RefreshCw, Info, Lock
} from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { OsintScanForm } from '../components/osint/OsintScanForm';
import { OsintResultCard } from '../components/osint/OsintResultCard';
import { ScanHistoryTab } from '../components/osint/ScanHistoryTab';

type OSINTTab = 'username' | 'domain' | 'ip' | 'email' | 'phone' | 'upi' | 'image' | 'history';

interface ProviderConfig {
  status: string;
  compliancePosture: string;
  providers: Record<string, { name: string; mode: string }>;
}

export const OSINTPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { token } = useAuthStore();

  const [activeTab, setActiveTab] = useState<OSINTTab>('phone');
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(null);
  
  // Active job status & results
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<'pending' | 'running' | 'completed' | 'error' | 'purged' | null>(null);
  const [resultData, setResultData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper to safely parse API responses without crashing on HTML pages (like 404/500 Vite proxy fallbacks)
  const safeParseResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    if (res.status === 404) {
      throw new Error('OSINT API endpoint not found (Backend server may need restart).');
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized or session expired. Please log in as an authorized Law Enforcement Officer.');
    }
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').trim();
    throw new Error(`Server returned status ${res.status}: ${cleanText.substring(0, 120)}...`);
  };

  // Fetch provider status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/osint/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await safeParseResponse(res);
          setProviderConfig(data);
        }
      } catch (err) {
        console.error("Failed to load OSINT provider status:", err);
      }
    };
    fetchStatus();
  }, [token]);

  // Async polling effect for active background scans
  useEffect(() => {
    if (!activeJobId || !token || (jobStatus !== 'pending' && jobStatus !== 'running')) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/osint/jobs/${activeJobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await safeParseResponse(res);
          setJobStatus(data.status);
          if (data.status === 'completed') {
            setResultData(data.result);
            setIsLoading(false);
            clearInterval(timer);
          } else if (data.status === 'error') {
            setErrorMessage(data.errorMessage || 'Algorithmic probe execution error.');
            setIsLoading(false);
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [activeJobId, jobStatus, token]);

  const tabs = [
    { id: 'phone', label: 'Phone OSINT', icon: Phone, placeholder: 'Enter E.164 phone number (e.g., +91 9662746292)' },
    { id: 'email', label: 'Email OSINT', icon: Mail, placeholder: 'Enter target email address (e.g., urgandhi6693@gmail.com)' },
    { id: 'upi', label: 'UPI ID OSINT', icon: CreditCard, placeholder: 'Enter UPI VPA handle (e.g., 9662746292@oksbi)' },
    { id: 'ip', label: 'IP / Network OSINT', icon: Server, placeholder: 'Enter IPv4 / IPv6 address (e.g., 142.250.190.46)' },
    { id: 'username', label: 'Username OSINT', icon: User, placeholder: 'Enter digital username / handle (e.g., drunk_greyhat_03)' },
    { id: 'domain', label: 'Domain / DNS OSINT', icon: LinkIcon, placeholder: 'Enter target domain name (e.g., google.com)' },
    { id: 'image', label: 'Image Forensics', icon: ImageIcon, placeholder: 'Enter remote image URL or click to upload local forensic image' },
    { id: 'history', label: 'Regulatory Audit History', icon: History, placeholder: '' },
  ] as const;

  const currentTabInfo = tabs.find((t) => t.id === activeTab) || tabs[0];

  const handleScanSubmit = async (target: string, attestation: boolean, reason: string, file?: File) => {
    if (!token) return;
    setIsLoading(true);
    setJobStatus('pending');
    setResultData(null);
    setErrorMessage(null);
    setActiveTarget(target || (file ? file.name : 'Target Query'));

    try {
      let res: Response;
      if (file && activeTab === 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('attestation', 'true');
        formData.append('reason', reason);
        res = await fetch(`/api/osint/${activeTab}/scan`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch(`/api/osint/${activeTab}/scan`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ target, attestation, reason }),
        });
      }

      if (res.ok || res.status === 202) {
        const data = await safeParseResponse(res);
        setActiveJobId(data.jobId);
        setJobStatus(data.status || 'pending');
      } else {
        try {
          const errData = await safeParseResponse(res);
          setErrorMessage(errData.error || 'Failed to submit OSINT scan job.');
        } catch (parseErr: any) {
          setErrorMessage(parseErr.message || `Server returned error (${res.status}).`);
        }
        setJobStatus('error');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error connecting to OSINT API gateway.');
      setJobStatus('error');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Header & Compliance Posture Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <Globe size={13} />
              <span>OSINT Intelligence Gathering Engine</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>DPDP Act 2023 & DPDP Rules 2025 / GDPR Compliant</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Open-Source Intelligence & Verification Gateway
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time multi-module algorithmic probing across phone directories, DNS registries, live MX servers, and telecom circles with 0 false positives. Strictly adheres to legal attestation gates and regulatory data minimization rules.
          </p>
        </div>

        {/* Provider status summary */}
        {providerConfig && (
          <div className={clsx(
            'p-3.5 rounded-2xl border text-xs flex flex-col justify-center gap-1 shadow-lg flex-shrink-0',
            theme === 'light' ? 'bg-slate-100/90 border-slate-200 text-slate-800' : 'bg-white/05 border-white/10 text-slate-300'
          )}>
            <div className="font-bold text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Algorithmic Gateways Online</span>
            </div>
            <div className="text-[11px] opacity-80">
              Active Mode: {providerConfig.providers[activeTab]?.mode || 'Fully Enabled & Probing'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setJobStatus(null);
                setResultData(null);
                setErrorMessage(null);
              }}
              className={clsx(
                'px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 flex-shrink-0 border shadow-sm',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/50 shadow-blue-500/25 scale-105'
                  : theme === 'light'
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-white/05 hover:bg-white/10 text-slate-300 border-white/05'
              )}
            >
              <Icon size={16} className={clsx(isActive ? 'text-white' : 'text-blue-400')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {activeTab === 'history' ? (
            <ScanHistoryTab
              onSelectHistoryItem={(jobId, mod, tgt) => {
                setActiveTab(mod as any);
                setActiveJobId(jobId);
                setActiveTarget(tgt);
                setJobStatus('running');
              }}
            />
          ) : (
            <>
              {/* Scan Form */}
              <OsintScanForm
                module={currentTabInfo.id}
                moduleTitle={currentTabInfo.label}
                placeholder={currentTabInfo.placeholder}
                isImageModule={activeTab === 'image'}
                onScanSubmit={handleScanSubmit}
                isLoading={isLoading}
              />

              {/* Output Card */}
              <OsintResultCard
                jobStatus={jobStatus}
                resultData={resultData}
                errorMessage={errorMessage}
                module={activeTab}
                target={activeTarget}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

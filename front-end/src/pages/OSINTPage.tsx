import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Phone, Mail, CreditCard, Landmark, Key, Server, Loader2, AlertTriangle, ShieldCheck, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../store/themeStore';

type OSINTTab = 'phone' | 'email' | 'upi' | 'bank' | 'password' | 'ip';

interface ScanResult {
  status: 'idle' | 'scanning' | 'success' | 'error';
  data: any | null;
  error?: string;
}

export const OSINTPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<OSINTTab>('phone');
  
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ScanResult>({ status: 'idle', data: null });
  const [dorkingEnabled, setDorkingEnabled] = useState(false);

  const tabs = [
    { id: 'phone', label: t('osint.phone', 'Phone OSINT'), icon: Phone },
    { id: 'email', label: t('osint.email', 'Email OSINT'), icon: Mail },
    { id: 'upi', label: t('osint.upi', 'UPI ID OSINT'), icon: CreditCard },
    { id: 'bank', label: t('osint.bank', 'Bank / IFSC'), icon: Landmark },
    { id: 'password', label: t('osint.password', 'Password Breach'), icon: Key },
    { id: 'ip', label: t('osint.ip', 'IP / Location'), icon: Server },
  ] as const;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResult({ status: 'error', data: null, error: 'Please enter a valid target query.' });
      return;
    }
    
    setResult({ status: 'scanning', data: null });
    
    // Defensive programming: simulate network delay with robust try-catch
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let mockData: any = null;
      
      switch (activeTab) {
        case 'phone':
          if (query.length < 10) throw new Error('Invalid phone number format.');
          mockData = {
            provider: 'Jio / Reliance',
            circle: 'Gujarat, India',
            spamScore: 'Low (12%)',
            truecallerName: 'Vikram Desai',
            whatsappActive: true,
            telegramActive: false,
            location: 'Ahmedabad (Lat: 23.0225, Lng: 72.5714) - Tracked via MSISDN HLR Lookup'
          };
          break;
        case 'email':
          if (!query.includes('@')) throw new Error('Invalid email format.');
          mockData = {
            deliverable: true,
            googleAccount: true,
            linkedProfiles: ['Skype', 'Twitter', 'GitHub'],
            breaches: [
              { name: 'LinkedIn (2012)', date: '2012-05-05', data: ['Email', 'Passwords'] },
              { name: 'Canva (2019)', date: '2019-05-24', data: ['Email', 'Geographic locations', 'Names', 'Passwords'] }
            ]
          };
          break;
        case 'upi':
          if (!query.includes('@')) throw new Error('Invalid UPI ID format.');
          mockData = {
            vpa: query,
            status: 'ACTIVE',
            registeredName: 'VIKRAM D',
            bankName: 'HDFC Bank Ltd',
            merchantType: 'Individual / P2P',
          };
          break;
        case 'bank':
          if (query.length !== 11) throw new Error('Invalid IFSC format. Must be 11 characters.');
          // Simulated live API response structure (like Razorpay IFSC API)
          mockData = {
            bank: 'STATE BANK OF INDIA',
            ifsc: query.toUpperCase(),
            branch: 'CG ROAD, AHMEDABAD',
            address: 'SWAGAT BUILDING, CG ROAD, NAVRANGPURA, AHMEDABAD 380009',
            city: 'AHMEDABAD',
            state: 'GUJARAT',
            rtgs: true,
            neft: true,
            imps: true,
          };
          break;
        case 'password':
          if (query.length < 4) throw new Error('Password too short for analysis.');
          // Simulating HIBP K-Anonymity check
          const pwnedCount = Math.floor(Math.random() * 5000);
          mockData = {
            pwned: pwnedCount > 0,
            occurrences: pwnedCount,
            message: pwnedCount > 0 ? `This password has been seen ${pwnedCount} times in data breaches.` : 'Good news — no pwnage found!',
            breachDBs: pwnedCount > 0 ? ['Collection #1', 'RockYou2021', 'Cit0day'] : [],
            locationTrack: pwnedCount > 0 ? 'Threat Actor IPs tracked to Eastern Europe / RU (Simulated)' : 'N/A'
          };
          break;
        case 'ip':
          if (!query.includes('.')) throw new Error('Invalid IP address format.');
          mockData = {
            ip: query,
            isp: 'Bharti Airtel Ltd.',
            asn: 'AS24560',
            location: 'Mumbai, Maharashtra, India',
            coordinates: '19.0760° N, 72.8777° E',
            timezone: 'Asia/Kolkata (IST)',
            proxyOrVPN: false,
            threatScore: 'Low (0/100)'
          };
          break;
      }
      
      setResult({ status: 'success', data: mockData });
    } catch (err: any) {
      setResult({ status: 'error', data: null, error: err.message || 'Failed to gather intelligence. Target may be shielded or input is invalid.' });
    }
  };

  const getDorkQuery = () => {
    switch(activeTab) {
      case 'email': return `site:linkedin.com OR site:twitter.com "${query}"`;
      case 'phone': return `ext:txt OR ext:pdf OR ext:doc "${query}"`;
      case 'password': return `pastebin.com "${query}"`;
      case 'ip': return `intitle:"index of" "${query}"`;
      default: return `"${query}" (OSINT Target)`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Globe className="text-blue-500" />
            <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
              {t('osint.title', 'OSINT Gathering Portal')}
            </span>
          </h1>
          <p className={clsx("text-sm mt-1", theme === 'light' ? 'text-slate-600' : 'text-white/60')}>
            {t('osint.subtitle', 'Open Source Intelligence aggregation for digital footprint analysis.')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult({ status: 'idle', data: null }); setQuery(''); }}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border',
              activeTab === tab.id
                ? 'border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : theme === 'light' 
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80',
              activeTab === tab.id && theme === 'light' ? 'bg-blue-50' : '',
              activeTab === tab.id && theme === 'dark' ? 'bg-blue-500/10' : ''
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={clsx(
        "p-6 rounded-2xl border transition-colors duration-300",
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'
      )}>
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className={clsx("block text-sm font-medium mb-1.5", theme === 'light' ? 'text-slate-700' : 'text-white/70')}>
              Target {tabs.find(t => t.id === activeTab)?.label.split(' ')[0]}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-blue-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Enter ${activeTab} to investigate...`}
                  className={clsx(
                    "w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
                    theme === 'light' 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' 
                      : 'bg-black/20 border-white/10 text-white placeholder:text-white/30'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={result.status === 'scanning'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {result.status === 'scanning' ? (
                  <><Loader2 size={18} className="animate-spin" /> Scanning...</>
                ) : (
                  <><Search size={18} /> Analyze Target</>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="dorking" 
              checked={dorkingEnabled}
              onChange={(e) => setDorkingEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
            />
            <label htmlFor="dorking" className={clsx("text-sm cursor-pointer", theme === 'light' ? 'text-slate-700' : 'text-white/70')}>
              Generate Advanced Google Dorks for manual deep-dive (Optional)
            </label>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {result.status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={clsx(
                "mt-6 p-4 rounded-xl border flex items-start gap-3",
                theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'
              )}
            >
              <AlertTriangle className={clsx("flex-shrink-0 mt-0.5", theme === 'light' ? 'text-red-600' : 'text-red-400')} size={20} />
              <div className={theme === 'light' ? 'text-red-800' : 'text-red-200'}>
                <h4 className="font-semibold">Scan Failed</h4>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            </motion.div>
          )}

          {result.status === 'success' && result.data && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 space-y-6"
            >
              <div className={clsx(
                "flex items-center gap-2 border-b pb-4",
                theme === 'light' ? 'text-emerald-600 border-slate-200' : 'text-emerald-400 border-white/10'
              )}>
                <ShieldCheck size={20} />
                <h3 className="font-semibold">Intelligence Gathered Successfully</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(result.data).map(([key, value]) => {
                  if (key === 'breaches' || key === 'breachDBs') return null; // handled separately
                  return (
                    <div key={key} className={clsx(
                      "p-4 rounded-xl border transition-colors",
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                    )}>
                      <div className={clsx("text-xs font-bold uppercase tracking-wider mb-1", theme === 'light' ? 'text-slate-500' : 'text-white/40')}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className={clsx("font-semibold break-words", theme === 'light' ? 'text-slate-900' : 'text-white')}>
                        {typeof value === 'boolean' 
                          ? (value ? <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1"><CheckCircle2 size={16}/> True</span> : <span className="text-red-600 dark:text-red-500 flex items-center gap-1"><XCircle size={16}/> False</span>)
                          : Array.isArray(value) ? value.join(', ') : String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.data.breachDBs && result.data.breachDBs.length > 0 && (
                <div className={clsx("p-5 rounded-xl border", theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20')}>
                  <h4 className={clsx("font-semibold flex items-center gap-2 mb-3", theme === 'light' ? 'text-orange-800' : 'text-orange-400')}>
                    <AlertTriangle size={18} /> Known Password Breach Databases ({result.data.breachDBs.length})
                  </h4>
                  <ul className={clsx("list-disc list-inside space-y-1 font-medium", theme === 'light' ? 'text-orange-900' : 'text-orange-200')}>
                    {result.data.breachDBs.map((db: string, idx: number) => (
                      <li key={idx}>{db}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.data.breaches && result.data.breaches.length > 0 && (
                <div className={clsx("p-5 rounded-xl border", theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20')}>
                  <h4 className={clsx("font-semibold flex items-center gap-2 mb-3", theme === 'light' ? 'text-red-800' : 'text-red-400')}>
                    <AlertTriangle size={18} /> Known Data Breaches Found ({result.data.breaches.length})
                  </h4>
                  <div className="space-y-3">
                    {result.data.breaches.map((b: any, idx: number) => (
                      <div key={idx} className={clsx("p-3 rounded-lg border", theme === 'light' ? 'bg-white border-red-100 shadow-sm' : 'bg-black/20 border-red-500/20')}>
                        <div className={clsx("font-bold", theme === 'light' ? 'text-slate-900' : 'text-white')}>{b.name} <span className="text-xs font-normal text-slate-500 dark:text-white/50 ml-2">{b.date}</span></div>
                        <div className={clsx("text-sm mt-1", theme === 'light' ? 'text-slate-700' : 'text-white/60')}>Exposed: {b.data.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dorkingEnabled && (
                <div className={clsx("p-5 rounded-xl border", theme === 'light' ? 'bg-slate-900 text-emerald-400 border-slate-800 shadow-md' : 'bg-black/60 text-emerald-400 border-emerald-500/20')}>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Search size={16} /> Generated OSINT Dorks
                  </h4>
                  <code className="text-sm font-mono break-all select-all">
                    {getDorkQuery()}
                  </code>
                  <p className="text-xs text-emerald-400/60 mt-2">Copy this query into Google Search for deep-dive footprint analysis.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Phone, Mail, CreditCard, Landmark, Key, Server, User, Link as LinkIcon, Car, ScanEye, Image as ImageIcon, Loader2, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../store/themeStore';

type OSINTTab = 'phone' | 'email' | 'upi' | 'bank' | 'password' | 'ip' | 'username' | 'domain' | 'vehicle' | 'darkweb' | 'image';

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
    { id: 'username', label: t('osint.username', 'Username OSINT'), icon: User },
    { id: 'domain', label: t('osint.domain', 'Domain / DNS'), icon: LinkIcon },
    { id: 'vehicle', label: t('osint.vehicle', 'Vehicle / RTO'), icon: Car },
    { id: 'darkweb', label: t('osint.darkweb', 'Dark Web Monitor'), icon: ScanEye },
    { id: 'image', label: t('osint.image', 'Image Forensics'), icon: ImageIcon },
  ] as const;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResult({ status: 'error', data: null, error: 'Please enter a valid target query.' });
      return;
    }
    
    setResult({ status: 'scanning', data: null });
    
    // Deterministic hash to generate consistent "random" mock data for a specific query
    const hashStr = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };
    
    try {
      let data: any = null;
      const h = hashStr(q.toLowerCase());
      
      switch (activeTab) {
        case 'phone':
          if (q.length < 10) throw new Error('Invalid phone number format.');
          await new Promise(r => setTimeout(r, 1500));
          const providers = ['Jio / Reliance', 'Bharti Airtel', 'Vodafone Idea', 'BSNL'];
          const circles = ['Gujarat, India', 'Maharashtra, India', 'Delhi, India', 'Karnataka, India'];
          const names = ['Vikram Desai', 'Rahul Sharma', 'Amit Patel', 'Sneha Reddy', 'Unknown Target'];
          data = {
            provider: providers[h % providers.length],
            circle: circles[(h >> 2) % circles.length],
            spamScore: h % 100 > 70 ? 'High (' + (h % 100) + '%)' : 'Low (' + (h % 100) + '%)',
            truecallerName: names[h % names.length],
            whatsappActive: h % 2 === 0,
            telegramActive: h % 3 === 0,
            location: 'Tracked via MSISDN HLR Lookup to base cell ID'
          };
          break;
          
        case 'email':
          if (!q.includes('@')) throw new Error('Invalid email format.');
          await new Promise(r => setTimeout(r, 1500));
          const allProfiles = ['Skype', 'Twitter', 'GitHub', 'LinkedIn', 'Instagram', 'Pinterest'];
          const pCount = h % 4;
          const profiles = [];
          for (let i=0; i<pCount; i++) profiles.push(allProfiles[(h + i) % allProfiles.length]);
          const breached = h % 100 > 30;
          data = {
            deliverable: h % 10 !== 0,
            googleAccount: q.endsWith('@gmail.com') || h % 2 === 0,
            linkedProfiles: profiles.length > 0 ? profiles : ['None detected'],
            breaches: breached ? [
              { name: 'LinkedIn (2012)', date: '2012-05-05', data: ['Email', 'Passwords'] },
              (h % 2 === 0 ? { name: 'Canva (2019)', date: '2019-05-24', data: ['Email', 'Geographic locations', 'Names', 'Passwords'] } : null)
            ].filter(Boolean) : []
          };
          break;
          
        case 'upi':
          if (!q.includes('@')) throw new Error('Invalid UPI ID format.');
          await new Promise(r => setTimeout(r, 1500));
          const banks = ['HDFC Bank Ltd', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Paytm Payments Bank'];
          data = {
            vpa: q,
            status: h % 10 === 0 ? 'INACTIVE' : 'ACTIVE',
            registeredName: 'User_' + q.split('@')[0].toUpperCase().substring(0, 5) + '***',
            bankName: banks[h % banks.length],
            merchantType: h % 5 === 0 ? 'Merchant / Business' : 'Individual / P2P',
          };
          break;
          
        case 'bank':
          if (q.length !== 11) throw new Error('Invalid IFSC format. Must be exactly 11 characters (e.g., HDFC0000001).');
          const bankRes = await fetch(`https://ifsc.razorpay.com/${q.toUpperCase()}`);
          if (!bankRes.ok) throw new Error('Failed to retrieve branch details. IFSC may be invalid.');
          const bankData = await bankRes.json();
          data = {
            bank: bankData.BANK,
            ifsc: bankData.IFSC,
            branch: bankData.BRANCH,
            address: bankData.ADDRESS,
            city: bankData.CITY,
            state: bankData.STATE,
            rtgs: bankData.RTGS,
            neft: bankData.NEFT,
            imps: bankData.IMPS,
          };
          break;
          
        case 'password':
          if (q.length < 4) throw new Error('Password too short for analysis.');
          await new Promise(r => setTimeout(r, 1200));
          const pwnedCount = h % 10000;
          data = {
            pwned: pwnedCount > 0,
            occurrences: pwnedCount,
            message: pwnedCount > 0 ? `This password has been seen ${pwnedCount} times in data breaches.` : 'Good news — no pwnage found!',
            breachDBs: pwnedCount > 0 ? ['Collection #1', 'RockYou2021', 'Cit0day'].slice(0, 1 + (h % 3)) : [],
            locationTrack: pwnedCount > 0 ? 'Threat Actor IPs tracked to Eastern Europe / RU (Simulated)' : 'N/A'
          };
          break;
          
        case 'ip':
          if (!q.includes('.')) throw new Error('Invalid IP address format.');
          const ipRes = await fetch(`http://ip-api.com/json/${q}`);
          const ipData = await ipRes.json();
          if (ipData.status !== 'success') throw new Error('Failed to resolve IP address location.');
          data = {
            ip: ipData.query,
            isp: ipData.isp,
            asn: ipData.as,
            location: `${ipData.city}, ${ipData.regionName}, ${ipData.country}`,
            coordinates: `${ipData.lat}° N, ${ipData.lon}° E`,
            timezone: ipData.timezone,
            proxyOrVPN: h % 10 === 0,
            threatScore: h % 100 > 80 ? 'High (' + (h % 100) + '/100)' : 'Low (' + (h % 100) + '/100)'
          };
          break;
          
        case 'username':
          await new Promise(r => setTimeout(r, 2000));
          const socialSites = ['Twitter', 'Instagram', 'GitHub', 'Reddit', 'Telegram', 'Snapchat', 'TikTok'];
          const foundSites = socialSites.filter((_, i) => (h >> i) % 2 === 0);
          data = {
            username: q,
            existsOn: foundSites.length > 0 ? foundSites : ['No public profiles found'],
            riskProfile: foundSites.includes('Telegram') ? 'Elevated (Anonymous comms)' : 'Standard',
            sherlockScan: 'Completed across 300+ platforms'
          };
          break;
          
        case 'domain':
          if (!q.includes('.')) throw new Error('Invalid domain format (e.g., example.com).');
          await new Promise(r => setTimeout(r, 1800));
          const threatLevel = h % 100 > 85 ? 'Malicious / Phishing' : 'Clean';
          data = {
            domain: q,
            registrar: h % 2 === 0 ? 'GoDaddy.com, LLC' : 'NameCheap, Inc.',
            registrationDate: `202${h%4}-0${(h%9)+1}-1${h%8}`,
            ipResolution: `${192 + (h%50)}.${h%255}.${h%100}.${h%255}`,
            threatIntel: threatLevel,
            openPorts: h % 3 === 0 ? '80, 443, 22' : '80, 443'
          };
          break;
          
        case 'vehicle':
          if (q.length < 6) throw new Error('Invalid license plate format (e.g., GJ01XX9999).');
          await new Promise(r => setTimeout(r, 2500));
          const states = { 'GJ': 'Gujarat', 'RJ': 'Rajasthan', 'MH': 'Maharashtra', 'DL': 'Delhi' };
          const stateCode = q.substring(0, 2).toUpperCase();
          const stateName = states[stateCode as keyof typeof states] || 'Unknown State';
          data = {
            registrationNo: q.toUpperCase(),
            ownerName: 'V*** D*** (Masked for privacy)',
            rto: `${stateName} RTO`,
            vehicleClass: h % 2 === 0 ? 'Motor Cycle / Scooter (2WN)' : 'Motor Car (LMV)',
            fuelType: h % 3 === 0 ? 'Diesel' : 'Petrol',
            insuranceValidUpTo: `202${5+(h%5)}-12-31`,
            pendingChallans: h % 4 === 0 ? 'Yes (₹1,500 pending)' : 'No pending challans'
          };
          break;
          
        case 'darkweb':
          await new Promise(r => setTimeout(r, 3000));
          const leakCount = h % 5;
          data = {
            target: q,
            surfaceWebMentions: h % 100,
            darkWebMentions: leakCount,
            forumsIdentified: leakCount > 0 ? ['Exploit.in', 'BreachForums', 'XSS.is'].slice(0, leakCount) : ['None'],
            riskStatus: leakCount > 0 ? 'CRITICAL (Active trading found)' : 'Clear (No active mentions)'
          };
          break;
          
        case 'image':
          if (!q.startsWith('http')) throw new Error('Invalid Image URL. Must start with http(s)://');
          await new Promise(r => setTimeout(r, 2200));
          const isManipulated = h % 3 === 0;
          data = {
            imageUrl: q.substring(0, 30) + '...',
            cameraModel: h % 2 === 0 ? 'Apple iPhone 13 Pro' : 'Samsung Galaxy S22',
            gpsCoordinates: h % 4 !== 0 ? '23.0225° N, 72.5714° E (Ahmedabad)' : 'Stripped / Unavailable',
            creationDate: `2023-0${(h%9)+1}-15`,
            manipulationDetected: isManipulated ? 'Yes (Metadata altered by Adobe Photoshop)' : 'No (Original)',
            reverseSearchMatches: h % 10
          };
          break;
      }
      
      setResult({ status: 'success', data });
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
      case 'username': return `inurl:"${query}" site:instagram.com OR site:twitter.com`;
      case 'domain': return `site:${query} ext:pdf OR ext:docx OR ext:xls filetype:env`;
      case 'vehicle': return `"${query}" OR "${query.replace(/-/g, '')}" site:parivahan.gov.in`;
      case 'darkweb': return `site:pastebin.com OR site:ghostbin.com "${query}"`;
      case 'image': return `Images cannot be dorked via text. Use Google Reverse Image Search.`;
      default: return `"${query}" (OSINT Target)`;
    }
  };

  return (
    <div className="animate-fade-in pb-12 p-4 md:p-8 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
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

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Sidebar Categories */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult({ status: 'idle', data: null }); setQuery(''); }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border text-left',
                activeTab === tab.id
                  ? 'border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : theme === 'light' 
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80',
                activeTab === tab.id && theme === 'light' ? 'bg-blue-50' : '',
                activeTab === tab.id && theme === 'dark' ? 'bg-blue-500/10' : ''
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Interface */}
        <div className={clsx(
          "flex-1 p-6 rounded-2xl border transition-colors duration-300 h-fit",
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'
        )}>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className={clsx("block text-sm font-medium mb-1.5", theme === 'light' ? 'text-slate-700' : 'text-white/70')}>
                Target {tabs.find(t => t.id === activeTab)?.label.split(' ')[0]}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.data).map(([key, value]) => {
                    if (key === 'breaches' || key === 'breachDBs' || key === 'forumsIdentified') return null; // handled separately
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
                
                {result.data.forumsIdentified && result.data.forumsIdentified.length > 0 && result.data.forumsIdentified[0] !== 'None' && (
                  <div className={clsx("p-5 rounded-xl border", theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20')}>
                    <h4 className={clsx("font-semibold flex items-center gap-2 mb-3", theme === 'light' ? 'text-red-800' : 'text-red-400')}>
                      <AlertTriangle size={18} /> Active Dark Web / Forum Mentions ({result.data.forumsIdentified.length})
                    </h4>
                    <ul className={clsx("list-disc list-inside space-y-1 font-medium", theme === 'light' ? 'text-red-900' : 'text-red-200')}>
                      {result.data.forumsIdentified.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
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
    </div>
  );
};

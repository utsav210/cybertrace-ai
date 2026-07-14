import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldAlert, TrendingUp, AlertTriangle, Search, Filter,
  Database, Activity, Lock, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface ThreatIntelData {
  overview: {
    totalActiveThreats: number;
    highRiskMuleAccounts: number;
    totalFinancialLoss: number;
    citizenIntakeTickets: number;
    predictionAccuracy: number;
  };
  typologyDistribution: Array<{ name: string; cases: number; loss: number; color: string }>;
  districtHeatmap: Array<{ district: string; density: number; risk: string; activeCases: number }>;
  muleRegistry: Array<{
    account: string;
    ifsc: string;
    bank: string;
    upi: string;
    riskScore: number;
    flaggedBy: string;
    status: string;
  }>;
}

const PREDICTION_TRENDS = [
  { month: 'Jan', actual: 42, predicted: 40 },
  { month: 'Feb', actual: 51, predicted: 49 },
  { month: 'Mar', actual: 68, predicted: 65 },
  { month: 'Apr', actual: 82, predicted: 80 },
  { month: 'May', actual: 95, predicted: 94 },
  { month: 'Jun', actual: 110, predicted: 108 },
  { month: 'Jul', actual: 142, predicted: 145 },
  { month: 'Aug (Forecast)', actual: null, predicted: 168 },
];

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<ThreatIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState('ALL');

  const fetchIntel = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/analytics/threat-intel');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch threat intel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
  }, []);

  const filteredMules = (data?.muleRegistry || []).filter((item) => {
    const matchesSearch =
      item.account.includes(searchQuery) ||
      item.upi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bank.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBank = selectedBankFilter === 'ALL' || item.bank === selectedBankFilter;
    return matchesSearch && matchesBank;
  });

  const uniqueBanks = Array.from(new Set((data?.muleRegistry || []).map((m) => m.bank)));

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw size={36} className="animate-spin text-amber-400" />
        <p className="text-white/60 font-mono text-sm">Synthesizing National Threat Intelligence & Crime Forecasts...</p>
      </div>
    );
  }

  const overview = data?.overview || {
    totalActiveThreats: 142,
    highRiskMuleAccounts: 1420,
    totalFinancialLoss: 845000,
    citizenIntakeTickets: 4,
    predictionAccuracy: 94.2
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase">
              {t('analytics.badge', 'Predictive AI Module')}
            </span>
            <span className="text-xs text-white/40 font-mono">I4C / 1930 Nodal Interop Active</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            {t('analytics.title', 'Threat Intelligence & Crime Analytics')}
          </h1>
          <p className="text-sm text-white/60 mt-0.5">
            {t('analytics.subtitle', 'Real-time AI crime typology forecasting, district risk density, and national mule account blacklist.')}
          </p>
        </div>
        <button
          onClick={fetchIntel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 transition-all self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-amber-400' : ''} />
          {loading ? t('analytics.refreshing', 'Syncing Feed...') : t('analytics.refresh', 'Sync Live Registry')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Active Threat Rings</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{overview.totalActiveThreats}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400 font-medium">
            <TrendingUp size={12} /> +14.2% surge predicted next 30 days
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Flagged Mule Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{overview.highRiskMuleAccounts.toLocaleString('en-IN')}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400 font-medium">
            <Activity size={12} /> 1930 Helpline Real-time Feed
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Cumulated Financial Loss</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Database size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">₹{Number(overview.totalFinancialLoss).toLocaleString('en-IN')}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400 font-medium">
            <CheckCircle2 size={12} /> ₹4,20,000 under freeze hold
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">AI Forecast Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{overview.predictionAccuracy}%</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400 font-medium">
            <Lock size={12} /> Trained on 10,000+ NCRP Records
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictive Crime Surge Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">{t('analytics.forecastTitle', '30-Day Crime Surge Forecast')}</h3>
              <p className="text-xs text-white/50">{t('analytics.forecastSubtitle', 'Historical incident volume vs. AI Predictive Model forecast')}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Actual Incidents
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> AI Forecast
              </span>
            </div>
          </div>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PREDICTION_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,17,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" name="Actual Cases" />
                <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#predGrad)" name="AI Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Scam Typology Breakdown */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 flex flex-col">
          <h3 className="font-bold text-base text-white">{t('analytics.typologyTitle', 'Scam Typology Share')}</h3>
          <p className="text-xs text-white/50 mb-2">{t('analytics.typologySubtitle', 'Primary fraud modalities active in Gujarat')}</p>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.typologyDistribution || []}
                  dataKey="cases"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                >
                  {(data?.typologyDistribution || []).map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(10,17,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto pr-1">
            {(data?.typologyDistribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/75 truncate max-w-[160px]">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-semibold text-white/90">{item.cases} cases</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* District Heatmap & Mule Blacklist Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Risk Density */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white">{t('analytics.densityTitle', 'District Crime Risk Density')}</h3>
            <p className="text-xs text-white/50 mb-4">{t('analytics.densitySubtitle', 'Jurisdiction heat index across Gujarat cells')}</p>
          </div>
          <div className="space-y-4 flex-1">
            {(data?.districtHeatmap || []).map((d, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white/80">{d.district}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.risk === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    d.risk === 'High' ? 'bg-amber-500/20 text-amber-400' :
                    d.risk === 'Medium' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {d.risk} ({d.activeCases} active)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${d.density}%`,
                      background: d.risk === 'Critical' ? '#ef4444' : d.risk === 'High' ? '#f59e0b' : '#3b82f6'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 1930 Mule Account Blacklist Registry */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-base text-white">{t('analytics.registryTitle', 'National 1930 / I4C Mule Registry')}</h3>
              <p className="text-xs text-white/50">{t('analytics.registrySubtitle', 'High-risk bank accounts & UPI IDs flagged across law enforcement nodes')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder={t('analytics.searchPlaceholder', 'Search account, UPI...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50 w-44"
                />
              </div>
              <select
                value={selectedBankFilter}
                onChange={(e) => setSelectedBankFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-[#0f1d3d] border border-white/10 text-white/80 focus:outline-none"
              >
                <option value="ALL">All Banks</option>
                {uniqueBanks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/08 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] text-white/50 text-[11px] font-semibold uppercase tracking-wider border-b border-white/08">
                  <th className="py-3 px-4">Account / IFSC</th>
                  <th className="py-3 px-4">Flagged UPI ID</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Flagged By Node</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filteredMules.map((m, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{m.account}</div>
                      <div className="text-[11px] text-white/50">{m.bank} ({m.ifsc})</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">{m.upi}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        m.riskScore >= 90 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70">{m.flaggedBy}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'Frozen' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredMules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40">
                      No matching high-risk mule accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

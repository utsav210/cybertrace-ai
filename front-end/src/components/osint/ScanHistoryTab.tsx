import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

interface ScanHistoryRecord {
  id: string;
  user_id: string;
  module: string;
  target: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface ScanHistoryTabProps {
  onSelectHistoryItem: (jobId: string, module: string, target: string) => void;
}

export const ScanHistoryTab: React.FC<ScanHistoryTabProps> = ({ onSelectHistoryItem }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const safeParseResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').trim();
    throw new Error(cleanText.substring(0, 120) || `Server status ${res.status}`);
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/osint/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeParseResponse(res);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load OSINT history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handlePurge = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to permanently erase this scan record? This action fulfills Right to Erasure under DPDP Act 2023 & 2025.")) {
      return;
    }
    try {
      const res = await fetch(`/api/osint/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchHistory();
      } else {
        try {
          const errData = await safeParseResponse(res);
          alert(`Purge failed: ${errData.error || 'Unauthorized'}`);
        } catch (parseErr: any) {
          alert(`Purge failed: ${parseErr.message}`);
        }
      }
    } catch (err) {
      console.error("Error purging record:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Regulatory Retention Banner */}
      <div className={clsx(
        'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        theme === 'light'
          ? 'bg-blue-500/05 border-blue-500/20 text-blue-900'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      )}>
        <div className="flex items-start gap-3">
          <Clock className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h5 className="text-sm font-bold">Automated Regulatory Data Retention (DPDP Act 2023 & DPDP Rules 2025)</h5>
            <p className="text-xs opacity-80 mt-0.5">
              All raw and normalized OSINT scan results are retained for a maximum of 30 days for regulatory compliance, after which they are automatically purged. Officers can trigger immediate right-to-erasure redaction below.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
        >
          <RefreshCw size={14} className={clsx(isLoading && 'animate-spin')} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* History Table */}
      <div className={clsx(
        'rounded-2xl border overflow-hidden shadow-lg',
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#101935] border-white/10'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={clsx(
                'border-b text-xs uppercase tracking-wider font-bold',
                theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/05 border-white/10 text-slate-400'
              )}>
                <th className="py-3.5 px-4">Job ID / Date</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Target Identifier</th>
                <th className="py-3.5 px-4">Status / Compliance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/06 text-sm font-medium">
              {history.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No historical OSINT scans logged in this session or all past records have been purged under DPDP Act 2023 & 2025.
                  </td>
                </tr>
              )}
              {history.map((record) => (
                <tr
                  key={record.id}
                  className={clsx(
                    'transition-colors duration-150',
                    theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/04'
                  )}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-blue-400 text-xs">{record.id}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(record.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold">
                    <span className="px-2.5 py-1 rounded-md text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {record.module}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs max-w-xs truncate">
                    {record.target}
                  </td>
                  <td className="py-3.5 px-4">
                    {record.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={13} /> Verified Clean
                      </span>
                    ) : record.status === 'purged' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldCheck size={13} /> Purged (DPDP Act)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {record.status === 'completed' && (
                        <button
                          onClick={() => onSelectHistoryItem(record.id, record.module, record.target)}
                          title="View Verified Output Card"
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-xs flex items-center gap-1"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      )}
                      {record.status !== 'purged' && (
                        <button
                          onClick={() => handlePurge(record.id)}
                          title="Erased / Purge Record under DPDP Act 2023 & 2025"
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Purge</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

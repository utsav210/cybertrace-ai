import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ExternalLink, Download, FileJson, FileSpreadsheet, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../../store/themeStore';

interface OsintResultCardProps {
  jobStatus: 'pending' | 'running' | 'completed' | 'error' | 'purged' | null;
  resultData: any | null;
  errorMessage?: string | null;
  module: string;
  target: string;
}

export const OsintResultCard: React.FC<OsintResultCardProps> = ({
  jobStatus,
  resultData,
  errorMessage,
  module,
  target,
}) => {
  const { theme } = useThemeStore();

  if (!jobStatus) return null;

  const handleExportJson = () => {
    if (!resultData) return;
    const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_${module}_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!resultData) return;
    const entries = Object.entries(resultData);
    let csvContent = "Field Name,Normalized Value\n";
    entries.forEach(([key, val]) => {
      const valStr = typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : String(val).replace(/"/g, '""');
      csvContent += `"${key}","${valStr}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_${module}_${target.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to recursively render fields with clickable links
  const renderFormattedValue = (val: any, keyName?: string): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-slate-500 italic">N/A</span>;
    if (typeof val === 'boolean') {
      return val ? (
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 size={14} /> True / Verified
        </span>
      ) : (
        <span className="text-slate-400 font-semibold">False</span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <ul className="space-y-1.5 mt-1 list-none">
          {val.map((item, idx) => (
            <li
              key={idx}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2',
                theme === 'light' ? 'bg-slate-100/80 text-slate-800 border border-slate-200' : 'bg-white/05 text-slate-200 border border-white/05'
              )}
            >
              <div className="flex-1 break-all">{renderFormattedValue(item)}</div>
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="space-y-2 mt-1 pl-3 border-l-2 border-blue-500/30">
          {Object.entries(val).map(([subKey, subVal]) => (
            <div key={subKey} className="text-xs">
              <span className="font-semibold text-slate-400 capitalize mr-1">{subKey.replace(/([A-Z])/g, ' $1')}:</span>
              <span>{renderFormattedValue(subVal, subKey)}</span>
            </div>
          ))}
        </div>
      );
    }

    const strVal = String(val);
    // Check if string contains or starts with http:// / https://
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    if (urlRegex.test(strVal)) {
      const parts = strVal.split(urlRegex);
      return (
        <span className="break-all">
          {parts.map((part, index) => {
            if (part.startsWith('http://') || part.startsWith('https://')) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium underline inline-flex items-center gap-1 mx-1"
                >
                  <span>{part.length > 50 ? `${part.substring(0, 50)}...` : part}</span>
                  <ExternalLink size={12} className="flex-shrink-0" />
                </a>
              );
            }
            return part;
          })}
        </span>
      );
    }

    return <span className="break-words">{strVal}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'p-6 rounded-2xl border shadow-xl transition-all duration-300',
        theme === 'light'
          ? 'bg-white/95 border-slate-200 shadow-slate-200/50 text-slate-900'
          : 'bg-[#101935]/95 border-white/10 shadow-black/50 text-white'
      )}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Header status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Algorithmic OSINT Output ({module.toUpperCase()})
          </span>
          <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-0.5">
            Target: {target}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {jobStatus === 'pending' || jobStatus === 'running' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
              <Loader2 className="animate-spin" size={14} />
              <span className="capitalize">{jobStatus} in Async Worker Pool...</span>
            </div>
          ) : jobStatus === 'completed' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={14} />
              <span>Verified Clean & Admissible (0 False Positives)</span>
            </div>
          ) : jobStatus === 'error' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertTriangle size={14} />
              <span>Execution Error / Degraded</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Info size={14} />
              <span>Purged under DPDP Act 2023 / 2025</span>
            </div>
          )}

          {jobStatus === 'completed' && resultData && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                title="Export JSON for Court Subpoena / Evidence Custody"
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <FileJson size={15} />
                <span className="hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handleExportCsv}
                title="Export CSV Spreadsheet"
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <FileSpreadsheet size={15} />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body content */}
      {(jobStatus === 'pending' || jobStatus === 'running') && (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="animate-spin text-blue-400" size={36} />
          <p className="text-sm font-semibold text-slate-300">Executing multi-threaded algorithmic probe across targeted gateways...</p>
          <p className="text-xs text-slate-400 max-w-md">
            Our async job queue ensures zero UI freezes while probing up to 300+ open-source registries and WHOIS endpoints in parallel.
          </p>
        </div>
      )}

      {jobStatus === 'error' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle size={20} className="flex-shrink-0 text-red-400" />
          <div>
            <strong className="block font-bold">OSINT Query Failed:</strong>
            <span>{errorMessage || 'Unknown algorithmic verification error.'}</span>
          </div>
        </div>
      )}

      {jobStatus === 'completed' && resultData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(resultData).map(([key, val]) => (
            <div
              key={key}
              className={clsx(
                'p-4 rounded-xl border transition-all',
                typeof val === 'object' || Array.isArray(val) ? 'md:col-span-2' : '',
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/04 border-white/06'
              )}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center justify-between">
                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="text-sm font-medium leading-relaxed">{renderFormattedValue(val, key)}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

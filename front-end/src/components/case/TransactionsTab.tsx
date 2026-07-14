import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, AlertTriangle, TrendingUp, Database } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Props { caseId: string }

const BANK_TEMPLATES = ['SBI (State Bank of India)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Generic CSV'];

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export const TransactionsTab: React.FC<Props> = ({ caseId }) => {
  const { t } = useTranslation();
  const { transactions, transactionsLoaded, importTransactions } = useCaseStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('SBI (State Bank of India)');
  const [importing, setImporting] = useState(false);

  const caseTxs = transactions.filter((tx) => tx.caseId === caseId);
  const totalAmount = caseTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const suspiciousCount = caseTxs.filter((tx) => tx.suspicious).length;

  const handleImport = async () => {
    setImporting(true);
    await importTransactions(caseId);
    setImporting(false);
    setShowImportModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          id="import-csv-btn"
          onClick={() => setShowImportModal(true)}
          className="btn-accent"
        >
          <Upload size={15} />
          {t('transactions.importCSV')}
        </button>

        {transactionsLoaded && (
          <>
            <div className="stat-card px-4 py-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-amber-400" />
              <div>
                <div className="text-xs text-white/40">{t('transactions.totalAmount')}</div>
                <div className="text-sm font-bold text-white">{formatINR(totalAmount)}</div>
              </div>
            </div>
            <div className="stat-card px-4 py-2 flex items-center gap-2">
              <Database size={14} className="text-blue-400" />
              <div>
                <div className="text-xs text-white/40">{t('transactions.totalTx')}</div>
                <div className="text-sm font-bold text-white">{caseTxs.length}</div>
              </div>
            </div>
            <div className="stat-card px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <div>
                <div className="text-xs text-white/40">Suspicious</div>
                <div className="text-sm font-bold text-red-400">{suspiciousCount}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transactions Table */}
      {transactionsLoaded && caseTxs.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>{t('transactions.date')}</th>
                  <th>{t('transactions.sender')}</th>
                  <th>{t('transactions.receiver')}</th>
                  <th style={{ textAlign: 'right' }}>{t('transactions.amount')}</th>
                  <th>{t('transactions.narration')}</th>
                  <th style={{ textAlign: 'center' }}>{t('transactions.suspicious')}</th>
                </tr>
              </thead>
              <tbody>
                {caseTxs.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={clsx(
                      tx.suspicious ? 'bg-red-500/8' : 'hover:bg-white/[0.03]',
                      'transition-colors'
                    )}
                  >
                    <td className="text-white/25 text-xs font-mono">{i + 1}</td>
                    <td>
                      <span className="font-mono text-xs text-white/55 whitespace-nowrap">{tx.date}</span>
                    </td>
                    <td>
                      <span
                        className="inline-block font-mono text-xs px-2 py-0.5 rounded-md text-blue-300 max-w-[160px] truncate"
                        style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                        title={tx.sender}
                      >
                        {tx.sender}
                      </span>
                    </td>
                    <td>
                      <span
                        className="inline-block font-mono text-xs px-2 py-0.5 rounded-md text-purple-300 max-w-[160px] truncate"
                        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.18)' }}
                        title={tx.receiver}
                      >
                        {tx.receiver}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={clsx(
                        'font-bold text-sm tabular-nums',
                        tx.suspicious ? 'text-red-400' : 'text-white'
                      )}>
                        {formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="text-white/55 text-xs" style={{ maxWidth: 180 }}>
                      <span className="block truncate" title={tx.narration}>{tx.narration}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {tx.suspicious ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                          <AlertTriangle size={10} />{t('transactions.yes')}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">{t('transactions.no')}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : !transactionsLoaded ? (
        <div className="text-center py-16 glass-card">
          <Database size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-sm">No transactions imported yet.</p>
          <p className="text-white/25 text-xs mt-1">Click "Import CSV" to load bank statement data.</p>
        </div>
      ) : null}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !importing && setShowImportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-modal w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold">{t('transactions.importCSV')}</h3>
                {!importing && (
                  <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <div className="drop-zone mb-4 cursor-default">
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-amber-400" />
                  <p className="text-sm text-white/60">bank_statement_May2026.csv</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Ready to import (156 KB)
                  </p>
                </div>
              </div>

              {/* Bank Template Selector */}
              <div className="mb-4">
                <label className="form-label">{t('transactions.selectTemplate')}</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="form-input"
                >
                  {BANK_TEMPLATES.map((t) => (
                    <option key={t} value={t} style={{ background: '#0f1d3d' }}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Column Mapping Preview */}
              <div className="mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                {/* header */}
                <div
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Database size={13} className="text-blue-400" />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Column Mapping Preview</span>
                </div>
                {/* rows */}
                <div className="divide-y" style={{ background: 'rgba(10,20,50,0.6)' }}>
                  {[
                    ['Date',      'Transaction Date', 'text-cyan-300',   'rgba(6,182,212,0.12)'],
                    ['Amount',    'Debit Amount',     'text-amber-300',  'rgba(245,158,11,0.12)'],
                    ['Sender',    'Account From',     'text-blue-300',   'rgba(59,130,246,0.12)'],
                    ['Receiver',  'Account To',       'text-purple-300', 'rgba(168,85,247,0.12)'],
                    ['Narration', 'Description',      'text-green-300',  'rgba(34,197,94,0.12)'],
                  ].map(([field, col, colClass, colBg]) => (
                    <div
                      key={field}
                      className="flex items-center justify-between px-3 py-2"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      {/* field name pill */}
                      <span
                        className="text-xs font-semibold text-white/90 px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {field}
                      </span>
                      {/* arrow */}
                      <span className="text-white/25 text-xs mx-2">→</span>
                      {/* mapped column pill */}
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md ${colClass}`}
                        style={{ background: colBg, border: `1px solid ${colBg.replace('0.12', '0.28')}` }}
                      >
                        {col}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {importing && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm text-blue-300">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    {t('transactions.processing')}
                  </div>
                  <div className="risk-bar-wrapper">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.3, ease: 'easeInOut' }}
                      style={{ background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563eb)', color: 'white' }}
              >
                {importing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('transactions.processing')}</>
                ) : (
                  <><Upload size={15} /> {t('transactions.import')}</>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

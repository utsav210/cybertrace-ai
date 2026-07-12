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
    await importTransactions();
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
                  <th>#</th>
                  <th>{t('transactions.date')}</th>
                  <th>{t('transactions.sender')}</th>
                  <th>{t('transactions.receiver')}</th>
                  <th>{t('transactions.amount')}</th>
                  <th>{t('transactions.narration')}</th>
                  <th>{t('transactions.suspicious')}</th>
                </tr>
              </thead>
              <tbody>
                {caseTxs.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(tx.suspicious && 'bg-red-500/5')}
                  >
                    <td className="text-white/30 text-xs">{i + 1}</td>
                    <td className="font-mono text-xs text-white/60">{tx.date}</td>
                    <td>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md text-blue-300"
                        style={{ background: 'rgba(59,130,246,0.1)' }}>
                        {tx.sender}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                        {tx.receiver}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-white">{formatINR(tx.amount)}</span>
                    </td>
                    <td className="text-white/50 text-xs max-w-[140px] truncate">{tx.narration}</td>
                    <td>
                      {tx.suspicious ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                          <AlertTriangle size={11} /> {t('transactions.yes')}
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
              <div className="mb-5 p-3 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-white/40 mb-2 font-semibold">Column Mapping Preview:</div>
                {[['Date', 'Transaction Date'], ['Amount', 'Debit Amount'], ['Sender', 'Account From'], ['Receiver', 'Account To'], ['Narration', 'Description']].map(([field, col]) => (
                  <div key={field} className="flex justify-between py-0.5">
                    <span className="text-white/50">{field}</span>
                    <span className="text-amber-400 font-mono">{col}</span>
                  </div>
                ))}
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

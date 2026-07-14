import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, File, Table, Download, Eye, X, CheckCircle, Hash
} from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import type { Evidence } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { caseId: string }

const OCR_SAMPLE = `शिकायत बयान - Complaint Statement

दिनांक: 1 मई 2026 / Date: 1 May 2026
थाना: साइबर क्राइम ब्रांच, अहमदाबाद

शिकायतकर्ता का नाम: विक्रम देसाई / Complainant Name: Vikram Desai
मोबाइल नंबर: +91 98765 43210
ईमेल: vikram@email.com
UPI ID: victim@upi

विवरण: दिनांक 01/05/2026 को एक अज्ञात व्यक्ति ने SBI अधिकारी बनकर KYC अपडेट के नाम पर ₹2,50,000 की धोखाधड़ी की।
Description: On 01/05/2026, an unknown person posing as SBI officer (Rajesh Kumar) committed fraud of ₹2,50,000 under pretext of KYC update.

Account Number: 12345678901 | IFSC: SBIN0001234
Fraudster UPI: fraudster@upi

Total Loss: ₹2,50,000
Signature: Vikram Desai`;

const FileIcon: React.FC<{ type: Evidence['fileType'] }> = ({ type }) => {
  if (type === 'pdf') return <FileText size={18} className="text-red-400" />;
  if (type === 'csv') return <Table size={18} className="text-green-400" />;
  return <File size={18} className="text-blue-400" />;
};

export const EvidenceTab: React.FC<Props> = ({ caseId }) => {
  const { t } = useTranslation();
  const { evidence, uploadEvidence } = useCaseStore();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showOcr, setShowOcr] = useState<string | null>(null);

  const caseEvidence = evidence.filter((e) => e.caseId === caseId);

  const simulateUpload = async (file: File) => {
    const id = `ev-up-${Date.now()}`;
    // Show initial progress indicator
    setUploadProgress((prev) => ({ ...prev, [id]: 10 }));
    
    // Upload file to Python backend
    await uploadEvidence(caseId, file);
    
    setUploadProgress((prev) => ({ ...prev, [id]: 100 }));
    await new Promise((r) => setTimeout(r, 200));
    setUploadProgress((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const onDrop = useCallback((accepted: File[]) => {
    accepted.forEach((f) => simulateUpload(f));
  }, [caseId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [], 'image/*': [], 'text/csv': [], 'application/vnd.ms-excel': [] },
    multiple: true,
  });

  const evInProgress = Object.keys(uploadProgress);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Upload size={28} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t('evidence.dragDrop')}</p>
            <p className="text-xs text-white/40 mt-0.5">{t('evidence.orBrowse')}</p>
          </div>
          <p className="text-xs text-white/30">{t('evidence.supported')}</p>
          {isDragActive && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-amber-400 text-sm font-semibold"
            >
              Drop to upload!
            </motion.p>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {evInProgress.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm text-blue-300">Uploading & processing evidence...</span>
            </div>
            <div className="risk-bar-wrapper">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #2563eb, #60a5fa)', width: `${uploadProgress[id] || 0}%` }}
                animate={{ width: `${uploadProgress[id] || 0}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-white/30 mt-1">{uploadProgress[id] || 0}%</p>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Evidence List */}
      {caseEvidence.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Uploaded Files ({caseEvidence.length})
          </h3>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('evidence.fileName')}</th>
                  <th>{t('evidence.type')}</th>
                  <th>{t('evidence.size')}</th>
                  <th>OCR Status</th>
                  <th>{t('evidence.uploaded')}</th>
                  <th>{t('evidence.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {caseEvidence.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileIcon type={ev.fileType} />
                        <div>
                          <div className="font-medium text-sm">{ev.fileName}</div>
                          <div className="text-xs text-white/30 font-mono">{ev.hash.slice(0, 18)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs uppercase font-mono text-white/50">{ev.fileType}</span>
                    </td>
                    <td className="text-white/50 text-sm">{ev.fileSize}</td>
                    <td>
                      {ev.ocrStatus === 'completed' && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle size={12} /> Complete
                        </span>
                      )}
                      {ev.ocrStatus === 'processing' && (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                          {t('evidence.processing')}
                        </span>
                      )}
                      {ev.ocrStatus === 'pending' && (
                        <span className="text-xs text-white/30">Pending</span>
                      )}
                    </td>
                    <td className="text-white/40 text-xs">
                      {new Date(ev.uploadedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {ev.ocrText && (
                          <button
                            onClick={() => setShowOcr(ev.id)}
                            className="btn-info"
                          >
                            <Eye size={12} /> {t('evidence.ocrPreview')}
                          </button>
                        )}
                        <button className="btn-success">
                          <Download size={12} /> {t('evidence.download')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-white/30">
          <Upload size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('evidence.noEvidence')}</p>
        </div>
      )}

      {/* OCR Preview Modal */}
      <AnimatePresence>
        {showOcr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowOcr(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-modal w-full max-w-2xl relative z-10 p-6 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">{t('evidence.ocrPreview')}</h3>
                <button onClick={() => setShowOcr(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <pre className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed font-mono p-4 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {evidence.find((e) => e.id === showOcr)?.ocrText}
                </pre>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Hash size={14} className="text-white/30" />
                <span className="text-xs text-white/30 font-mono">
                  {evidence.find((e) => e.id === showOcr)?.hash}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

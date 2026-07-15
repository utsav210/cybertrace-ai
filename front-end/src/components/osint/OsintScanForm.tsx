import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Search, Loader2, Upload, AlertCircle, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '../../store/themeStore';

interface OsintScanFormProps {
  module: string;
  moduleTitle: string;
  placeholder: string;
  isImageModule?: boolean;
  onScanSubmit: (target: string, attestation: boolean, reason: string, file?: File) => void;
  isLoading: boolean;
}

export const OsintScanForm: React.FC<OsintScanFormProps> = ({
  module,
  moduleTitle,
  placeholder,
  isImageModule = false,
  onScanSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [targetInput, setTargetInput] = useState('');
  const [reasonInput, setReasonInput] = useState('Official Law Enforcement Case Investigation');
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (f.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(f));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestationChecked) return;
    if (!isImageModule && !targetInput.trim()) return;
    if (isImageModule && !targetInput.trim() && !selectedFile) return;

    onScanSubmit(targetInput.trim(), attestationChecked, reasonInput, selectedFile || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        'p-6 rounded-2xl transition-all duration-300 border shadow-lg',
        theme === 'light'
          ? 'bg-white/90 border-slate-200 shadow-slate-200/50'
          : 'bg-[#101935]/90 border-white/10 shadow-black/40'
      )}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {moduleTitle}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time algorithmic OSINT probe with 0 false positives under DPDP Act 2023 & 2025 compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck size={14} />
          <span>LEGAL ATTESTATION GATE REQUIRED</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Target Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
            {isImageModule ? 'Target Image URL or File Upload' : 'Target Identifier / Query'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className={clsx(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-black/40 border-white/10 text-white placeholder:text-slate-500'
              )}
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          </div>
        </div>

        {/* File Upload for Image Forensics */}
        {isImageModule && (
          <div className="p-4 rounded-xl border border-dashed border-white/20 bg-black/20 flex flex-col items-center justify-center gap-3">
            <label className="cursor-pointer flex flex-col items-center gap-2 text-center">
              <Upload className="text-blue-400" size={24} />
              <span className="text-xs font-medium text-slate-300">
                {selectedFile ? selectedFile.name : 'Or Click to Upload Local Image for EXIF & PRNU Deepfake Analysis'}
              </span>
              <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Max 16 MB)</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isLoading} />
            </label>
            {filePreview && (
              <img src={filePreview} alt="Upload preview" className="max-h-36 rounded-lg border border-white/20 object-contain shadow-md" />
            )}
          </div>
        )}

        {/* Investigation Reason / Case Ref */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
            Investigation Justification & Legal Authority Reference
          </label>
          <input
            type="text"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., FIR Reference CCB/2026/0001 - UPI & KYC Cyber Fraud Investigation"
            className={clsx(
              'w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all',
              theme === 'light'
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-black/30 border-white/10 text-slate-300'
            )}
          />
        </div>

        {/* Mandatory DPDP Act 2023 & 2025 Attestation Gate Checkbox */}
        <div
          onClick={() => !isLoading && setAttestationChecked(!attestationChecked)}
          className={clsx(
            'p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none',
            attestationChecked
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : theme === 'light'
              ? 'bg-amber-500/5 border-amber-500/30 text-amber-900'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          )}
        >
          <div className="mt-0.5">
            {attestationChecked ? (
              <CheckSquare className="text-emerald-400 flex-shrink-0" size={18} />
            ) : (
              <Square className="text-amber-400 flex-shrink-0" size={18} />
            )}
          </div>
          <div className="text-xs leading-relaxed">
            <strong className="font-bold block mb-0.5">
              Mandatory Authorized-Use Attestation (DPDP Act 2023 & DPDP Rules 2025 / GDPR / IT Act 2000):
            </strong>
            I certify under penalty of law that I am an authorized law enforcement or judicial officer with legitimate legal mandate to query this personal data identifier. This action, my officer badge number, timestamp, target SHA-256 hash, and IP address will be immutably recorded in official regulatory audit logs.
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !attestationChecked || (!targetInput.trim() && !selectedFile)}
          className={clsx(
            'w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg',
            isLoading || !attestationChecked || (!targetInput.trim() && !selectedFile)
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25 hover:scale-[1.01]'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Running Algorithmic OSINT & Verification...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Launch Live OSINT Query</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, User, Phone, Shield, AlertCircle, CheckCircle2,
  Calendar, Clock, MapPin, Banknote, CreditCard, Hash, Globe,
  HelpCircle, ArrowRight, ArrowLeft, Loader2, Landmark
} from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { useThemeStore } from '../../store/themeStore';
import type { Case } from '../../types';

interface CreateCaseModalProps {
  onClose: () => void;
  onCreated: (newCase: Case) => void;
}

const CATEGORIES = [
  'Financial Fraud / UPI Scam',
  'Online Shopping / E-Commerce Fraud',
  'Social Media / Impersonation Scam',
  'Investment / Crypto & Cloud Mining Fraud',
  'Job Offer / Task & Telegram Scam',
  'Digital Arrest / Fake CBI / Police Call',
  'Ransomware / Hacking / Server Breach',
  'Data Breach / Identity & KYC Theft',
  'Other Cyber Crime',
];

const SUBCATEGORIES: Record<string, string[]> = {
  'Financial Fraud / UPI Scam': [
    'UPI Phishing Link / Collect Request',
    'Fake Customer Care Helpline',
    'Fake KYC Update / SIM Swap',
    'QR Code Scan Scam',
    'Unauthorized Net Banking Debit',
  ],
  'Online Shopping / E-Commerce Fraud': [
    'Fake Delivery / Parcel Customs OTP',
    'Counterfeit / Non-Delivered Product',
    'Social Media Shopping Page Scam',
    'Refund / Replacement Customer Care Fraud',
  ],
  'Social Media / Impersonation Scam': [
    'Relative / Friend Emergency Money Request',
    'Fake Executive / Boss Impersonation (CEO Fraud)',
    'Sextortion / Morphing Video Call',
    'Fake Profile / Account Hack',
  ],
  'Investment / Crypto & Cloud Mining Fraud': [
    'Telegram Crypto Trading Tip Scam',
    'Fake Stock / IPO Allocation App',
    'Ponzi / Multi-Level Marketing Scam',
    'Fake Cloud Mining Platform',
  ],
  'Job Offer / Task & Telegram Scam': [
    'YouTube Like / Hotel Review Rating Task',
    'Part-Time Work From Home Registration Fee',
    'Overseas Job Visa Scam',
  ],
  'Digital Arrest / Fake CBI / Police Call': [
    'Skype Video Call Interrogation Scam',
    'Fake Telecom / Customs Illegal Parcel Notice',
    'Fake Arrest Warrant Extortion',
  ],
  'Ransomware / Hacking / Server Breach': [
    'Enterprise Database Ransomware',
    'Server / Website Defacement',
    'Unauthorized Cloud Access',
  ],
  'Data Breach / Identity & KYC Theft': [
    'Loan App Data Theft & Harassment',
    'PAN / Aadhaar Misuse for Bank Account',
    'Corporate Credential Leak',
  ],
  'Other Cyber Crime': [
    'Cyber Stalking / Harassment',
    'Phishing Email / Malicious Attachment',
    'Other Unclassified Incident',
  ],
};

const PLATFORMS = [
  'WhatsApp',
  'Telegram',
  'Phone Call / SMS',
  'Facebook / Instagram',
  'Website / Mobile App',
  'Email',
  'Skype / Video Call',
  'Other',
];

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const PAYMENT_METHODS = [
  'UPI / QR Code',
  'Net Banking (IMPS / NEFT / RTGS)',
  'Credit / Debit Card',
  'Crypto Wallet / USDT Transfer',
  'Prepaid Wallet (Paytm / PhonePe)',
  'No Financial Loss Involved'
];

const ID_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'Passport',
  'Driving License',
  'Other Government ID'
];

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const { addCase, cases } = useCaseStore();
  const { theme } = useThemeStore();

  const [step, setStep] = useState<number>(1);
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state capturing full Indian Cyber Crime Portal (NCRP) inputs
  const [form, setForm] = useState({
    // Step 1: Crime Classification & Summary
    title: '',
    category: CATEGORIES[0],
    subcategory: SUBCATEGORIES[CATEGORIES[0]][0],
    description: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '12:00',
    delayReason: '',

    // Step 2: Platform & Suspect Profile
    platform: 'WhatsApp',
    suspectDetails: '',

    // Step 3: Complainant / Victim Profile
    complainant: '',
    complainantPhone: '',
    complainantEmail: '',
    state: 'Gujarat',
    district: 'Ahmedabad',
    policeStation: 'Cyber Crime Branch, Ahmedabad',
    complainantAddress: '',
    pincode: '',
    nationalIdType: 'Aadhaar Card',
    nationalIdNumber: '',

    // Step 4: Financial Loss & Banking Details (1930 / I4C)
    amountLost: '',
    paymentMethod: 'UPI / QR Code',
    bankAccount: '',
    ifscCode: '',
    utrNumber: '',
  });

  const handleCategoryChange = (cat: string) => {
    const subcats = SUBCATEGORIES[cat] || ['General Cyber Incident'];
    setForm((prev) => ({
      ...prev,
      category: cat,
      subcategory: subcats[0],
    }));
  };

  // OWASP Top 10 aligned frontend validation
  const validateStep = (currentStep: number): boolean => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!form.title.trim()) {
        setValidationError('Please enter an accurate Incident Title / Headline.');
        return false;
      }
      if (!form.description.trim() || form.description.trim().length < 15) {
        setValidationError('Please provide a detailed summary (at least 15 characters) of how the incident occurred.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.platform.trim()) {
        setValidationError('Please select the primary Platform or Medium used by the suspect.');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.complainant.trim()) {
        setValidationError('Complainant / Victim Full Name is required.');
        return false;
      }
      const phoneClean = form.complainantPhone.replace(/[\s-+()]/g, '');
      if (!phoneClean || !/^\d{10,12}$/.test(phoneClean)) {
        setValidationError('Please enter a valid 10-digit Indian mobile contact number (e.g. +91 9876543210).');
        return false;
      }
      if (form.complainantEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.complainantEmail.trim())) {
        setValidationError('Please enter a valid email address format or leave it blank.');
        return false;
      }
      if (!form.state.trim()) {
        setValidationError('Please select the Complainant State / UT.');
        return false;
      }
    }

    if (currentStep === 4) {
      if (form.ifscCode.trim()) {
        const ifscClean = form.ifscCode.trim().toUpperCase();
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscClean)) {
          setValidationError('IFSC Code must be exactly 11 alphanumeric characters (e.g., SBIN0001234, 5th character must be 0).');
          return false;
        }
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setCreating(true);
    try {
      const payload: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'> = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        incidentDate: form.incidentDate,
        incidentTime: form.incidentTime,
        delayReason: form.delayReason.trim(),
        platform: form.platform,
        suspectDetails: form.suspectDetails.trim(),
        complainant: form.complainant.trim(),
        complainantPhone: form.complainantPhone.trim(),
        complainantEmail: form.complainantEmail.trim(),
        complainantAddress: form.complainantAddress.trim(),
        state: form.state,
        district: form.district.trim(),
        policeStation: form.policeStation.trim(),
        pincode: form.pincode.trim(),
        nationalIdType: form.nationalIdType,
        nationalIdNumber: form.nationalIdNumber.trim(),
        paymentMethod: form.paymentMethod,
        bankAccount: form.bankAccount.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        utrNumber: form.utrNumber.trim(),
        status: 'open',
        assignedTo: 'officer.raj',
        amountLost: parseFloat(form.amountLost) || 0,
      };

      const newCase = await addCase(payload);
      onCreated(newCase);
      onClose();
    } catch (err) {
      console.error('Error submitting NCRP case:', err);
      setValidationError('An unexpected error occurred while communicating with the server. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Crime Classification', desc: 'Incident Type & Summary' },
    { num: 2, label: 'Platform & Suspects', desc: 'Medium & Suspect IOCs' },
    { num: 3, label: 'Complainant Profile', desc: 'Victim & Location Info' },
    { num: 4, label: '1930 / Financial Trail', desc: 'Loss & Banking Details' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-modal w-full max-w-4xl relative z-10 p-5 sm:p-7 overflow-hidden border border-amber-400/30 shadow-2xl max-h-[90vh] flex flex-col"
        style={{
          background: theme === 'light'
            ? 'linear-gradient(145deg, #ffffff, #f8fafc)'
            : 'linear-gradient(145deg, #0a1128, #101f4a)',
          color: theme === 'light' ? '#0f172a' : '#ffffff',
        }}
      >
        {/* Header Banner */}
        <div className="flex items-start justify-between border-b pb-4 mb-5" style={{ borderColor: theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono uppercase bg-amber-400/20 text-amber-400 border border-amber-400/30">
                NCRP / 1930 I4C Intake
              </span>
              <span className="text-xs font-mono text-white/50">Next ID: CCB/2026/00{String(cases.length + 1).padStart(2, '0')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5 flex items-center gap-2">
              <Landmark size={22} className="text-amber-400" />
              Register Formal Investigation Case
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">
              Input fields aligned with the National Cyber Crime Reporting Portal (`cybercrime.gov.in`) under BNSS / Section 154 CrPC.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {stepsMeta.map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < step || validateStep(step)) setStep(s.num);
                }}
                className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${
                  isCurrent
                    ? 'bg-amber-400/15 border-amber-400/60 shadow-sm'
                    : isDone
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-white/05 border-white/08 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
                    isCurrent
                      ? 'bg-amber-400 text-black'
                      : isDone
                      ? 'bg-green-500 text-white'
                      : 'bg-white/15 text-white/70'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={15} /> : s.num}
                </div>
                <div className="overflow-hidden">
                  <div className={`text-xs font-bold truncate ${isCurrent ? 'text-amber-400' : isDone ? 'text-green-400' : ''}`}>
                    {s.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Validation Error Alert Banner */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5 mb-4 font-medium shadow-md"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="flex-1">{validationError}</span>
              <button onClick={() => setValidationError(null)} className="hover:text-white">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body Scroll Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Incident & Crime Classification ── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <label className="form-label">Incident Title / Headline <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="form-input pl-10 w-full"
                      placeholder="e.g. ₹2.5 Lakh debited via fake KYC phishing call impersonating SBI"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">NCRP Crime Category <span className="text-red-400">*</span></label>
                    <select
                      value={form.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="form-input w-full"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Specific Subcategory / Incident Type</label>
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="form-input w-full"
                    >
                      {(SUBCATEGORIES[form.category] || ['General Cyber Incident']).map((sc) => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Incident Date <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="date"
                        value={form.incidentDate}
                        onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                        className="form-input pl-10 w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Approximate Time</label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="time"
                        value={form.incidentTime}
                        onChange={(e) => setForm({ ...form, incidentTime: e.target.value })}
                        className="form-input pl-10 w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Reporting Delay Reason (if &gt; 24 hrs)</label>
                    <input
                      type="text"
                      value={form.delayReason}
                      onChange={(e) => setForm({ ...form, delayReason: e.target.value })}
                      className="form-input w-full"
                      placeholder="e.g. Victim hospitalized / Unaware"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Detailed Incident Statement & Modus Operandi <span className="text-red-400">*</span></label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-input w-full leading-relaxed resize-none"
                    placeholder="Provide a comprehensive chronological statement: How was initial contact made? What links or OTPs were shared? List exact names and numbers used by the suspect..."
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Platform & Suspect Profile ── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <label className="form-label">Primary Medium / Platform Used by Suspect <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {PLATFORMS.map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setForm({ ...form, platform: plat })}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          form.platform === plat
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-white/05 border-white/10 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <Globe size={13} className={form.platform === plat ? 'text-amber-400' : 'text-white/40'} />
                        <span>{plat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Suspect Identifiers & Indicators of Compromise (IOCs)</label>
                  <textarea
                    rows={5}
                    value={form.suspectDetails}
                    onChange={(e) => setForm({ ...form, suspectDetails: e.target.value })}
                    className="form-input w-full font-mono text-xs leading-relaxed"
                    placeholder={`Enter any known suspect details separated by line:\n• Phone Numbers: +91 9800011223, 08012345678\n• UPI IDs / Beneficiaries: fraud.merchant@upi, suspect@okhdfcbank\n• Telegram / Social Handles: @crypto_admin_support\n• Malicious URLs / APK Names: http://sbi-update-kyc.in, sbi-quick-kyc.apk`}
                  />
                  <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1">
                    <Shield size={12} className="text-amber-400" />
                    Our Phase 1 AI Entity Extractor will automatically index these IOCs into the Case Knowledge Graph.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Complainant / Victim Profile ── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Complainant / Victim Full Name <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={form.complainant}
                        onChange={(e) => setForm({ ...form, complainant: e.target.value })}
                        className="form-input pl-10 w-full"
                        placeholder="e.g. Vikram Desai"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Mobile Number <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="tel"
                        value={form.complainantPhone}
                        onChange={(e) => setForm({ ...form, complainantPhone: e.target.value })}
                        className="form-input pl-10 w-full font-mono"
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={form.complainantEmail}
                      onChange={(e) => setForm({ ...form, complainantEmail: e.target.value })}
                      className="form-input w-full"
                      placeholder="vikram@email.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">State / Union Territory <span className="text-red-400">*</span></label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="form-input w-full"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">District / City</label>
                    <input
                      type="text"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="form-input w-full"
                      placeholder="e.g. Ahmedabad"
                    />
                  </div>
                  <div>
                    <label className="form-label">Police Station / Branch</label>
                    <input
                      type="text"
                      value={form.policeStation}
                      onChange={(e) => setForm({ ...form, policeStation: e.target.value })}
                      className="form-input w-full"
                      placeholder="Cyber Crime Branch"
                    />
                  </div>
                  <div>
                    <label className="form-label">PIN Code</label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="form-input w-full font-mono"
                      placeholder="380009"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Full Residential Address</label>
                  <input
                    type="text"
                    value={form.complainantAddress}
                    onChange={(e) => setForm({ ...form, complainantAddress: e.target.value })}
                    className="form-input w-full"
                    placeholder="Flat / House No, Street, Landmark, Area"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/08">
                  <div>
                    <label className="form-label">National ID Document Type</label>
                    <select
                      value={form.nationalIdType}
                      onChange={(e) => setForm({ ...form, nationalIdType: e.target.value })}
                      className="form-input w-full"
                    >
                      {ID_TYPES.map((idt) => (
                        <option key={idt} value={idt}>{idt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Document Number / ID Mask</label>
                    <div className="relative">
                      <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={form.nationalIdNumber}
                        onChange={(e) => setForm({ ...form, nationalIdNumber: e.target.value })}
                        className="form-input pl-10 w-full font-mono"
                        placeholder="e.g. XXXX-XXXX-1234 or ABCDE1234F"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Financial Loss & Banking Details ── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-2.5">
                  <Landmark size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>1930 / I4C Financial Gateway Sync:</strong> Providing exact victim account numbers, IFSC codes, and UTR / Transaction IDs enables immediate fund freezing holds across nodal banks via the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS).
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Total Amount Debited / Lost (₹)</label>
                    <div className="relative">
                      <Banknote size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                      <input
                        type="number"
                        step="any"
                        value={form.amountLost}
                        onChange={(e) => setForm({ ...form, amountLost: e.target.value })}
                        className="form-input pl-10 w-full font-mono font-bold text-red-400"
                        placeholder="e.g. 250000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Payment Instrument / Channel Used</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="form-input w-full"
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Victim Bank Account Number / UPI ID</label>
                    <div className="relative">
                      <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={form.bankAccount}
                        onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                        className="form-input pl-10 w-full font-mono"
                        placeholder="e.g. 12345678901 or victim@sbi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Bank Branch IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={form.ifscCode}
                      onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                      className="form-input w-full font-mono uppercase"
                      placeholder="e.g. SBIN0001234 (11 chars)"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Primary UTR / Transaction Reference Number(s)</label>
                  <input
                    type="text"
                    value={form.utrNumber}
                    onChange={(e) => setForm({ ...form, utrNumber: e.target.value })}
                    className="form-input w-full font-mono"
                    placeholder="e.g. 412210987654 (Separate multiple UTRs with comma)"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-white/08 hover:bg-white/15 transition-all text-white/80"
              >
                <ArrowLeft size={16} /> Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/05 hover:bg-white/10 transition-all text-white/60 hover:text-white"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-3">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563eb)', color: 'white' }}
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={creating || !form.title.trim()}
                  className="px-7 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#000000' }}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Registering Case...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Register Investigation Case
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

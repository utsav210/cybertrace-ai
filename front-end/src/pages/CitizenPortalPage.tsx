import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, PlusCircle, Search, Shield, AlertCircle, CheckCircle2,
  FileText, ArrowRight, Loader2, PhoneCall, RefreshCw, Briefcase, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCaseStore } from '../store/caseStore';
import { useNavigate } from 'react-router-dom';

interface ComplaintTicket {
  id: string;
  createdAt: string;
  complainantName: string;
  complainantPhone: string;
  category: string;
  description: string;
  amountLost: number;
  status: string;
  assignedCaseId?: string | null;
  subcategory?: string;
  incidentDate?: string;
  incidentTime?: string;
  delayReason?: string;
  platform?: string;
  suspectDetails?: string;
  complainantEmail?: string;
  complainantAddress?: string;
  state?: string;
  district?: string;
  policeStation?: string;
  pincode?: string;
  nationalIdType?: string;
  nationalIdNumber?: string;
  paymentMethod?: string;
  bankAccount?: string;
  ifscCode?: string;
  utrNumber?: string;
}

const SAFETY_TIPS = [
  {
    titleEn: 'Digital Arrest / Fake CBI Calls',
    titleHi: 'डिजिटल अरेस्ट / फर्जी CBI कॉल',
    titleGu: 'ડિજિટલ અરેસ્ટ / નકલી CBI કૉલ',
    descEn: 'Police, CBI, or Customs NEVER conduct interrogations or "Digital Arrests" via Skype or WhatsApp video calls. Disconnect immediately and call 1930.',
    descHi: 'पुलिस, CBI या कस्टम कभी भी स्काइप या व्हाट्सएप पर वीडियो कॉल के जरिए "डिजिटल अरेस्ट" नहीं करते। तुरंत फोन काटें और 1930 पर कॉल करें।',
    descGu: 'પોલીસ, સીબીઆઈ કે કસ્ટમ ક્યારેય વૉટ્સઍપ વિડિઓ કૉલ દ્વારા "ડિજિટલ અરેસ્ટ" કરતા નથી. તરત જ કૉલ કાપી નાખો અને 1930 પર જાણ કરો.',
    category: 'Critical Alert',
    color: '#ef4444'
  },
  {
    titleEn: 'Malicious APK & Screen Share Apps',
    titleHi: 'खतरनाक APK और स्क्रीन शेयरिंग ऐप',
    titleGu: 'ખતરનાક APK અને સ્ક્રીન શેરિંગ ઍપ',
    descEn: 'Never install `.apk` files sent via WhatsApp for electricity bill updates or bank KYC. Never install AnyDesk/TeamViewer on strangers\' advice.',
    descHi: 'बिजली बिल या बैंक KYC के नाम पर व्हाट्सएप पर भेजी गई `.apk` फाइलें कभी इंस्टॉल न करें। किसी अनजान के कहने पर AnyDesk न डालें।',
    descGu: 'વીજળી બિલ અથવા બેંક KYC ના નામે વૉટ્સઍપ પર મોકલેલી `.apk` ફાઇલો ક્યારેય ઇન્સ્ટોલ ન કરો.',
    category: 'Cyber Hygiene',
    color: '#f59e0b'
  },
  {
    titleEn: 'UPI Money Request / QR Code Fraud',
    titleHi: 'UPI पिन और QR कोड फ्रॉड',
    titleGu: 'UPI પિન અને QR કોડ છેતરપિંડી',
    descEn: 'Remember: UPI PIN is ONLY required to SEND money from your account. You NEVER need to enter a UPI PIN or scan a QR code to RECEIVE money.',
    descHi: 'याद रखें: UPI पिन केवल पैसे भेजने के लिए चाहिए होता है। पैसे प्राप्त करने के लिए कभी भी पिन डालने या QR कोड स्कैन करने की आवश्यकता नहीं होती।',
    descGu: 'યાદ રાખો: પૈસા મેળવવા માટે ક્યારેય UPI પિન દાખલ કરવાની કે QR કોડ સ્કેન કરવાની જરૂર નથી હોતી.',
    category: 'Financial Safety',
    color: '#3b82f6'
  }
];

export const CitizenPortalPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'intake' | 'track' | 'advisories'>('intake');

  // Intake Form State
  const initialFormState = {
    complainantName: '',
    complainantPhone: '',
    complainantEmail: '',
    complainantAddress: '',
    state: 'Maharashtra',
    district: '',
    policeStation: '',
    pincode: '',
    nationalIdType: 'Aadhaar Card',
    nationalIdNumber: '',
    category: 'Financial Fraud / UPI Scam',
    subcategory: '',
    incidentDate: '',
    incidentTime: '',
    delayReason: '',
    platform: '',
    suspectDetails: '',
    description: '',
    amountLost: '',
    paymentMethod: 'UPI',
    bankAccount: '',
    ifscCode: '',
    utrNumber: ''
  };

  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ComplaintTicket | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tracking & List State
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTicketId, setSearchTicketId] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/portal/complaints');
      if (res.ok) {
        const json = await res.json();
        setComplaints(json);
      }
    } catch (err) {
      console.error('Failed to fetch complaints list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'track') {
      fetchComplaints();
    }
  }, [activeTab]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // OWASP Frontend Validation
    if (!form.complainantName.trim() || !form.complainantPhone.trim() || !form.description.trim()) {
      setValidationError('Please complete all required fields (*).');
      return;
    }

    const phoneRegex = /^[0-9+() -]{10,15}$/;
    if (!phoneRegex.test(form.complainantPhone.trim())) {
      setValidationError('Please enter a valid 10 to 15 digit contact phone number.');
      return;
    }

    if (form.utrNumber.trim() && !/^[A-Za-z0-9]{8,22}$/.test(form.utrNumber.trim())) {
      setValidationError('Please enter a valid 8 to 22 alphanumeric UTR / Transaction Reference Number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/portal/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainantName: form.complainantName,
          complainantPhone: form.complainantPhone,
          complainantEmail: form.complainantEmail,
          complainantAddress: form.complainantAddress,
          state: form.state,
          district: form.district,
          policeStation: form.policeStation,
          pincode: form.pincode,
          nationalIdType: form.nationalIdType,
          nationalIdNumber: form.nationalIdNumber,
          category: form.category,
          subcategory: form.subcategory,
          incidentDate: form.incidentDate,
          incidentTime: form.incidentTime,
          delayReason: form.delayReason,
          platform: form.platform,
          suspectDetails: form.suspectDetails,
          description: form.description,
          amountLost: parseFloat(form.amountLost) || 0,
          paymentMethod: form.paymentMethod,
          bankAccount: form.bankAccount,
          ifscCode: form.ifscCode,
          utrNumber: form.utrNumber
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSubmittedTicket(json.complaint);
        setForm(initialFormState);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setValidationError(errJson.error || 'Server error while registering incident.');
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      setValidationError('Network error: Unable to reach CyberTrace portal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToCase = async (ticketId: string) => {
    setConvertingId(ticketId);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/portal/complaints/${ticketId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: user?.username || 'officer.raj' })
      });
      if (res.ok) {
        const json = await res.json();
        await fetchComplaints();
        // Synchronize central caseStore so CasesListPage table and CaseDetailPage are updated immediately
        await useCaseStore.getState().initializeCases();
        if (json.caseId) {
          navigate(`/cases/${json.caseId}`);
        }
      }
    } catch (err) {
      console.error('Failed to convert to case:', err);
    } finally {
      setConvertingId(null);
    }
  };

  const isCitizenView = !user || user.role === 'citizen';
  const isSearchEmpty = !searchTicketId.trim();

  const filteredTickets = complaints.filter((c) => {
    if (isCitizenView && isSearchEmpty) return false;
    return (
      c.id.toLowerCase().includes(searchTicketId.trim().toLowerCase()) ||
      (!isCitizenView && (c.complainantName.toLowerCase().includes(searchTicketId.trim().toLowerCase()) || c.complainantPhone.includes(searchTicketId.trim())))
    );
  });

  const currentLang = i18n.language || 'en';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-[#0a1128] via-[#101f4a] to-[#0d1838] border border-amber-400/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Shield size={180} />
        </div>

        {/* Floating Controls: Theme Switcher + Multilingual Switcher */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-full backdrop-blur-md">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} className="text-amber-400 animate-spin-slow" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-blue-500" />
                <span>Dark</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          {[
            { code: 'en', label: 'EN', flag: '🇬🇧' },
            { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
            { code: 'gu', label: 'ગુજ', flag: '🟠' }
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                (i18n.language || 'en') === lang.code
                  ? 'bg-amber-400 text-[#0a1128] shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-[#0a1128] shadow-sm">
              {t('portal.badge', 'Citizen & Helpdesk Interop')}
            </span>
            <span className="text-xs text-amber-300/80 font-mono flex items-center gap-1">
              <PhoneCall size={12} /> National Cyber Helpline 1930
            </span>
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
            {t('portal.title', 'NCRP Citizen Assistance Portal')}
          </h1>
          <p className="text-sm md:text-base text-white/75 mt-2 leading-relaxed">
            {t('portal.subtitle', 'Report cybercrime incidents instantly, track I4C ticket status in real time, and enable law enforcement officers to auto-convert citizen reports into active branch investigations.')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 relative z-10 pt-4 border-t border-white/10">
          <button
            onClick={() => { setActiveTab('intake'); setSubmittedTicket(null); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'intake' ? 'btn-accent shadow-lg' : 'bg-white/05 text-white/70 hover:bg-white/10'
            }`}
          >
            <PlusCircle size={16} /> {t('portal.tabIntake', 'Register New Complaint / Intake')}
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'track' ? 'btn-accent shadow-lg' : 'bg-white/05 text-white/70 hover:bg-white/10'
            }`}
          >
            <Search size={16} /> {t('portal.tabTrack', 'Track Ticket Status')} ({complaints.length || 'Live'})
          </button>
          <button
            onClick={() => setActiveTab('advisories')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'advisories' ? 'btn-accent shadow-lg' : 'bg-white/05 text-white/70 hover:bg-white/10'
            }`}
          >
            <Shield size={16} /> {t('portal.tabAdvisories', 'Safety & Hygiene Advisories')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'intake' && (
          <motion.div
            key="intake"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 md:p-8 max-w-3xl mx-auto"
          >
            {submittedTicket ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto text-green-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-extrabold text-white">{t('portal.successTitle', 'Complaint Registered Successfully!')}</h3>
                <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  {t('portal.successText', 'Your incident has been recorded and transmitted to the National Cyber Crime Portal (NCRP). Please save your assigned Case ID below to track real-time progress:')}
                </p>
                <div className="p-5 rounded-2xl bg-black/40 border border-amber-400/30 inline-block px-8 shadow-lg">
                  <div className="text-xs text-white/50 uppercase tracking-widest font-mono font-bold">Assigned Case ID / Ticket Number</div>
                  <div className="text-3xl font-black font-mono text-amber-400 mt-1">{submittedTicket.id}</div>
                  <div className="text-xs text-green-400 font-semibold mt-2">● Status: {submittedTicket.status}</div>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => { setSubmittedTicket(null); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-all"
                  >
                    {t('portal.registerAnother', 'Register Another Incident')}
                  </button>
                  <button
                    onClick={() => {
                      setSearchTicketId(submittedTicket.id);
                      setActiveTab('track');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-accent flex items-center gap-2 shadow-md"
                  >
                    {t('portal.checkStatusBtn', 'Search & Check My Case Status')} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Shield className="text-amber-400" size={20} />
                    {t('portal.formTitle', 'NCRP / 1930 Citizen Incident Registration')}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {t('portal.formSubtitle', 'As per Indian Cyber Crime Portal guidelines, please complete victim profile, incident categorization, suspect IOCs, and financial trail accurate details.')}
                  </p>
                </div>

                {validationError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Registration Validation Alert:</strong>
                      <span>{validationError}</span>
                    </div>
                  </div>
                )}

                {/* Section 1: Victim Profile & Jurisdiction */}
                <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Section 1: Complainant Profile & Jurisdiction
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Complainant Name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Vikram Desai"
                        value={form.complainantName}
                        onChange={(e) => setForm({ ...form, complainantName: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Contact Mobile / Phone <span className="text-red-400">*</span></label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={form.complainantPhone}
                        onChange={(e) => setForm({ ...form, complainantPhone: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g., vikram.desai@gmail.com"
                        value={form.complainantEmail}
                        onChange={(e) => setForm({ ...form, complainantEmail: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Physical Address / Street</label>
                      <input
                        type="text"
                        placeholder="House No, Society, Area"
                        value={form.complainantAddress}
                        onChange={(e) => setForm({ ...form, complainantAddress: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="form-label">State / UT</label>
                      <select
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="form-input w-full text-xs"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Other">Other State / UT</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">District / City</label>
                      <input
                        type="text"
                        placeholder="e.g. Pune / Surat"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="form-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label">Police Station</label>
                      <input
                        type="text"
                        placeholder="Jurisdictional P.S."
                        value={form.policeStation}
                        onChange={(e) => setForm({ ...form, policeStation: e.target.value })}
                        className="form-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="form-label">Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g. 411001"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="form-input w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-white/05">
                    <div>
                      <label className="form-label">National ID Type</label>
                      <select
                        value={form.nationalIdType}
                        onChange={(e) => setForm({ ...form, nationalIdType: e.target.value })}
                        className="form-input w-full"
                      >
                        <option value="Aadhaar Card">Aadhaar Card (XXXX-XXXX-1234)</option>
                        <option value="PAN Card">PAN Card (ABCDE1234F)</option>
                        <option value="Voter ID">Voter ID (EPIC)</option>
                        <option value="Passport">Passport Number</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">National ID Number / Reference</label>
                      <input
                        type="text"
                        placeholder="Enter ID / Document Number"
                        value={form.nationalIdNumber}
                        onChange={(e) => setForm({ ...form, nationalIdNumber: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Incident Classification & Timing */}
                <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Section 2: Incident Classification & Timing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Primary Incident Category <span className="text-red-400">*</span></label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="form-input w-full"
                      >
                        <option value="Financial Fraud / UPI Scam">Financial Fraud / UPI Scam</option>
                        <option value="Online Shopping / Fake OTP">Online Shopping / Fake OTP</option>
                        <option value="Social Media Impersonation">Social Media Impersonation</option>
                        <option value="Investment / Crypto Scam">Investment / Crypto Scam</option>
                        <option value="Digital Arrest / Extortion">Digital Arrest / Extortion</option>
                        <option value="Job Offer / Task Fraud">Job Offer / Task Fraud</option>
                        <option value="Cyber Bullying / Harassment">Cyber Bullying / Harassment</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Subcategory / Modus Operandi</label>
                      <input
                        type="text"
                        placeholder="e.g. APK Malware, Fake KYC Link, Telegram Group"
                        value={form.subcategory}
                        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Date of Incident</label>
                      <input
                        type="date"
                        value={form.incidentDate}
                        onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Time of Incident</label>
                      <input
                        type="time"
                        value={form.incidentTime}
                        onChange={(e) => setForm({ ...form, incidentTime: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Delay Reason (If &gt; 24h)</label>
                      <input
                        type="text"
                        placeholder="Reason for late reporting"
                        value={form.delayReason}
                        onChange={(e) => setForm({ ...form, delayReason: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Platform & Suspect Details */}
                <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Section 3: Platform & Suspect Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Platform / Medium Involved</label>
                      <input
                        type="text"
                        placeholder="e.g. WhatsApp, Telegram, PhonePe, SBI YONO, Instagram"
                        value={form.platform}
                        onChange={(e) => setForm({ ...form, platform: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Suspect Details / IOCs</label>
                      <input
                        type="text"
                        placeholder="Suspect Phone, UPI ID, Bank Acc, or URL"
                        value={form.suspectDetails}
                        onChange={(e) => setForm({ ...form, suspectDetails: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Full Incident Statement & Description <span className="text-red-400">*</span></label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Provide complete chronological summary of the incident: how initial contact was made, transaction sequence, any fraudulent calls received, and exact loss timeline..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="form-input w-full leading-relaxed"
                    />
                  </div>
                </div>

                {/* Section 4: Financial Loss Trail */}
                <div className="space-y-4 p-4 rounded-2xl bg-black/30 border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Section 4: Financial Loss & Banking Trail
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Total Amount Lost (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g., 50000 (Enter 0 if no financial loss)"
                        value={form.amountLost}
                        onChange={(e) => setForm({ ...form, amountLost: e.target.value })}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label">Payment / Transfer Method</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="form-input w-full"
                      >
                        <option value="UPI">UPI (GooglePay / PhonePe / Paytm / BHIM)</option>
                        <option value="Net Banking / NEFT / RTGS">Net Banking / NEFT / RTGS</option>
                        <option value="Credit / Debit Card">Credit / Debit Card</option>
                        <option value="Digital Wallet">Digital Wallet (Mobikwik, Amazon Pay)</option>
                        <option value="Crypto Transfer">Cryptocurrency / USDT Transfer</option>
                        <option value="Other">Other / Non-Financial</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Victim Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="Your debited Account No."
                        value={form.bankAccount}
                        onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                        className="form-input w-full text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="form-label">Bank IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g., SBIN0001234"
                        value={form.ifscCode}
                        onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                        className="form-input w-full text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="form-label">1930 / UTR Reference No.</label>
                      <input
                        type="text"
                        placeholder="12-digit UTR / Txn Reference"
                        value={form.utrNumber}
                        onChange={(e) => setForm({ ...form, utrNumber: e.target.value })}
                        className="form-input w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-400/05 border border-amber-400/20 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Legal & Security Notice:</strong> {t('portal.notice', 'By submitting this intake form, your details are cryptographically hashed and transmitted to the National Cyber Crime Portal (NCRP / I4C gateway) under Section 154 CrPC / BNSS. False complaints are punishable under law.')}
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-xl text-sm font-bold btn-accent flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    {submitting ? t('portal.submitting', 'Registering with NCRP Node...') : t('portal.submitBtn', 'Submit Complaint to Intake Queue')}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {activeTab === 'track' && (
          <motion.div
            key="track"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Search and Refresh */}
            <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Filter by Ticket ID (NCRP-...), Complainant Name or Phone..."
                  value={searchTicketId}
                  onChange={(e) => setSearchTicketId(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl text-xs bg-white/05 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50 w-full"
                />
              </div>
              <button
                onClick={fetchComplaints}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/05 hover:bg-white/10 border border-white/10 text-white/80 flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw size={14} className={loadingList ? 'animate-spin text-amber-400' : ''} />
                Refresh Queue
              </button>
            </div>

            {/* List */}
            {loadingList ? (
              <div className="text-center py-12 glass-card">
                <Loader2 size={32} className="animate-spin mx-auto text-amber-400 mb-2" />
                <p className="text-xs text-white/50 font-mono">Fetching active citizen complaint tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              isCitizenView && isSearchEmpty ? (
                <div className="text-center py-12 glass-card space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-md">
                    <Search size={32} />
                  </div>
                  <h4 className="text-base font-bold text-white">Enter Case ID to Track Status</h4>
                  <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                    To protect citizen privacy and confidentiality, please enter your exact assigned Case ID / Ticket Number (e.g. NCRP-2026-88912) in the search bar above to view the live status of your case.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 glass-card text-white/40">
                  <FileText size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No complaints found matching "{searchTicketId}"</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="glass-card p-5 transition-all hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-amber-400 text-sm">{ticket.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white/80">
                          {ticket.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          ticket.assignedCaseId ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        {isCitizenView ? (
                          <span>Complainant: {ticket.complainantName}</span>
                        ) : (
                          <span>Complainant: {ticket.complainantName} <span className="text-white/40 font-normal">({ticket.complainantPhone})</span></span>
                        )}
                      </p>
                      <p className="text-xs text-white/70 leading-relaxed line-clamp-2 mt-1">
                        "{ticket.description}"
                      </p>
                      {(ticket.platform || ticket.state || ticket.utrNumber || ticket.bankAccount) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/05 text-[11px] text-white/60">
                          {ticket.platform && <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">💻 Platform: <strong className="text-white">{ticket.platform}</strong></span>}
                          {(ticket.state || ticket.district) && <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">📍 Jurisdiction: <strong className="text-white">{ticket.state} {ticket.district}</strong></span>}
                          {ticket.bankAccount && <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">🏦 Acc: <strong className="font-mono text-white">{ticket.bankAccount}</strong></span>}
                          {ticket.utrNumber && <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">🔗 UTR: <strong className="font-mono text-amber-300">{ticket.utrNumber}</strong></span>}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-white/40 font-mono pt-1">
                        <span>Filed: {new Date(ticket.createdAt).toLocaleString('en-IN')}</span>
                        <span>Amount Involved: ₹{Number(ticket.amountLost || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Status Display or Officer Action: Auto-Convert to Case */}
                    {isCitizenView ? (
                      <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/08">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono font-bold">Investigation Status</span>
                        <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                          ticket.assignedCaseId ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          <CheckCircle2 size={14} />
                          {ticket.status}
                        </div>
                        {ticket.assignedCaseId && (
                          <span className="text-[11px] text-green-400 font-mono font-bold">FIR / Active Case: {ticket.assignedCaseId}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/08">
                        {ticket.assignedCaseId ? (
                          <button
                            onClick={() => navigate(`/cases/${ticket.assignedCaseId}`)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Briefcase size={14} /> View Active Case
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConvertToCase(ticket.id)}
                            disabled={convertingId === ticket.id}
                            className="px-4 py-2 rounded-xl text-xs font-bold btn-accent flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/20 disabled:opacity-50"
                          >
                            {convertingId === ticket.id ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                            Convert to Investigation Case
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'advisories' && (
          <motion.div
            key="advisories"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {SAFETY_TIPS.map((tip, idx) => {
              const title = currentLang === 'hi' ? tip.titleHi : currentLang === 'gu' ? tip.titleGu : tip.titleEn;
              const desc = currentLang === 'hi' ? tip.descHi : currentLang === 'gu' ? tip.descGu : tip.descEn;
              return (
                <div key={idx} className="glass-card p-6 flex flex-col justify-between space-y-4 border-t-4" style={{ borderTopColor: tip.color }}>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono" style={{ background: `${tip.color}20`, color: tip.color }}>
                      {tip.category}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-3 leading-snug">{title}</h4>
                    <p className="text-xs text-white/75 mt-2 leading-relaxed">{desc}</p>
                  </div>
                  <div className="pt-4 border-t border-white/06 flex items-center justify-between text-[11px] text-white/40 font-mono">
                    <span>Issued by Cyber Crime Branch</span>
                    <span className="text-amber-400 font-bold">Helpline 1930</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

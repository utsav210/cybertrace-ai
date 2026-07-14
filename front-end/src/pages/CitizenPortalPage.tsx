import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, PlusCircle, Search, Shield, AlertCircle, CheckCircle2,
  FileText, ArrowRight, Loader2, PhoneCall, RefreshCw, Briefcase, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Financial Fraud / UPI Scam');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ComplaintTicket | null>(null);

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
    if (!name.trim() || !phone.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/portal/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainantName: name,
          complainantPhone: phone,
          category,
          amountLost: parseFloat(amount) || 0,
          description
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSubmittedTicket(json.complaint);
        setName('');
        setPhone('');
        setAmount('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
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
        // Redirect or show alert
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

  const filteredTickets = complaints.filter((c) =>
    c.id.toLowerCase().includes(searchTicketId.toLowerCase()) ||
    c.complainantName.toLowerCase().includes(searchTicketId.toLowerCase()) ||
    c.complainantPhone.includes(searchTicketId)
  );

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
                <p className="text-sm text-white/70 max-w-md mx-auto">
                  {t('portal.successText', 'Your incident has been transmitted to the Cyber Crime Branch intake queue. Please save your tracking ticket number below:')}
                </p>
                <div className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 inline-block px-8">
                  <div className="text-xs text-white/50 uppercase tracking-widest font-mono">NCRP Ticket Number</div>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">{submittedTicket.id}</div>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => { setSubmittedTicket(null); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-all"
                  >
                    {t('portal.registerAnother', 'Register Another Incident')}
                  </button>
                  <button
                    onClick={() => setActiveTab('track')}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-accent flex items-center gap-2"
                  >
                    {t('portal.trackQueue', 'Track Ticket Queue')} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="font-bold text-base text-white">{t('portal.formTitle', 'Incident Registration Form')}</h3>
                  <p className="text-xs text-white/50">{t('portal.formSubtitle', 'Fill in accurate details to help law enforcement officers initiate swift triage')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('portal.nameLabel', 'Complainant / Victim Name')} <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Vikram Desai"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('portal.phoneLabel', 'Contact Phone / Mobile')} <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('portal.categoryLabel', 'Incident Category')} <span className="text-red-400">*</span></label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-input w-full bg-[#0f1d3d]"
                    >
                      <option value="Financial Fraud / UPI Scam" style={{ background: '#0f1d3d' }}>Financial Fraud / UPI Scam</option>
                      <option value="Online Shopping / Fake OTP" style={{ background: '#0f1d3d' }}>Online Shopping / Fake OTP</option>
                      <option value="Social Media Impersonation" style={{ background: '#0f1d3d' }}>Social Media Impersonation</option>
                      <option value="Investment / Crypto Scam" style={{ background: '#0f1d3d' }}>Investment / Crypto Scam</option>
                      <option value="Digital Arrest / Extortion" style={{ background: '#0f1d3d' }}>Digital Arrest / Extortion</option>
                      <option value="Job Offer / Task Fraud" style={{ background: '#0f1d3d' }}>Job Offer / Task Fraud</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('portal.amountLabel', 'Total Amount Lost (₹)')}</label>
                    <input
                      type="number"
                      placeholder="e.g., 50000 (0 if none)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('portal.descLabel', 'Incident Description & Statement')} <span className="text-red-400">*</span></label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed summary including dates, bank account names, UPI IDs, phone numbers called from, or website links..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input w-full leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-400/05 border border-amber-400/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Notice:</strong> {t('portal.notice', 'All registered tickets are immediately synchronized with the National Cyber Crime Portal (NCRP) and accessible to assigned desk officers for verification under Section 154 CrPC / BNSS.')}
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl text-sm font-bold btn-accent flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {submitting ? t('portal.submitting', 'Submitting...') : t('portal.submitBtn', 'Submit Complaint to Intake Queue')}
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
              <div className="text-center py-12 glass-card text-white/40">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No complaints found matching filter</p>
              </div>
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
                        Complainant: {ticket.complainantName} <span className="text-white/40 font-normal">({ticket.complainantPhone})</span>
                      </p>
                      <p className="text-xs text-white/70 leading-relaxed line-clamp-2 mt-1">
                        "{ticket.description}"
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-white/40 font-mono pt-1">
                        <span>Filed: {new Date(ticket.createdAt).toLocaleString('en-IN')}</span>
                        <span>Amount Involved: ₹{Number(ticket.amountLost || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Officer Action: Auto-Convert to Case */}
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

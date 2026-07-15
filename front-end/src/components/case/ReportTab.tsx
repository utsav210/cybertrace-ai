import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Printer, X, Globe, Loader2, ClipboardList, Scale, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Case } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { generateFIR_HTML, computeLegalIntelligenceMatrix } from '../../utils/generateFIR';
import { useCaseStore } from '../../store/caseStore';

interface Props { case_: Case }

const REPORT_CONTENT: Record<string, { summary: string; findings: string[]; recommendations: string[] }> = {
  en: {
    summary: `This investigation report pertains to Case No. CCB/2026/0001 – UPI Fraud via Fake KYC, filed by complainant Vikram Desai (Phone: +91 98765 43210, UPI: victim@upi). The complainant suffered a financial loss of ₹2,50,000 through a series of fraudulent UPI transactions between May 1–3, 2026. The fraudster impersonated an SBI Bank officer named "Rajesh Kumar" and induced the victim to share UPI credentials under the pretext of KYC verification.

AI-powered analysis of transaction data identified a complex money laundering network involving 5 accounts across 4 banks (ICICI, SBI, Axis, HDFC). Funds were systematically layered through mule accounts to obfuscate the trail.`,
    findings: [
      'Mule Account mule1@icici (ICICI Bank): High-risk account with Fan-In: 3 senders, Fan-Out: 3 receivers. Risk Score: 82/100.',
      'Circular Transaction Pattern detected: victim@upi → mule1@icici → mule2@sbi → beneficiary@hdfc → victim@upi (₹50,000 on 01/05/2026).',
      'Fund Layering identified: victim@upi → mule1@icici → mule3@axis → beneficiary@hdfc (₹20,000 on 02/05/2026).',
      'Total fraudulent transactions: 8. Total amount: ₹80,000 verified across 3 days.',
      'OCR analysis of complaint statement extracted 7 key entities with 88–99% confidence.',
      'Accused UPI ID: fraudster@upi linked to account 12345678901, IFSC SBIN0001234.',
    ],
    recommendations: [
      'Initiate freezing of mule accounts: mule1@icici, mule2@sbi, mule3@axis, beneficiary@hdfc via respective nodal officers.',
      'Issue Legal Process (Section 91 CrPC) to ICICI Bank, SBI, Axis Bank, HDFC Bank for KYC details of identified mule accounts.',
      'File FIR under IPC Section 420 (Cheating), IT Act Section 66C (Identity Theft) and 66D (Cheating by Personation).',
      'Coordinate with NPCI for flagging UPI IDs: fraudster@upi, mule1@icici, mule2@sbi, mule3@axis, beneficiary@hdfc on TRAI NCPR.',
      'Victim may approach civil court for attachment of fraudulent funds.',
      'Recommend cyber hygiene awareness to victim and filing of consumer complaint with NPCI.',
    ],
  },
  hi: {
    summary: `यह जांच रिपोर्ट मामला संख्या CCB/2026/0001 – नकली KYC के माध्यम से UPI धोखाधड़ी से संबंधित है, जो शिकायतकर्ता विक्रम देसाई (फोन: +91 98765 43210, UPI: victim@upi) द्वारा दर्ज की गई है। शिकायतकर्ता को 1-3 मई 2026 के बीच कई धोखाधड़ी वाले UPI लेनदेन के माध्यम से ₹2,50,000 का वित्तीय नुकसान हुआ।

AI-आधारित लेनदेन विश्लेषण ने 4 बैंकों (ICICI, SBI, Axis, HDFC) में 5 खातों के साथ एक जटिल मनी लॉन्ड्रिंग नेटवर्क की पहचान की।`,
    findings: [
      'मुल खाता mule1@icici (ICICI बैंक): उच्च जोखिम खाता, फैन-इन: 3, फैन-आउट: 3. जोखिम स्कोर: 82/100।',
      'चक्रीय लेनदेन पैटर्न: victim@upi → mule1@icici → mule2@sbi → beneficiary@hdfc → victim@upi (₹50,000, 01/05/2026)।',
      'लेयरिंग (Fund Smurfing): victim@upi → mule1@icici → mule3@axis → beneficiary@hdfc (₹20,000, 02/05/2026)।',
      'कुल धोखाधड़ी लेनदेन: 8। कुल राशि: ₹80,000।',
      'OCR विश्लेषण से 7 प्रमुख संस्थाएं 88-99% विश्वास के साथ निकाली गईं।',
      'आरोपी UPI ID: fraudster@upi, खाता: 12345678901, IFSC: SBIN0001234।',
    ],
    recommendations: [
      'मुल खातों को फ्रीज करें: mule1@icici, mule2@sbi, mule3@axis, beneficiary@hdfc।',
      'ICICI Bank, SBI, Axis Bank, HDFC Bank को धारा 91 CrPC के तहत कानूनी प्रक्रिया जारी करें।',
      'IPC धारा 420, IT Act 66C और 66D के तहत FIR दर्ज करें।',
      'NPCI के साथ समन्वय करें – UPI IDs को TRAI NCPR पर फ्लैग करें।',
      'पीड़ित को साइबर सुरक्षा जागरूकता प्रदान करें।',
    ],
  },
  gu: {
    summary: `આ તપાસ અહેવાલ કેસ નં. CCB/2026/0001 – નકલી KYC દ્વારા UPI છેતરપિંડી સાથે સંબંધિત છે. ફરિયાદીને 1-3 મે 2026 ની વચ્ચે ₹2,50,000 નું નુકસાન થયું.

AI-આધારિત વ્યવહાર વિશ્લેષણે 4 બૅન્ક (ICICI, SBI, Axis, HDFC) ની 5 ખાતા ધરાવતી મની-લૉન્ડ્રિંગ નેટવર્ક ઓળખી.`,
    findings: [
      'મ્યૂલ ખાતું mule1@icici (ICICI Bank): ઉચ્ચ-જોખમ, ફૅન-ઇન: 3, ફૅન-આઉટ: 3. જોખમ સ્કોર: 82/100.',
      'ગોળ વ્યવહાર: victim@upi → mule1@icici → mule2@sbi → beneficiary@hdfc → victim@upi (₹50,000, 01/05/2026).',
      'ફંડ લેઇઅરિંગ: victim@upi → mule1@icici → mule3@axis → beneficiary@hdfc (₹20,000, 02/05/2026).',
      'કુલ છેતરપિંડી વ્યવહારો: 8. કુલ રકમ: ₹80,000.',
      'OCR વિશ્લેષણ: 7 ઓળખ 88-99% વિશ્વાસ સ્તરે.',
      'આરોપી UPI: fraudster@upi, ખાતું: 12345678901, IFSC: SBIN0001234.',
    ],
    recommendations: [
      'મ્યૂલ ખાતા ફ્રિઝ: mule1@icici, mule2@sbi, mule3@axis, beneficiary@hdfc.',
      'ICICI, SBI, Axis, HDFC ને ધ. 91 CrPC હેઠળ કાયદેસર પ્રક્રિયા.',
      'IPC ધ. 420, IT Act ધ. 66C, 66D હેઠળ FIR.',
      'NPCI સાથે સહકાર – UPI IDs ફ્લૅગ.',
      'ફરિયાદીને સાઇબર જાગૃતિ આપો.',
    ],
  },
};

export const ReportTab: React.FC<Props> = ({ case_ }) => {
  const { t, i18n } = useTranslation();

  // localLang: explicit user selection within this Report tab (overrides global i18n).
  // null = "follow global i18n". This is NEVER set inside any useEffect to avoid infinite loops.
  const [localLang, setLocalLang] = useState<'en' | 'hi' | 'gu' | null>(null);

  // Pure derived computation — no useEffect, no state sync, no infinite loop risk.
  const i18nBase = (i18n.language || 'en').slice(0, 2);
  const safeI18nLang: 'en' | 'hi' | 'gu' = (['en', 'hi', 'gu'].includes(i18nBase) ? i18nBase : 'en') as 'en' | 'hi' | 'gu';
  const language: 'en' | 'hi' | 'gu' = localLang ?? safeI18nLang;

  const [generating, setGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFIR, setShowFIR] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 3000));
    setGenerating(false);
    setShowReport(true);
  };

  const handlePrintReport = () => {
    const report = REPORT_CONTENT[language] || REPORT_CONTENT.en;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Investigation Report - ${case_.caseNumber}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
            h1 { color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px; }
            .meta { margin-bottom: 24px; color: #4B5563; font-size: 14px; }
            h2 { color: #1E3A8A; margin-top: 24px; }
            ul { margin-left: 20px; }
            li { margin-bottom: 8px; }
            .footer { margin-top: 40px; border-top: 1px solid #D1D5DB; padding-top: 16px; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <h1>${t('report.title', 'CYBER CRIME BRANCH - INVESTIGATION REPORT')}</h1>
          <div class="meta">
            <strong>${t('case.caseNumber')}:</strong> ${case_.caseNumber}<br/>
            <strong>${t('case.title')}:</strong> ${case_.title}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}<br/>
            <strong>Status:</strong> ${case_.status.toUpperCase()}
          </div>
          <h2>${t('report.executiveSummary', '1. EXECUTIVE SUMMARY')}</h2>
          <p>${report.summary.replace(/\n/g, '<br>')}</p>
          <h2>${t('report.keyFindings', '2. KEY FINDINGS')}</h2>
          <ul>${report.findings.map((f) => `<li>${f}</li>`).join('')}</ul>
          <h2>${t('report.recommendations', '3. RECOMMENDATIONS & NEXT STEPS')}</h2>
          <ul>${report.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>
          <div class="footer">
            Generated by CyberTrace AI Smart Policing Platform · Confidential Investigation Record
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handlePrintFIR = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const html = generateFIR_HTML(case_, language);
    win.document.write(html);
    win.document.close();
  };

  const allAlerts = useCaseStore((s) => s.fraudAlerts);
  const alerts = React.useMemo(() => 
    allAlerts.filter((a) => a.caseId === case_.id), 
  [allAlerts, case_.id]);
  const intelReport = React.useMemo(() => computeLegalIntelligenceMatrix(case_, alerts, language), [case_, alerts, language]);

  const firPreviewLines = [
    'FIRST INFORMATION REPORT (FIR)',
    '(Under Section 173 BNSS, 2023 & IT Act, 2000 - Bharatiya Nagarik Suraksha Sanhita)',
    '─'.repeat(60),
    `District      : Ahmedabad, Gujarat`,
    `Police Station: Cyber Crime Branch, Ahmedabad`,
    `FIR No.       : ${case_.caseNumber}`,
    `Date / Time   : ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`,
    '─'.repeat(60),
    `Complainant   : ${case_.complainant || 'N/A'}`,
    `Contact       : ${case_.complainantPhone || 'N/A'}`,
    '─'.repeat(60),
    `Nature        : ${case_.title}`,
    `Description   : ${case_.description || 'To be ascertained.'}`,
    '─'.repeat(60),
    `Amount Lost   : ${case_.amountLost ? '₹' + Number(case_.amountLost).toLocaleString('en-IN') : 'To be ascertained'}`,
    `Place         : Cyber Space / Online Platform`,
    '─'.repeat(60),
    'AI Statutory Sections & Legal Justifications:',
    ...intelReport.recommendedSections.map((s) => `  • [${s.statute}] ${s.sectionCode} – ${s.title}\n    Justification: ${s.applicabilityReason}\n    Punishment: ${s.punishment}`),
    '─'.repeat(60),
    `Mandatory Seizure: ${intelReport.proceduralMandates.seizureSection}`,
    `Electronic Evidence: ${intelReport.proceduralMandates.evidenceSection}`,
    '─'.repeat(60),
    'I.O.: Inspector Raj Patel (Badge: GUJ/CCB/1042)',
    '      Cyber Crime Branch, Ahmedabad, Gujarat Police',
    '─'.repeat(60),
    '* Click "Print / Download" for full formatted official court FIR *',
  ].join('\n');

  const report = REPORT_CONTENT[language] || REPORT_CONTENT.en;
  const langLabels = { en: 'English', hi: 'Hindi', gu: 'Gujarati' };

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-amber-400" />
          <h3 className="font-semibold">{t('report.language')}</h3>
        </div>
        <div className="flex gap-3">
          {(['en', 'hi', 'gu'] as const).map((lang) => (
            <label key={lang} className={clsx(
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all border',
              language === lang
                ? 'border-amber-400/50 text-amber-400'
                : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
            )}
              style={{ background: language === lang ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)' }}
            >
              <input type="radio" name="language" value={lang} checked={language === lang}
                onChange={() => { setLocalLang(lang); }} className="hidden" />
              <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center',
                language === lang ? 'border-amber-400' : 'border-white/20'
              )}>
                {language === lang && <div className="w-2 h-2 rounded-full bg-amber-400" />}
              </div>
              <span className="text-sm font-medium">{langLabels[lang]}</span>
              {lang === 'hi' && <span>🇮🇳</span>}
              {lang === 'en' && <span>🇬🇧</span>}
              {lang === 'gu' && <span>🟠</span>}
            </label>
          ))}
        </div>
      </div>

      {/* AI Legal Intelligence & Statutory Charge Matrix Card */}
      <div className="glass-card p-5 border border-blue-500/30" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.25), rgba(15,23,42,0.4))' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Scale size={18} className="text-blue-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-white">AI Statutory Offense Mapping &amp; Charge Matrix</h3>
              <p className="text-xs text-blue-300/70">Compliant with Bharatiya Nyaya Sanhita (BNS 2023), IT Act 2000, and BSA 2023</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <ShieldCheck size={13} /> {intelReport.recommendedSections.length} Sections Applied
          </span>
        </div>

        <p className="text-xs text-white/70 mb-4 leading-relaxed font-mono px-3 py-2 rounded bg-black/30 border border-white/05">
          {intelReport.aiAnalysisSummary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {intelReport.recommendedSections.map((sec, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white/05 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-300 font-mono">{sec.sectionCode}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold">{sec.statute.split(' ')[0]}</span>
                </div>
                <h4 className="text-xs font-semibold text-white mb-1">{sec.title}</h4>
                <p className="text-[11px] text-white/60 leading-normal mb-2"><em>Justification:</em> {sec.applicabilityReason}</p>
              </div>
              <div className="text-[10px] text-red-300/90 font-medium pt-1 border-t border-white/05 flex items-center gap-1">
                <AlertTriangle size={11} className="text-red-400" /> {sec.punishment}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-400 flex-shrink-0" />
            <span>Mandatory Evidentiary Protocol: <strong>{intelReport.proceduralMandates.evidenceSection}</strong></span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Section 65B Certified</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          id="generate-report-btn"
          onClick={handleGenerate}
          disabled={generating}
          className="btn-accent disabled:opacity-60"
        >
          {generating ? (
            <><Loader2 size={15} className="animate-spin" /> {t('report.generating')}</>
          ) : (
            <><FileText size={15} /> {t('report.generate')}</>
          )}
        </button>

        <button
          id="draft-fir-btn"
          onClick={() => setShowFIR(true)}
          className="btn-primary"
        >
          <ClipboardList size={15} /> {t('report.draftFIR')}
        </button>

        {showReport && (
          <button onClick={handlePrintReport} className="btn-success flex items-center gap-2">
            <Printer size={15} /> {t('report.download')}
          </button>
        )}
      </div>

      {/* Report Preview */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-amber-400/20 border-b-amber-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">AI is generating your report...</p>
              <p className="text-sm text-white/40 mt-1">Analyzing entities, transactions, and fraud patterns</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            {/* Report Header */}
            <div className="px-6 py-4 border-b border-white/08 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.5), rgba(37,99,235,0.3))' }}>
              <div>
                <h3 className="font-bold text-white">{t('report.title')}</h3>
                <p className="text-xs text-white/40 mt-0.5">{case_.caseNumber} · {langLabels[language]} · {new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                CONFIDENTIAL
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-400" />
                  {t('report.executiveSummary')}
                </h4>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{report.summary}</p>
              </div>

              {/* Findings */}
              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-400" />
                  {t('report.keyFindings')}
                </h4>
                <ul className="space-y-2">
                  {report.findings.map((f, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5 text-sm text-white/70"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-400" />
                  {t('report.recommendations')}
                </h4>
                <ul className="space-y-2">
                  {report.recommendations.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-2.5 text-sm text-white/70"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      {r}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/08 flex items-center justify-between">
                <p className="text-xs text-white/30">Generated by Inspector Raj Patel (GUJ/CCB/1042)</p>
                <button onClick={handlePrintReport} className="btn-success flex items-center gap-2">
                  <Download size={13} /> {t('report.download')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIR Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showFIR && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowFIR(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-modal w-full max-w-2xl relative z-10 p-6 max-h-[85vh] flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base">{t('report.firTitle')}</h3>
                  <button onClick={() => setShowFIR(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <pre className="text-xs text-white/75 whitespace-pre-wrap leading-relaxed font-mono p-4 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {firPreviewLines}
                  </pre>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowFIR(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:bg-white/05 transition-all">
                    {t('modal.cancel')}
                  </button>
                  <button onClick={handlePrintFIR} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 btn-accent">
                    <Download size={14} /> {t('report.firDownload')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

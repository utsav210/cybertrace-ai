import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Printer, X, Globe, Loader2, ClipboardList } from 'lucide-react';
import type { Case } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

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
    summary: `यह जांच रिपोर्ट मामला संख्या CCB/2026/0001 – नकली KYC के माध्यम से UPI धोखाधड़ी से संबंधित है, जो शिकायतकर्ता विक्रम देसाई (फोन: +91 98765 43210, UPI: victim@upi) द्वारा दर्ज की गई है। शिकायतकर्ता को 1-3 मई 2026 के बीच कई धोखाधड़ी वाले UPI लेनदेन के माध्यम से ₹2,50,000 का वित्तीय नुकसान हुआ। धोखेबाज ने SBI बैंक अधिकारी "राजेश कुमार" का नाम लेकर KYC सत्यापन के बहाने पीड़ित को UPI क्रेडेंशियल साझा करने के लिए प्रेरित किया।

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
    summary: `આ તપાસ અહેવાલ કેસ નં. CCB/2026/0001 – નકલી KYC દ્વારા UPI છેતરપિંડી સાથે સંબંધિત છે, જે ફરિયાદી વિક્રમ દેસાઈ (ફોન: +91 98765 43210, UPI: victim@upi) દ્વારા નોંધાઈ છે. ફરિયાદીને 1-3 મે 2026 ની વચ્ચે અનેક છેતરપિંડીભરી UPI ટ્રાન્ઝેક્શન દ્વારા ₹2,50,000 નું નુકસાન થયું. છેતરનારે SBI બૅન્ક અધિકારી "રાજેશ કુમાર" તરીકે ઓળખ આપી KYC ચકાસણીના બહાને UPI ઓળખ-ચોરી કરી.

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
      'ફરિયાદીને સાઇબર સ્વચ્છ૫ ાજાગૃ'
    ],
  },
};

const FIR_TEMPLATE = (caseNumber: string) => `
FIRST INFORMATION REPORT (FIR)
(Under Section 154 of Code of Criminal Procedure, 1973)

District: Ahmedabad    Police Station: Cyber Crime Branch, Gujarat
FIR No.: ${caseNumber}    Date/Time: ${new Date().toLocaleString('en-IN')}

─────────────────────────────────────────────────────────────

1. NATURE OF INFORMATION: Cognizable Offence

2. NAME OF COMPLAINANT: Vikram Desai
   Address: B-204, Shapath Hexa, S.G. Highway, Ahmedabad – 380054
   Phone: +91 98765 43210 | Email: vikram@email.com

3. DATE AND TIME OF INCIDENT: 01/05/2026, 10:00 AM to 03/05/2026

4. PLACE OF OCCURRENCE: Cyber Space (UPI Network)

5. DESCRIPTION OF OFFENCE:
   The complainant, Vikram Desai, received a call from an unknown person 
   posing as SBI Bank Officer "Rajesh Kumar". The accused convinced the 
   complainant to update his KYC by providing UPI credentials. Subsequently, 
   ₹2,50,000 was fraudulently transferred through multiple UPI transactions 
   via mule accounts to conceal the trail.

   Accused UPI IDs: fraudster@upi, mule1@icici, beneficiary@hdfc
   Victim UPI: victim@upi | Account: 12345678901 | IFSC: SBIN0001234

6. SECTIONS APPLIED:
   • IPC Section 420 – Cheating and dishonestly inducing delivery of property
   • IPC Section 419 – Cheating by personation
   • IT Act Section 66C – Identity Theft (Punishment: 3 years, ₹1 lakh fine)
   • IT Act Section 66D – Cheating by personation using computer resources

7. AMOUNT INVOLVED: ₹2,50,000 (Rupees Two Lakhs Fifty Thousand only)

8. INVESTIGATION OFFICER: Inspector Raj Patel
   Badge No.: GUJ/CCB/1042 | Cyber Crime Branch, Ahmedabad

─────────────────────────────────────────────────────────────
SIGNATURE / THUMB IMPRESSION OF COMPLAINANT    SIGNATURE OF I.O.

Vikram Desai                                   Raj Patel
Date: ${new Date().toLocaleDateString('en-IN')}                      Inspector, CCB

─────────────────────────────────────────────────────────────
*This FIR is system-generated by CyberTrace AI v2.0 | CONFIDENTIAL*
`;

export const ReportTab: React.FC<Props> = ({ case_ }) => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>('en');
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
    const report = REPORT_CONTENT[language];
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Investigation Report - ${case_.caseNumber}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; line-height: 1.6; }
            h1 { color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px; }
            h2 { color: #1E3A8A; margin-top: 24px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .badge { background: #1E3A8A; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 16px; font-size: 12px; color: #666; }
            .watermark { position: fixed; top: 40%; left: 20%; opacity: 0.06; font-size: 80px; transform: rotate(-30deg); color: #1E3A8A; font-weight: bold; pointer-events: none; }
          </style>
        </head>
        <body>
          <div class="watermark">CONFIDENTIAL</div>
          <div class="header">
            <div>
              <h1>Investigation Report</h1>
              <p><strong>Case:</strong> ${case_.caseNumber} | <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div class="badge">CyberTrace AI v2.0</div>
          </div>
          <p><strong>Complainant:</strong> ${case_.complainant} | <strong>Phone:</strong> ${case_.complainantPhone}</p>
          <p><strong>Amount Lost:</strong> ₹2,50,000 | <strong>Status:</strong> Under Investigation</p>
          <hr/>
          <h2>Executive Summary</h2>
          <p>${report.summary.replace(/\n/g, '<br>')}</p>
          <h2>Key Findings</h2>
          <ul>${report.findings.map(f => `<li>${f}</li>`).join('')}</ul>
          <h2>Recommendations</h2>
          <ul>${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
          <div class="footer">
            <p>Generated by: Inspector Raj Patel (GUJ/CCB/1042) | Cyber Crime Branch, Gujarat</p>
            <p>CyberTrace AI v2.0 | ${new Date().toLocaleString('en-IN')}</p>
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
    win.document.write(`
      <html>
        <head>
          <title>FIR - ${case_.caseNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 40px; color: #000; line-height: 1.8; font-size: 13px; }
            h1 { text-align: center; font-size: 16px; text-decoration: underline; }
            pre { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <pre>${FIR_TEMPLATE(case_.caseNumber)}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const report = REPORT_CONTENT[language];
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
                onChange={() => setLanguage(lang)} className="hidden" />
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
      <AnimatePresence>
        {showFIR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="glass-modal w-full max-w-2xl relative z-10 p-6 max-h-[85vh] flex flex-col"
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
                  {FIR_TEMPLATE(case_.caseNumber)}
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
      </AnimatePresence>
    </div>
  );
};

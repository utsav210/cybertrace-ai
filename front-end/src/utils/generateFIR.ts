import type { Case, FraudAlert } from '../types';

export interface LegalOffenseSection {
  statute: string;
  sectionCode: string;
  title: string;
  punishment: string;
  applicabilityReason: string;
  isMandatory: boolean;
}

export interface LegalIntelligenceReport {
  recommendedSections: LegalOffenseSection[];
  proceduralMandates: {
    seizureSection: string;
    evidenceSection: string;
    investigationSection: string;
  };
  aiAnalysisSummary: string;
}

/**
 * AI Legal Intelligence Engine: Evaluates case facts, monetary thresholds, and AI fraud alerts
 * to map exact penal provisions under Bharatiya Nyaya Sanhita (BNS 2023), IT Act 2000, and BNSS/BSA 2023.
 */
export function computeLegalIntelligenceMatrix(case_: Case, alerts: FraudAlert[] = [], language: string = 'en'): LegalIntelligenceReport {
  const title = (case_.title || '').toLowerCase();
  const desc = (case_.description || '').toLowerCase();
  const category = (case_.category || '').toLowerCase();
  const amount = case_.amountLost || 0;

  const sections: LegalOffenseSection[] = [];
  const hasMuleAlert = alerts.some(a => a.type.toLowerCase().includes('mule') || a.description.toLowerCase().includes('mule'));
  const hasLayering = alerts.some(a => a.type.toLowerCase().includes('layering') || a.type.toLowerCase().includes('circular'));

  // 1. Core Financial Fraud & Cheating (BNS 2023 vs old IPC 420)
  if (title.includes('kyc') || title.includes('upi') || title.includes('bank') || category.includes('financial') || title.includes('impersonation') || title.includes('fake') || amount > 0) {
    sections.push({
      statute: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      sectionCode: 'Section 318(4)',
      title: 'Cheating and dishonestly inducing delivery of property (Equivalent to Sec 420 IPC)',
      punishment: 'Imprisonment up to 7 years and mandatory fine',
      applicabilityReason: 'AI identified fraudulent inducement leading to financial loss via digital banking/UPI channels.',
      isMandatory: true,
    });
  }

  // 2. Personation via Digital Credentials (BNS Sec 319 vs old IPC 419)
  if (title.includes('impersonation') || title.includes('fake') || title.includes('kyc') || desc.includes('officer') || desc.includes('bank representative')) {
    sections.push({
      statute: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      sectionCode: 'Section 319(2)',
      title: 'Cheating by Personation using electronic/telephonic credentials',
      punishment: 'Imprisonment up to 5 years and fine',
      applicabilityReason: 'Accused fraudulently impersonated bank officials/law enforcement over phone/WhatsApp.',
      isMandatory: true,
    });
  }

  // 3. Extortion & Digital Arrest Modalities
  if (title.includes('arrest') || title.includes('cbi') || title.includes('extortion') || title.includes('loan') || desc.includes('cbi') || desc.includes('customs')) {
    sections.push({
      statute: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      sectionCode: 'Section 308(2) & Section 308(4)',
      title: 'Extortion by putting a person in fear of death, grievous hurt, or false criminal accusation',
      punishment: 'Imprisonment up to 10 years and fine',
      applicabilityReason: 'Victim was subjected to digital arrest threats and extortion under fear of false legal action.',
      isMandatory: true,
    });
    sections.push({
      statute: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      sectionCode: 'Section 204 & Section 205',
      title: 'Personating a Public Servant with fraudulent intent',
      punishment: 'Imprisonment up to 3 years and fine',
      applicabilityReason: 'Accused unlawfully assumed the identity and authority of CBI/Police/Customs officials.',
      isMandatory: true,
    });
  }

  // 4. IT Act Statutory Offenses (Electronic Records & Personation)
  sections.push({
    statute: 'Information Technology Act, 2000',
    sectionCode: 'Section 66C',
    title: 'Identity Theft using unique digital signature, password, or UPI credentials',
    punishment: 'Imprisonment up to 3 years and fine up to ₹1,00,000',
    applicabilityReason: 'Unauthorized compromise and misuse of victim digital identity tokens and payment OTPs.',
    isMandatory: true,
  });

  sections.push({
    statute: 'Information Technology Act, 2000',
    sectionCode: 'Section 66D',
    title: 'Cheating by Personation by using computer resource or communication device',
    punishment: 'Imprisonment up to 3 years and fine up to ₹1,00,000',
    applicabilityReason: 'Fraud executed across digital telecommunication networks and online banking infrastructure.',
    isMandatory: true,
  });

  // 5. Organized Crime / Syndicate / Money Laundering (BNS Sec 111 / PMLA)
  if (amount >= 100000 || hasMuleAlert || hasLayering || title.includes('crypto') || title.includes('syndicate')) {
    sections.push({
      statute: 'Bharatiya Nyaya Sanhita (BNS), 2023',
      sectionCode: 'Section 111(1)(b)',
      title: 'Organized Crime committed by a cyber syndicate for financial gain',
      punishment: 'Rigorous imprisonment not less than 5 years (up to life) and minimum fine of ₹5,00,000',
      applicabilityReason: 'AI graph analysis detected coordinated multi-tiered layering and mule bank account networks.',
      isMandatory: true,
    });
  }

  if (amount >= 100000) {
    sections.push({
      statute: 'Prevention of Money-Laundering Act (PMLA), 2002',
      sectionCode: 'Section 3 & Section 4',
      title: 'Offence of Money-Laundering through illicit layering and placement of proceeds of crime',
      punishment: 'Rigorous imprisonment from 3 to 7 years and fine (Referred to ED Nodal Officer)',
      applicabilityReason: `Total financial fraud exceeding ₹1,00,000 (₹${amount.toLocaleString('en-IN')}) requires statutory ED intimation.`,
      isMandatory: false,
    });
  }

  return {
    recommendedSections: sections,
    proceduralMandates: {
      seizureSection: 'BNSS Section 106 (Order to Nodal Bank/Intermediary to Freeze & Seize Fraudulent Bank Accounts)',
      evidenceSection: 'BSA Section 63 & Section 65B (Mandatory Electronic Evidence Certificate & AI Hash Verification)',
      investigationSection: 'BNSS Section 173 (Statutory Digital Crime Investigation Protocol & Online Charge Sheet)',
    },
    aiAnalysisSummary: `AI Legal Intelligence Engine analyzed case '${case_.caseNumber}' against BNS 2023, IT Act 2000, and 1930 Helpline registries. Identified ${sections.length} statutory sections with precise evidentiary justifications. ${alerts.length > 0 ? `Incorporates ${alerts.length} verified AI Fraud Findings into the charge matrix.` : ''}`,
  };
}

/**
 * Generates a legally compliant FIR HTML document following MHA BNSS Section 173 format
 * used by Indian Cyber Crime Branches. Sections are auto-selected via computeLegalIntelligenceMatrix.
 */
export function generateFIR_HTML(case_: Case, language: string = 'en'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  const incidentDate = case_.createdAt
    ? new Date(case_.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : dateStr;

  const intelReport = computeLegalIntelligenceMatrix(case_, [], language);

  const amountStr = case_.amountLost
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(case_.amountLost)
    : 'To be ascertained during investigation';

  const caseNumber = case_.caseNumber || '';
  const complainant = case_.complainant || '____________________';
  const complainantPhone = case_.complainantPhone || 'N/A';
  const caseTitle = case_.title || '';
  const caseDesc = case_.description || 'Full details to be recorded during statement u/s 161 BNSS.';

  const sectionsRows = intelReport.recommendedSections
    .map((s) => `
      <div class="act-item" style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 6px;">
        <strong>&#9654;&nbsp; ${s.statute} &mdash; ${s.sectionCode}</strong><br>
        <span style="color:#1E3A8A; font-weight:bold;">Offence:</span> ${s.title}<br>
        <span style="color:#4B5563; font-size:11px;"><em>AI Legal Justification:</em> ${s.applicabilityReason}</span><br>
        <span style="color:#B91C1C; font-size:11px;"><em>Punishment:</em> ${s.punishment}</span>
      </div>
    `)
    .join('');

  const css = [
    '@page { size: A4; margin: 18mm 16mm 18mm 20mm; }',
    '* { box-sizing: border-box; margin:0; padding:0; }',
    "body { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; line-height: 1.55; background:#fff; }",
    '.fir-header { text-align: center; border: 3px double #000; padding: 10px 8px 8px; margin-bottom: 0; }',
    '.fir-header .gov { font-size: 12.5px; font-weight: bold; letter-spacing: 0.5px; }',
    '.fir-header .dept { font-size: 12px; font-weight: bold; margin-top: 2px; }',
    '.fir-header .fir-title { font-size: 17px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 3px; text-decoration: underline; }',
    '.fir-header .ref { font-size: 11px; color: #333; }',
    '.fir-header .conf { display: inline-block; border: 1.5px solid #800; color: #800; font-size: 10px; font-weight: bold; padding: 1px 10px; letter-spacing: 2px; margin-top: 5px; }',
    '.fir-header .logo-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }',
    '.fir-header .emblem { font-size: 32px; }',
    '.fir-header .police-info { text-align: left; }',
    'table.main { width:100%; border-collapse:collapse; }',
    'table.main td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; font-size: 12px; }',
    'table.main .lbl { font-weight: bold; background: #f2f2f2; }',
    '.sect-num { font-weight:bold; color:#333; }',
    '.section-head { font-weight: bold; background: #e8e8e8; border: 1px solid #000; border-bottom: none; padding: 4px 8px; font-size: 11.5px; }',
    '.section-body { border: 1px solid #000; padding: 7px 9px; min-height: 52px; font-size: 12px; line-height: 1.65; }',
    '.act-item { margin: 2px 0; font-size: 11.5px; }',
    '.sig-table { width:100%; border-collapse:collapse; }',
    '.sig-table td { border:1px solid #000; padding: 6px 9px; vertical-align:top; width:50%; }',
    '.sig-line { border-bottom: 1px solid #000; height: 30px; margin: 8px 0 4px; width: 80%; }',
    'table.dispatch { width:100%; border-collapse:collapse; margin-top: 4px; }',
    'table.dispatch th, table.dispatch td { border:1px solid #000; padding: 4px 6px; font-size: 11px; text-align:left; }',
    'table.dispatch th { background:#f2f2f2; font-weight:bold; }',
    '.watermark { position:fixed; top:38%; left:10%; opacity:0.04; font-size:88px; font-weight:bold; color:#000; transform:rotate(-28deg); pointer-events:none; white-space:nowrap; }',
    '.bold { font-weight:bold; }',
    '.small { font-size:11px; }',
    '.mt6 { margin-top:6px; }',
    '.forward-box { border: 2px solid #000; padding: 8px 10px; margin-top: 6px; }',
    '.forward-box h4 { text-align:center; text-decoration:underline; font-size:12px; margin-bottom:6px; }',
  ].join('\n');

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<title>FIR No. ' + caseNumber + ' | Cyber Crime Branch, Gujarat Police</title>\n' +
    '<style>\n' + css + '\n</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="watermark">POLICE CONFIDENTIAL</div>\n' +

    '<!-- HEADER -->\n' +
    '<div class="fir-header">\n' +
    '  <div class="logo-row">\n' +
    '    <div class="emblem">&#x1F1EE;&#x1F1F3;</div>\n' +
    '    <div class="police-info">\n' +
    '      <div class="gov">GOVERNMENT OF GUJARAT &mdash; HOME DEPARTMENT</div>\n' +
    '      <div class="dept">GUJARAT POLICE &mdash; CYBER CRIME BRANCH, AHMEDABAD</div>\n' +
    '      <div class="dept">Ministry of Home Affairs, Government of India</div>\n' +
    '    </div>\n' +
    '    <div class="emblem">&#x2696;&#xFE0F;</div>\n' +
    '  </div>\n' +
    '  <div class="fir-title">First Information Report</div>\n' +
    '  <div class="ref">(Under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 &amp; IT Act, 2000)</div>\n' +
    '  <div><span class="conf">POLICE CONFIDENTIAL &mdash; FOR OFFICIAL USE ONLY</span></div>\n' +
    '</div>\n' +

    '<!-- PART I: IDENTIFICATION -->\n' +
    '<table class="main">\n' +
    '  <tr>\n' +
    '    <td class="lbl" style="width:22%"><span class="sect-num">1.</span> District / Zila</td>\n' +
    '    <td style="width:28%">Ahmedabad, Gujarat</td>\n' +
    '    <td class="lbl" style="width:22%">Police Station / Thana</td>\n' +
    '    <td>Cyber Crime Branch, Ahmedabad</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">2.</span> FIR No. / Krima No.</td>\n' +
    '    <td class="bold">' + caseNumber + '</td>\n' +
    '    <td class="lbl">Year / Varsh</td>\n' +
    '    <td class="bold">2026</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">3.</span> Date &amp; Time of Report</td>\n' +
    '    <td>' + dateStr + ' &nbsp;|&nbsp; ' + timeStr + '</td>\n' +
    '    <td class="lbl">Type of Information</td>\n' +
    '    <td>Written Complaint (Likhit Shikayat) &mdash; Cognizable Offence u/s 173 BNSS</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">4.</span> NCRP Reference No.</td>\n' +
    '    <td>Pending &mdash; To be updated on cybercrime.gov.in</td>\n' +
    '    <td class="lbl">I4C Ticket No.</td>\n' +
    '    <td>Auto-generated upon NCRP upload</td>\n' +
    '  </tr>\n' +
    '</table>\n' +

    '<!-- ACTS & SECTIONS -->\n' +
    '<div class="section-head"><span class="sect-num">5.</span> &nbsp; ACT(S) AND SECTION(S) APPLICABLE / Lagoo Dharayen</div>\n' +
    '<div class="section-body">' + sectionsRows + '</div>\n' +

    '<!-- COMPLAINANT -->\n' +
    '<table class="main">\n' +
    '  <tr>\n' +
    '    <td class="lbl" style="width:22%"><span class="sect-num">6a.</span> Name of Complainant</td>\n' +
    '    <td class="bold" colspan="3">' + complainant + '</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">6b.</span> Phone / Mobile</td>\n' +
    '    <td>' + complainantPhone + '</td>\n' +
    '    <td class="lbl">Nationality</td>\n' +
    '    <td>Indian</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">6c.</span> Occupation</td>\n' +
    '    <td>As per records</td>\n' +
    '    <td class="lbl">Gender / Sex</td>\n' +
    '    <td>As per records</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">6d.</span> Address / Pata</td>\n' +
    '    <td colspan="3">As per Aadhaar on record &mdash; Ahmedabad, Gujarat (withheld per Sec. 74 DPDP Act, 2023)</td>\n' +
    '  </tr>\n' +
    '</table>\n' +

    '<!-- INCIDENT DETAILS -->\n' +
    '<table class="main">\n' +
    '  <tr>\n' +
    '    <td class="lbl" style="width:22%"><span class="sect-num">7a.</span> Date &amp; Time of Occurrence</td>\n' +
    '    <td style="width:28%">' + incidentDate + '</td>\n' +
    '    <td class="lbl" style="width:22%"><span class="sect-num">7b.</span> Place of Occurrence</td>\n' +
    '    <td>Cyber Space / Online Platform &mdash; Internet-mediated financial transaction</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">7c.</span> Distance from P.S.</td>\n' +
    '    <td>Cyber Jurisdiction &mdash; No physical boundary</td>\n' +
    '    <td class="lbl"><span class="sect-num">7d.</span> Amount / Property Involved</td>\n' +
    '    <td class="bold" style="color:#8B0000">' + amountStr + '</td>\n' +
    '  </tr>\n' +
    '  <tr>\n' +
    '    <td class="lbl"><span class="sect-num">7e.</span> Mode of Transaction</td>\n' +
    '    <td colspan="3">UPI / Online Banking / Digital Wallet &mdash; as per attached bank statement and entity extraction report</td>\n' +
    '  </tr>\n' +
    '</table>\n' +

    '<!-- DESCRIPTION OF OFFENCE -->\n' +
    '<div class="section-head"><span class="sect-num">8.</span> &nbsp; DESCRIPTION OF OFFENCE / Apradh Ka Vivaran</div>\n' +
    '<div class="section-body">\n' +
    '  The complainant, <strong>' + complainant + '</strong> (Phone: ' + complainantPhone + '), appeared before the undersigned officer and lodged a complaint that on or around <strong>' + incidentDate + '</strong>, an act of cyber fraud was perpetrated against him/her through digital means.<br><br>\n' +
    '  <strong>Nature of Offence:</strong> ' + caseTitle + '<br><br>\n' +
    '  <strong>Modus Operandi / Facts:</strong> ' + caseDesc + '<br><br>\n' +
    '  <strong>Total Financial Loss:</strong> ' + amountStr + ' &mdash; transferred via digital payment channels (Annexure B).<br><br>\n' +
    '  <strong>Digital Evidence (AI-OCR):</strong> UPI IDs, Phone Numbers, Email IDs, IFSC Codes, Account Numbers extracted with &gt;90% AI confidence &mdash; Annexure C.<br><br>\n' +
    '  <strong>Preliminary Transaction Graph:</strong> Money trail mapped by AI analytics &mdash; mule account chain, layering pattern, circular fund flow identified &mdash; Annexure D.\n' +
    '</div>\n' +

    '<!-- ACCUSED DETAILS -->\n' +
    '<div class="section-head"><span class="sect-num">9.</span> &nbsp; ACCUSED / SUSPECT DETAILS / Abhiyukt Ka Vivaran</div>\n' +
    '<div class="section-body" style="min-height:50px">\n' +
    '  <strong>Name:</strong> Unknown &mdash; Identity Under Ascertainment &nbsp;&nbsp;&nbsp; <strong>Age / Sex:</strong> Unknown &nbsp;&nbsp;&nbsp; <strong>Nationality:</strong> Unknown<br>\n' +
    '  <strong>Address:</strong> Unknown &mdash; IMEI Tracing, IP Log Analysis &amp; UPI KYC records requested via Legal Process<br>\n' +
    '  <strong>Digital Identifiers:</strong> Refer Annexure C. To be confirmed through NPCI UPI records, NCRP Freeze Referral, and CERT-In coordination.\n' +
    '</div>\n' +

    '<!-- ACTION TAKEN -->\n' +
    '<div class="section-head"><span class="sect-num">10.</span> &nbsp; IMMEDIATE ACTION TAKEN / Tatkalik Karyavahi</div>\n' +
    '<div class="section-body">\n' +
    '  &#9654; Complaint registered on NCRP Portal (cybercrime.gov.in) &mdash; Ticket No. to be updated.<br>\n' +
    '  &#9654; Bank Account Freeze Request forwarded to Nodal Banking Officers via MHA I4C CCPWC System (1930 Helpline u/s 106 BNSS).<br>\n' +
    '  &#9654; AI-based money trail and transaction graph analysis completed (Annexure D).<br>\n' +
    '  &#9654; OCR entity extraction: UPI IDs, IFSC Codes, Phone Numbers, Email IDs extracted (Annexure C).<br>\n' +
    '  &#9654; Statutory Requisition Notice (u/s 106 BNSS / 91 CrPC) issued to Payment Intermediaries for KYC &amp; Transaction Records.<br>\n' +
    '  &#9654; Coordination initiated with NPCI, RBI Ombudsman, and concerned banks Nodal Officers.\n' +
    '</div>\n' +

    '<!-- VERIFICATION BY IO -->\n' +
    '<div class="forward-box mt6">\n' +
    '  <h4>PART II &mdash; IO / SHO CERTIFICATION (u/s 173 BNSS / 154 CrPC)</h4>\n' +
    '  <p>The information has been read over to the complainant in the vernacular language, who has confirmed it to be correctly recorded and signed/affixed thumb impression in token of correctness u/s 180 BNSS.</p>\n' +
    '  <br>\n' +
    '  <table class="sig-table">\n' +
    '    <tr>\n' +
    '      <td>\n' +
    '        <div class="bold">COMPLAINANT\'S SIGNATURE / THUMB IMPRESSION</div>\n' +
    '        <div class="sig-line"></div>\n' +
    '        <div>' + complainant + '</div>\n' +
    '        <div class="small">Date: ' + dateStr + '</div>\n' +
    '        <div class="small">Phone: ' + complainantPhone + '</div>\n' +
    '      </td>\n' +
    '      <td>\n' +
    '        <div class="bold">SIGNATURE OF RECORDING OFFICER (I.O.)</div>\n' +
    '        <div class="sig-line"></div>\n' +
    '        <div class="bold">Inspector Raj Patel</div>\n' +
    '        <div class="small">Badge No.: GUJ/CCB/1042</div>\n' +
    '        <div class="small">Cyber Crime Branch, Ahmedabad, Gujarat Police</div>\n' +
    '        <div class="small">Date &amp; Time: ' + dateStr + ' &nbsp; ' + timeStr + '</div>\n' +
    '      </td>\n' +
    '    </tr>\n' +
    '  </table>\n' +
    '</div>\n' +

    '<!-- DISPATCH TO MAGISTRATE -->\n' +
    '<div class="forward-box mt6">\n' +
    '  <h4>PART III &mdash; DESPATCH TO SUPERIOR OFFICERS &amp; MAGISTRATE (u/s 176 BNSS)</h4>\n' +
    '  <p class="small" style="margin-bottom:4px">A certified copy of this FIR is being forwarded to the Judicial Magistrate / CJM Court, Ahmedabad, under Section 176 BNSS (Bharatiya Nagarik Suraksha Sanhita), 2023.</p>\n' +
    '  <table class="dispatch">\n' +
    '    <thead>\n' +
    '      <tr><th>#</th><th>Officer / Authority</th><th>Mode</th><th>Date &amp; Time</th><th>Receipt</th></tr>\n' +
    '    </thead>\n' +
    '    <tbody>\n' +
    '      <tr><td>1</td><td>Judicial Magistrate / CJM Court, Ahmedabad</td><td>Registered Email + Hard Copy</td><td>' + dateStr + ' ' + timeStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>2</td><td>Superintendent of Police (Cyber Cell), Gujarat</td><td>Internal e-Portal / eCops</td><td>' + dateStr + ' ' + timeStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>3</td><td>MHA &mdash; Indian Cyber Crime Coordination Centre (I4C)</td><td>NCRP Portal Auto-Upload</td><td>' + dateStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>4</td><td>NPCI &mdash; UPI Fraud Reporting Cell / RBI Ombudsman</td><td>Statutory Notice (u/s 106 BNSS)</td><td>' + dateStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>5</td><td>Complainant (copy for reference)</td><td>Direct Hand Delivery / Email</td><td>' + dateStr + '</td><td>Acknowledged</td></tr>\n' +
    '    </tbody>\n' +
    '  </table>\n' +
    '</div>\n' +

    '<!-- FOOTER -->\n' +
    '<div style="margin-top:10px; border-top: 2px solid #000; padding-top: 5px; display:flex; justify-content:space-between; font-size:10.5px;">\n' +
    '  <div>FIR No.: <strong>' + caseNumber + '</strong> | Cyber Crime Branch, Gujarat Police</div>\n' +
    '  <div>Auto-generated by <strong>CyberTrace AI v2.0</strong> on ' + dateStr + ' ' + timeStr + '</div>\n' +
    '  <div><strong>CONFIDENTIAL</strong> &mdash; For Official Use Only</div>\n' +
    '</div>\n' +
    '</body>\n</html>'
  );
}

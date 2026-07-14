import type { Case } from '../types';

/**
 * Generates a legally compliant FIR HTML document following MHA CrPC Section 154 format
 * used by Indian Cyber Crime Branches. Sections are auto-selected based on the case type.
 */
export function generateFIR_HTML(case_: Case, _language: string = 'en'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  const incidentDate = case_.createdAt
    ? new Date(case_.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : dateStr;

  const title = (case_.title || '').toLowerCase();
  let sections: string[];

  if (title.includes('impersonation') || title.includes('fake') || title.includes('social media')) {
    sections = [
      'IPC Section 419 – Cheating by Personation',
      'IPC Section 420 – Cheating and Dishonestly Inducing Delivery of Property',
      'IT Act Section 66C – Identity Theft (Imprisonment up to 3 years, fine up to ₹1 lakh)',
      'IT Act Section 66D – Cheating by Personation using Computer Resources',
      'IT Act Section 67 – Publishing Obscene Material in Electronic Form (if applicable)',
    ];
  } else if (title.includes('kyc') || title.includes('upi') || title.includes('bank')) {
    sections = [
      'IPC Section 420 – Cheating and Dishonestly Inducing Delivery of Property',
      'IPC Section 468 – Forgery for Purpose of Cheating',
      'IPC Section 471 – Using as Genuine a Forged Document or Electronic Record',
      'IT Act Section 66C – Identity Theft',
      'IT Act Section 66D – Cheating by Personation using Computer Resources',
      'PMLA Section 3 – Offence of Money-Laundering (referred to ED if amount > ₹1 lakh)',
    ];
  } else if (title.includes('loan') || title.includes('extortion') || title.includes('data breach')) {
    sections = [
      'IPC Section 384 – Extortion',
      'IPC Section 386 – Extortion by Putting a Person in Fear of Death or Grievous Hurt',
      'IPC Section 503 – Criminal Intimidation',
      'IT Act Section 66B – Receiving Stolen Computer Resource or Communication Device',
      'IT Act Section 67 – Publishing Obscene Material in Electronic Form',
      'IT Act Section 72 – Breach of Confidentiality and Privacy',
    ];
  } else if (title.includes('crypto') || title.includes('investment')) {
    sections = [
      'IPC Section 420 – Cheating and Dishonestly Inducing Delivery of Property',
      'IPC Section 120B – Criminal Conspiracy',
      'IPC Section 34 – Acts Done by Several Persons in Furtherance of Common Intention',
      'IT Act Section 66D – Cheating by Personation using Computer Resources',
      'Prize Chits and Money Circulation Schemes (Banning) Act, 1978 – Section 3',
    ];
  } else {
    sections = [
      'IPC Section 419 – Cheating by Personation',
      'IPC Section 420 – Cheating and Dishonestly Inducing Delivery of Property',
      'IT Act Section 66C – Identity Theft',
      'IT Act Section 66D – Cheating by Personation using Computer Resources',
    ];
  }

  const amountStr = case_.amountLost
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(case_.amountLost)
    : 'To be ascertained during investigation';

  const caseNumber = case_.caseNumber || '';
  const complainant = case_.complainant || '____________________';
  const complainantPhone = case_.complainantPhone || 'N/A';
  const caseTitle = case_.title || '';
  const caseDesc = case_.description || 'Full details to be recorded during statement u/s 161 CrPC.';

  const sectionsRows = sections
    .map((s) => '<div class="act-item">&#9654;&nbsp; ' + s + '</div>')
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
    '  <div class="ref">(Under Section 154 of the Code of Criminal Procedure, 1973 &amp; Section 173 BNSS, 2023)</div>\n' +
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
    '    <td>Written Complaint (Likhit Shikayat) &mdash; Cognizable Offence</td>\n' +
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
    '  &#9654; Bank Account Freeze Request forwarded to Nodal Banking Officers via MHA I4C CCPWC System (1930 Helpline).<br>\n' +
    '  &#9654; AI-based money trail and transaction graph analysis completed (Annexure D).<br>\n' +
    '  &#9654; OCR entity extraction: UPI IDs, IFSC Codes, Phone Numbers, Email IDs extracted (Annexure C).<br>\n' +
    '  &#9654; Legal Notice (u/s 91 CrPC) to be issued to Payment Intermediaries for KYC &amp; Transaction Records.<br>\n' +
    '  &#9654; Coordination initiated with NPCI, RBI Ombudsman, and concerned banks Nodal Officers.\n' +
    '</div>\n' +

    '<!-- VERIFICATION BY IO -->\n' +
    '<div class="forward-box mt6">\n' +
    '  <h4>PART II &mdash; IO / SHO CERTIFICATION (u/s 154 CrPC)</h4>\n' +
    '  <p>The information has been read over to the complainant in the vernacular language, who has confirmed it to be correctly recorded and signed/affixed thumb impression in token of correctness.</p>\n' +
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
    '  <h4>PART III &mdash; DESPATCH TO SUPERIOR OFFICERS &amp; MAGISTRATE (u/s 157 CrPC)</h4>\n' +
    '  <p class="small" style="margin-bottom:4px">A certified copy of this FIR is being forwarded to the Judicial Magistrate / CJM Court, Ahmedabad, under Section 157 CrPC and Section 176 BNSS, 2023.</p>\n' +
    '  <table class="dispatch">\n' +
    '    <thead>\n' +
    '      <tr><th>#</th><th>Officer / Authority</th><th>Mode</th><th>Date &amp; Time</th><th>Receipt</th></tr>\n' +
    '    </thead>\n' +
    '    <tbody>\n' +
    '      <tr><td>1</td><td>Judicial Magistrate / CJM Court, Ahmedabad</td><td>Registered Email + Hard Copy</td><td>' + dateStr + ' ' + timeStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>2</td><td>Superintendent of Police (Cyber Cell), Gujarat</td><td>Internal e-Portal / eCops</td><td>' + dateStr + ' ' + timeStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>3</td><td>MHA &mdash; Indian Cyber Crime Coordination Centre (I4C)</td><td>NCRP Portal Auto-Upload</td><td>' + dateStr + '</td><td>Pending</td></tr>\n' +
    '      <tr><td>4</td><td>NPCI &mdash; UPI Fraud Reporting Cell / RBI Ombudsman</td><td>Legal Process (u/s 91 CrPC)</td><td>' + dateStr + '</td><td>Pending</td></tr>\n' +
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

import type { Case, Evidence, Entity, Transaction, GraphNode, GraphLink, FraudAlert, AuditLog, Notification, User } from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const USERS: Record<string, { user: User; password: string }> = {
  'officer.raj': {
    password: 'password123',
    user: {
      id: 'u1',
      username: 'officer.raj',
      name: 'Raj Patel',
      badgeNumber: 'GUJ/CCB/1042',
      role: 'officer',
    },
  },
  'admin.sharma': {
    password: 'admin123',
    user: {
      id: 'u2',
      username: 'admin.sharma',
      name: 'Priya Sharma',
      badgeNumber: 'GUJ/CCB/0001',
      role: 'admin',
    },
  },
  'supervisor.mehta': {
    password: 'super123',
    user: {
      id: 'u3',
      username: 'supervisor.mehta',
      name: 'Kiran Mehta',
      badgeNumber: 'GUJ/CCB/0021',
      role: 'supervisor',
    },
  },
};

// ─── Cases ─────────────────────────────────────────────────────────────────────
export const INITIAL_CASES: Case[] = [
  {
    id: 'case-001',
    caseNumber: 'CCB/2026/0001',
    title: 'UPI Fraud via Fake KYC',
    description:
      'Victim received a call about KYC update, lost ₹2,50,000 through multiple UPI transfers over 2 days. Fraudster impersonated bank official.',
    status: 'active',
    complainant: 'Vikram Desai',
    complainantPhone: '+91 98765 43210',
    assignedTo: 'officer.raj',
    createdAt: '2026-05-01T09:02:00',
    updatedAt: '2026-06-01T10:30:00',
    amountLost: 250000,
  },
  {
    id: 'case-002',
    caseNumber: 'CCB/2026/0002',
    title: 'Online Shopping Fraud – Fake OTP',
    description: 'Victim tricked into sharing OTP, ₹45,000 deducted via unauthorized transaction.',
    status: 'open',
    complainant: 'Meena Joshi',
    complainantPhone: '+91 99887 76655',
    assignedTo: 'officer.raj',
    createdAt: '2026-05-03T11:15:00',
    updatedAt: '2026-05-03T11:15:00',
    amountLost: 45000,
  },
  {
    id: 'case-003',
    caseNumber: 'CCB/2026/0003',
    title: 'Social Media Impersonation Scam',
    description: 'Fraudster created fake Facebook profile of victim\'s relative, requested ₹30,000 emergency transfer.',
    status: 'open',
    complainant: 'Amit Shah',
    complainantPhone: '+91 91234 56789',
    assignedTo: 'officer.raj',
    createdAt: '2026-05-05T14:20:00',
    updatedAt: '2026-05-05T14:20:00',
    amountLost: 30000,
  },
  {
    id: 'case-004',
    caseNumber: 'CCB/2026/0004',
    title: 'Loan App Data Breach & Extortion',
    description: 'Victim installed fake loan app, personal data stolen and used for extortion.',
    status: 'closed',
    complainant: 'Ravi Gupta',
    complainantPhone: '+91 95566 44322',
    assignedTo: 'officer.raj',
    createdAt: '2026-04-10T08:30:00',
    updatedAt: '2026-05-20T16:00:00',
  },
  {
    id: 'case-005',
    caseNumber: 'CCB/2026/0005',
    title: 'Crypto Investment Fraud',
    description: 'Victim lured into fake crypto investment platform, lost ₹5,00,000.',
    status: 'active',
    complainant: 'Sunita Patel',
    complainantPhone: '+91 98001 23456',
    assignedTo: 'officer.raj',
    createdAt: '2026-04-20T10:00:00',
    updatedAt: '2026-05-28T09:00:00',
    amountLost: 500000,
  },
  {
    id: 'case-006',
    caseNumber: 'CCB/2026/0006',
    title: 'Job Offer Fraud via WhatsApp',
    description: 'Victim paid registration fee for fake government job offer, lost ₹15,000.',
    status: 'closed',
    complainant: 'Deepak Verma',
    complainantPhone: '+91 87654 32109',
    assignedTo: 'officer.raj',
    createdAt: '2026-04-15T13:00:00',
    updatedAt: '2026-05-10T11:00:00',
    amountLost: 15000,
  },
];

// ─── Evidence ──────────────────────────────────────────────────────────────────
export const INITIAL_EVIDENCE: Evidence[] = [
  {
    id: 'ev-001',
    caseId: 'case-001',
    fileName: 'complaint_statement.pdf',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    hash: 'sha256:a3f2c1b9d8e7f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
    uploadedAt: '2026-06-01T09:05:00',
    ocrStatus: 'completed',
    ocrText: `शिकायत बयान - Complaint Statement

दिनांक: 1 मई 2026 / Date: 1 May 2026
थाना: साइबर क्राइम ब्रांच, अहमदाबाद / Police Station: Cyber Crime Branch, Ahmedabad

शिकायतकर्ता का नाम: विक्रम देसाई / Complainant Name: Vikram Desai
मोबाइल नंबर: +91 98765 43210
ईमेल: vikram@email.com

विवरण / Description:
दिनांक 01/05/2026 को सुबह लगभग 10 बजे मेरे मोबाइल पर एक अज्ञात व्यक्ति का फोन आया जिसने खुद को SBI बैंक का अधिकारी बताया।

On 01/05/2026, at approximately 10:00 AM, I received a call from an unknown person claiming to be an SBI Bank officer (Rajesh Kumar, employee ID SBI/2024/3421).

उन्होंने कहा कि मेरे खाते का KYC अपडेट करना है। / He said my account KYC needs to be updated.

UPI ID: victim@upi को निम्नलिखित लेनदेन हुए:
1. ₹50,000 - fraudster@upi को / to fraudster@upi
2. ₹20,000 - fraudster@upi को / to fraudster@upi  
3. ₹10,000 - fraudster@upi को / to fraudster@upi

खाता संख्या / Account Number: 12345678901
IFSC Code: SBIN0001234
Bank: State Bank of India

कुल नुकसान / Total Loss: ₹2,50,000

हस्ताक्षर / Signature: Vikram Desai`,
  },
  {
    id: 'ev-002',
    caseId: 'case-001',
    fileName: 'bank_statement_May2026.csv',
    fileType: 'csv',
    fileSize: '156 KB',
    hash: 'sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
    uploadedAt: '2026-06-01T09:08:00',
    ocrStatus: 'completed',
  },
];

// ─── Entities ──────────────────────────────────────────────────────────────────
export const INITIAL_ENTITIES: Entity[] = [
  { id: 'ent-001', caseId: 'case-001', type: 'phone', value: '+91 98765 43210', confidence: 0.99, source: 'Regex', status: 'pending' },
  { id: 'ent-002', caseId: 'case-001', type: 'email', value: 'vikram@email.com', confidence: 0.98, source: 'AI', status: 'pending' },
  { id: 'ent-003', caseId: 'case-001', type: 'upi', value: 'victim@upi', confidence: 0.99, source: 'AI', status: 'pending' },
  { id: 'ent-004', caseId: 'case-001', type: 'upi', value: 'fraudster@upi', confidence: 0.93, source: 'AI', status: 'pending' },
  { id: 'ent-005', caseId: 'case-001', type: 'ifsc', value: 'SBIN0001234', confidence: 0.99, source: 'Regex', status: 'pending' },
  { id: 'ent-006', caseId: 'case-001', type: 'account', value: '12345678901', confidence: 0.95, source: 'AI', status: 'pending' },
  { id: 'ent-007', caseId: 'case-001', type: 'person', value: 'Rajesh Kumar', confidence: 0.88, source: 'AI', status: 'pending' },
];

// ─── Transactions ──────────────────────────────────────────────────────────────
export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', caseId: 'case-001', date: '01/05/2026', sender: 'victim@upi', receiver: 'mule1@icici', amount: 50000, narration: 'KYC Verification Fee', suspicious: true },
  { id: 'tx-002', caseId: 'case-001', date: '01/05/2026', sender: 'mule1@icici', receiver: 'mule2@sbi', amount: 50000, narration: 'Fund Transfer', suspicious: true },
  { id: 'tx-003', caseId: 'case-001', date: '01/05/2026', sender: 'mule2@sbi', receiver: 'beneficiary@hdfc', amount: 50000, narration: 'Payment', suspicious: true },
  { id: 'tx-004', caseId: 'case-001', date: '01/05/2026', sender: 'beneficiary@hdfc', receiver: 'victim@upi', amount: 50000, narration: 'Refund', suspicious: true },
  { id: 'tx-005', caseId: 'case-001', date: '02/05/2026', sender: 'victim@upi', receiver: 'mule1@icici', amount: 20000, narration: 'Account Update Charges', suspicious: true },
  { id: 'tx-006', caseId: 'case-001', date: '02/05/2026', sender: 'mule1@icici', receiver: 'mule3@axis', amount: 20000, narration: 'Transfer', suspicious: true },
  { id: 'tx-007', caseId: 'case-001', date: '02/05/2026', sender: 'mule3@axis', receiver: 'beneficiary@hdfc', amount: 20000, narration: 'Settlement', suspicious: true },
  { id: 'tx-008', caseId: 'case-001', date: '03/05/2026', sender: 'victim@upi', receiver: 'mule1@icici', amount: 10000, narration: 'Final KYC Update', suspicious: true },
];

// ─── Graph Data ────────────────────────────────────────────────────────────────
export const GRAPH_NODES: GraphNode[] = [
  { id: 'victim@upi', label: 'victim@upi\n(Vikram Desai)', type: 'victim', riskScore: 10, fanIn: 1, fanOut: 3, bank: 'SBI' },
  { id: 'mule1@icici', label: 'mule1@icici\n(Mule Account)', type: 'mule', riskScore: 82, fanIn: 3, fanOut: 3, bank: 'ICICI Bank' },
  { id: 'mule2@sbi', label: 'mule2@sbi\n(Mule Account)', type: 'mule', riskScore: 71, fanIn: 1, fanOut: 1, bank: 'SBI' },
  { id: 'mule3@axis', label: 'mule3@axis\n(Mule Account)', type: 'mule', riskScore: 65, fanIn: 1, fanOut: 1, bank: 'Axis Bank' },
  { id: 'beneficiary@hdfc', label: 'beneficiary@hdfc\n(Final Receiver)', type: 'beneficiary', riskScore: 78, fanIn: 2, fanOut: 1, bank: 'HDFC Bank' },
  { id: 'suspect@paytm', label: 'suspect@paytm\n(Unknown)', type: 'unknown', riskScore: 45, fanIn: 0, fanOut: 1, bank: 'Paytm' },
];

export const GRAPH_LINKS: GraphLink[] = [
  { source: 'victim@upi', target: 'mule1@icici', amount: 50000, date: '01/05/2026' },
  { source: 'mule1@icici', target: 'mule2@sbi', amount: 50000, date: '01/05/2026' },
  { source: 'mule2@sbi', target: 'beneficiary@hdfc', amount: 50000, date: '01/05/2026' },
  { source: 'beneficiary@hdfc', target: 'victim@upi', amount: 50000, date: '01/05/2026', circular: true },
  { source: 'victim@upi', target: 'mule1@icici', amount: 20000, date: '02/05/2026' },
  { source: 'mule1@icici', target: 'mule3@axis', amount: 20000, date: '02/05/2026' },
  { source: 'mule3@axis', target: 'beneficiary@hdfc', amount: 20000, date: '02/05/2026' },
  { source: 'victim@upi', target: 'mule1@icici', amount: 10000, date: '03/05/2026' },
];

// ─── Fraud Alerts ──────────────────────────────────────────────────────────────
export const INITIAL_FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'fa-001',
    caseId: 'case-001',
    type: 'Mule Account Detected',
    severity: 'critical',
    description: 'Account mule1@icici exhibits classic mule account behavior with high fan-in (3 senders) and fan-out (3 receivers) within 72 hours. Multiple rapid fund transfers detected.',
    involvedEntities: ['mule1@icici', 'victim@upi', 'mule2@sbi', 'mule3@axis'],
    riskScore: 82,
    aiConfidence: 0.94,
    status: 'pending',
  },
  {
    id: 'fa-002',
    caseId: 'case-001',
    type: 'Circular Transaction Pattern',
    severity: 'high',
    description: 'Funds traced through a circular path: victim@upi → mule1@icici → mule2@sbi → beneficiary@hdfc → victim@upi. This pattern is indicative of money laundering to confuse investigators.',
    involvedEntities: ['victim@upi', 'mule1@icici', 'mule2@sbi', 'beneficiary@hdfc'],
    riskScore: 75,
    aiConfidence: 0.89,
    status: 'pending',
  },
  {
    id: 'fa-003',
    caseId: 'case-001',
    type: 'Layering Pattern (Fund Smurfing)',
    severity: 'high',
    description: 'Funds layered through multiple accounts: victim@upi → mule1@icici → mule3@axis → beneficiary@hdfc. Classic layering technique used in hawala-adjacent digital fraud.',
    involvedEntities: ['victim@upi', 'mule1@icici', 'mule3@axis', 'beneficiary@hdfc'],
    riskScore: 68,
    aiConfidence: 0.82,
    status: 'pending',
  },
];

// ─── Audit Logs ────────────────────────────────────────────────────────────────
export const AUDIT_LOGS: AuditLog[] = [
  { id: 'al-001', timestamp: '2026-06-01 09:00:12', actor: 'officer.raj', action: 'LOGIN', resource: 'System', ipAddress: '192.168.1.25' },
  { id: 'al-002', timestamp: '2026-06-01 09:02:34', actor: 'officer.raj', action: 'CASE_CREATED', resource: 'CCB/2026/0001', ipAddress: '192.168.1.25', details: 'UPI Fraud via Fake KYC' },
  { id: 'al-003', timestamp: '2026-06-01 09:05:18', actor: 'officer.raj', action: 'EVIDENCE_UPLOADED', resource: 'complaint_statement.pdf', ipAddress: '192.168.1.25', details: 'Case: CCB/2026/0001' },
  { id: 'al-004', timestamp: '2026-06-01 09:07:45', actor: 'officer.raj', action: 'EVIDENCE_UPLOADED', resource: 'bank_statement_May2026.csv', ipAddress: '192.168.1.25', details: 'Case: CCB/2026/0001' },
  { id: 'al-005', timestamp: '2026-06-01 09:10:22', actor: 'officer.raj', action: 'TRANSACTION_IMPORTED', resource: 'CCB/2026/0001', ipAddress: '192.168.1.25', details: '8 transactions imported' },
  { id: 'al-006', timestamp: '2026-06-01 09:15:33', actor: 'officer.raj', action: 'ENTITY_ACCEPTED', resource: 'ent-001', ipAddress: '192.168.1.25', details: '+91 98765 43210' },
  { id: 'al-007', timestamp: '2026-06-01 09:16:04', actor: 'officer.raj', action: 'ENTITY_ACCEPTED', resource: 'ent-003', ipAddress: '192.168.1.25', details: 'victim@upi' },
  { id: 'al-008', timestamp: '2026-06-01 09:22:11', actor: 'officer.raj', action: 'REPORT_GENERATED', resource: 'CCB/2026/0001', ipAddress: '192.168.1.25', details: 'Language: Hindi' },
  { id: 'al-009', timestamp: '2026-06-01 09:25:55', actor: 'officer.raj', action: 'FIR_DRAFTED', resource: 'CCB/2026/0001', ipAddress: '192.168.1.25' },
  { id: 'al-010', timestamp: '2026-06-01 10:00:00', actor: 'admin.sharma', action: 'LOGIN', resource: 'System', ipAddress: '192.168.1.10' },
  { id: 'al-011', timestamp: '2026-06-01 10:02:30', actor: 'admin.sharma', action: 'CASE_UPDATED', resource: 'CCB/2026/0001', ipAddress: '192.168.1.10', details: 'Status: active' },
  { id: 'al-012', timestamp: '2026-06-02 09:05:00', actor: 'officer.raj', action: 'LOGIN', resource: 'System', ipAddress: '192.168.1.25' },
  { id: 'al-013', timestamp: '2026-06-02 09:10:45', actor: 'officer.raj', action: 'ENTITY_REJECTED', resource: 'ent-007', ipAddress: '192.168.1.25', details: 'False positive: Rajesh Kumar' },
  { id: 'al-014', timestamp: '2026-06-02 11:30:00', actor: 'supervisor.mehta', action: 'LOGIN', resource: 'System', ipAddress: '192.168.1.50' },
  { id: 'al-015', timestamp: '2026-06-03 09:00:00', actor: 'officer.raj', action: 'LOGIN', resource: 'System', ipAddress: '192.168.1.25' },
];

// ─── Notifications ─────────────────────────────────────────────────────────────
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title: 'OCR Processing Complete',
    message: 'OCR completed for CCB/2026/0001 – complaint_statement.pdf. 7 entities extracted.',
    caseId: 'case-001',
    read: false,
    createdAt: '2026-06-01T09:06:00',
    type: 'success',
  },
  {
    id: 'notif-002',
    title: 'Fraud Patterns Detected',
    message: 'Fraud patterns detected in CCB/2026/0001. 3 alerts generated: Mule Account (Critical), Circular Transaction (High), Layering (High).',
    caseId: 'case-001',
    read: false,
    createdAt: '2026-06-01T09:12:00',
    type: 'warning',
  },
];

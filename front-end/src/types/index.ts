// All TypeScript interfaces for CyberTrace AI

export type UserRole = 'citizen' | 'officer' | 'supervisor' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  avatar?: string;
}

export type CaseStatus = 'open' | 'active' | 'closed';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  complainant: string;
  complainantPhone: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  amountLost?: number;
}

export type EvidenceType = 'pdf' | 'image' | 'csv' | 'other';

export interface Evidence {
  id: string;
  caseId: string;
  fileName: string;
  fileType: EvidenceType;
  fileSize: string;
  hash: string;
  uploadedAt: string;
  ocrText?: string;
  ocrStatus: 'pending' | 'processing' | 'completed';
}

export type EntityType = 'phone' | 'email' | 'upi' | 'ifsc' | 'account' | 'person' | 'url';
export type EntityStatus = 'pending' | 'accepted' | 'rejected';
export type EntitySource = 'AI' | 'Regex' | 'Manual';

export interface Entity {
  id: string;
  caseId: string;
  type: EntityType;
  value: string;
  confidence: number;
  source: EntitySource;
  status: EntityStatus;
  isEditing?: boolean;
}

export interface Transaction {
  id: string;
  caseId: string;
  date: string;
  sender: string;
  receiver: string;
  amount: number;
  narration: string;
  suspicious: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'victim' | 'mule' | 'beneficiary' | 'unknown';
  riskScore: number;
  fanIn: number;
  fanOut: number;
  bank: string;
}

export interface GraphLink {
  source: string;
  target: string;
  amount: number;
  date: string;
  circular?: boolean;
}

export type FraudAlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type FraudAlertStatus = 'pending' | 'accepted' | 'rejected';

export interface FraudAlert {
  id: string;
  caseId: string;
  type: string;
  severity: FraudAlertSeverity;
  description: string;
  involvedEntities: string[];
  riskScore: number;
  aiConfidence: number;
  status: FraudAlertStatus;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CASE_CREATED'
  | 'CASE_UPDATED'
  | 'EVIDENCE_UPLOADED'
  | 'ENTITY_ACCEPTED'
  | 'ENTITY_REJECTED'
  | 'REPORT_GENERATED'
  | 'FIR_DRAFTED'
  | 'TRANSACTION_IMPORTED';

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditAction;
  resource: string;
  ipAddress: string;
  details?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  caseId?: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type Language = 'en' | 'hi' | 'gu';

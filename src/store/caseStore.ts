import { create } from 'zustand';
import type { Case, Evidence, Entity, Transaction, FraudAlert } from '../types';
import {
  INITIAL_CASES,
  INITIAL_EVIDENCE,
  INITIAL_ENTITIES,
  INITIAL_TRANSACTIONS,
  INITIAL_FRAUD_ALERTS,
} from '../data/mockData';

interface CaseState {
  cases: Case[];
  evidence: Evidence[];
  entities: Entity[];
  transactions: Transaction[];
  fraudAlerts: FraudAlert[];
  transactionsLoaded: boolean;
  
  // Case actions
  addCase: (caseData: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>) => Case;
  
  // Evidence actions
  addEvidence: (ev: Evidence) => void;
  updateEvidenceOcrStatus: (id: string, status: Evidence['ocrStatus'], text?: string) => void;
  
  // Entity actions
  acceptEntity: (id: string) => void;
  rejectEntity: (id: string) => void;
  editEntity: (id: string, value: string) => void;
  
  // Transaction actions
  importTransactions: () => Promise<void>;
  
  // Fraud alert actions
  acceptFraudAlert: (id: string) => void;
  rejectFraudAlert: (id: string) => void;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: INITIAL_CASES,
  evidence: INITIAL_EVIDENCE,
  entities: INITIAL_ENTITIES,
  transactions: [],
  fraudAlerts: INITIAL_FRAUD_ALERTS,
  transactionsLoaded: false,

  addCase: (caseData) => {
    const cases = get().cases;
    const nextNum = cases.length + 1;
    const caseNumber = `CCB/2026/00${String(nextNum).padStart(2, '0')}`;
    const newCase: Case = {
      ...caseData,
      id: `case-${Date.now()}`,
      caseNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ cases: [...cases, newCase] });
    return newCase;
  },

  addEvidence: (ev) => {
    set((s) => ({ evidence: [...s.evidence, ev] }));
  },

  updateEvidenceOcrStatus: (id, status, text) => {
    set((s) => ({
      evidence: s.evidence.map((e) =>
        e.id === id ? { ...e, ocrStatus: status, ocrText: text ?? e.ocrText } : e
      ),
    }));
  },

  acceptEntity: (id) => {
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'accepted' } : e)),
    }));
  },

  rejectEntity: (id) => {
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e)),
    }));
  },

  editEntity: (id, value) => {
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? { ...e, value } : e)),
    }));
  },

  importTransactions: async () => {
    await new Promise((r) => setTimeout(r, 2500));
    set({ transactions: INITIAL_TRANSACTIONS, transactionsLoaded: true });
  },

  acceptFraudAlert: (id) => {
    set((s) => ({
      fraudAlerts: s.fraudAlerts.map((a) => (a.id === id ? { ...a, status: 'accepted' } : a)),
    }));
  },

  rejectFraudAlert: (id) => {
    set((s) => ({
      fraudAlerts: s.fraudAlerts.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)),
    }));
  },
}));

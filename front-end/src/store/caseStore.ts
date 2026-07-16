import { create } from 'zustand';
import type { Case, Evidence, Entity, Transaction, FraudAlert, GraphNode, GraphLink } from '../types';
import { useNotificationStore } from './notificationStore';
import {
  INITIAL_CASES,
  INITIAL_EVIDENCE,
  INITIAL_ENTITIES,
  INITIAL_TRANSACTIONS,
  INITIAL_FRAUD_ALERTS,
  GRAPH_NODES,
  GRAPH_LINKS
} from '../data/mockData';

interface CaseState {
  cases: Case[];
  evidence: Evidence[];
  entities: Entity[];
  transactions: Transaction[];
  fraudAlerts: FraudAlert[];
  transactionsLoaded: boolean;
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
  
  initializeCases: () => Promise<void>;
  loadCaseDetails: (caseId: string) => Promise<void>;
  
  // Case actions
  addCase: (caseData: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>) => Promise<Case>;
  
  // Evidence actions
  addEvidence: (ev: Evidence) => void;
  uploadEvidence: (caseId: string, file: File) => Promise<void>;
  updateEvidenceOcrStatus: (id: string, status: Evidence['ocrStatus'], text?: string) => void;
  
  // Entity actions
  acceptEntity: (id: string) => Promise<void>;
  rejectEntity: (id: string) => Promise<void>;
  editEntity: (id: string, value: string) => Promise<void>;
  
  // Transaction actions
  importTransactions: (caseId: string, file?: File) => Promise<void>;
  
  // Fraud alert actions
  addFraudAlert: (alert: FraudAlert) => void;
  acceptFraudAlert: (id: string) => Promise<void>;
  rejectFraudAlert: (id: string) => Promise<void>;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: INITIAL_CASES,
  evidence: INITIAL_EVIDENCE,
  entities: INITIAL_ENTITIES,
  transactions: [],
  fraudAlerts: INITIAL_FRAUD_ALERTS,
  transactionsLoaded: false,
  graphNodes: GRAPH_NODES,
  graphLinks: GRAPH_LINKS,

  initializeCases: async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json() as Case[];
        set({ cases: data });
      }
    } catch (e) {
      // Offline fallback
    }
  },

  loadCaseDetails: async (caseId: string) => {
    try {
      // Synchronize exact case metadata from API first
      const caseRes = await fetch(`/api/cases/${caseId}`);
      if (caseRes.ok) {
        const caseData = await caseRes.json() as Case;
        set((state) => {
          const exists = state.cases.some((c) => c.id === caseId);
          if (exists) {
            return { cases: state.cases.map((c) => (c.id === caseId ? caseData : c)) };
          }
          return { cases: [caseData, ...state.cases] };
        });
      } else if (get().cases.length === 0) {
        await get().initializeCases();
      }

      const evRes = await fetch(`/api/cases/${caseId}/evidence`);
      const evidence = evRes.ok ? await evRes.json() : get().evidence;

      const entRes = await fetch(`/api/cases/${caseId}/entities`);
      const entities = entRes.ok ? await entRes.json() : get().entities;

      const txRes = await fetch(`/api/cases/${caseId}/transactions`);
      const transactions = txRes.ok ? await txRes.json() : get().transactions;

      // Fetch graph nodes, links and alerts from analytics API
      const graphRes = await fetch(`/api/cases/${caseId}/analytics`);
      let graphNodes = get().graphNodes;
      let graphLinks = get().graphLinks;
      let fraudAlerts = get().fraudAlerts;
      
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        graphNodes = graphData.nodes;
        graphLinks = graphData.links;
        fraudAlerts = graphData.alerts;
      } else {
        const alRes = await fetch(`/api/cases/${caseId}/alerts`);
        if (alRes.ok) {
          fraudAlerts = await alRes.json();
        }
      }

      set({
        evidence,
        entities,
        transactions,
        fraudAlerts,
        graphNodes,
        graphLinks,
        transactionsLoaded: transactions.length > 0
      });
    } catch (e) {
      // Offline fallback
    }
  },

  addCase: async (caseData) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      if (res.ok) {
        const newCase = await res.json() as Case;
        set((s) => ({ cases: [newCase, ...s.cases] }));
        return newCase;
      }
    } catch (e) {
      // Offline fallback
    }
    
    const cases = get().cases;
    const nextNum = cases.length + 1;
    const caseNumber = `CCB/2026/00${String(nextNum).padStart(2, '0')}`;
    const newCase: Case = {
      category: 'Financial Fraud / UPI Scam',
      platform: '',
      state: '',
      paymentMethod: '',
      ...caseData,
      id: `case-${Date.now()}`,
      caseNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ cases: [newCase, ...cases] });
    return newCase;
  },

  addEvidence: (ev) => {
    set((s) => ({ evidence: [...s.evidence, ev] }));
  },

  uploadEvidence: async (caseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/cases/${caseId}/evidence/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newEv = await res.json() as Evidence;
        set((s) => ({ evidence: [newEv, ...s.evidence] }));
        
        // Background polling for OCR status completion
        const pollOcr = async () => {
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const detailRes = await fetch(`/api/cases/${caseId}/evidence`);
            if (detailRes.ok) {
              const list = await detailRes.json() as Evidence[];
              const updatedEv = list.find(e => e.id === newEv.id);
              if (updatedEv && updatedEv.ocrStatus === 'completed') {
                // OCR complete, reload evidence and auto-extracted entities
                set({ evidence: list });
                const entRes = await fetch(`/api/cases/${caseId}/entities`);
                if (entRes.ok) {
                  set({ entities: await entRes.json() });
                }
                // Update notifications list
                useNotificationStore.getState().initializeNotifications();
                break;
              }
            }
          }
        };
        pollOcr();
      }
    } catch (e) {
      // Offline simulation fallback
      const id = `ev-${Date.now()}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const type: Evidence['fileType'] =
        ext === 'pdf' ? 'pdf' : ext === 'csv' ? 'csv' : ['png', 'jpg', 'jpeg'].includes(ext) ? 'image' : 'other';

      const newEv: Evidence = {
        id,
        caseId,
        fileName: file.name,
        fileType: type,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        hash: `sha256:simulated${Math.random().toString(36).slice(2).repeat(3)}`,
        uploadedAt: new Date().toISOString(),
        ocrStatus: 'completed',
        ocrText: 'Offline mode: Simulated OCR text.'
      };
      set((s) => ({ evidence: [newEv, ...s.evidence] }));
    }
  },

  updateEvidenceOcrStatus: (id, status, text) => {
    set((s) => ({
      evidence: s.evidence.map((e) =>
        e.id === id ? { ...e, ocrStatus: status, ocrText: text ?? e.ocrText } : e
      ),
    }));
  },

  acceptEntity: async (id) => {
    try {
      const res = await fetch(`/api/entities/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });
      if (res.ok) {
        set((s) => ({
          entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'accepted' } : e)),
        }));
      }
    } catch (e) {
      // Offline fallback
      set((s) => ({
        entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'accepted' } : e)),
      }));
    }
  },

  rejectEntity: async (id) => {
    try {
      const res = await fetch(`/api/entities/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        set((s) => ({
          entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e)),
        }));
      }
    } catch (e) {
      // Offline fallback
      set((s) => ({
        entities: s.entities.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e)),
      }));
    }
  },

  editEntity: async (id, value) => {
    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        set((s) => ({
          entities: s.entities.map((e) => (e.id === id ? { ...e, value } : e)),
        }));
      }
    } catch (e) {
      // Offline fallback
      set((s) => ({
        entities: s.entities.map((e) => (e.id === id ? { ...e, value } : e)),
      }));
    }
  },

  importTransactions: async (caseId, file) => {
    try {
      const options: RequestInit = { method: 'POST' };
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        options.body = formData;
      }

      const res = await fetch(`/api/cases/${caseId}/transactions/import`, options);
      if (res.ok) {
        // Run analytics to generate alerts/nodes/links
        const graphRes = await fetch(`/api/cases/${caseId}/analytics`);
        if (graphRes.ok) {
          const graphData = await graphRes.json();
          // Load transactions
          const txRes = await fetch(`/api/cases/${caseId}/transactions`);
          const transactions = txRes.ok ? await txRes.json() : [];
          set({
            transactions,
            graphNodes: graphData.nodes,
            graphLinks: graphData.links,
            fraudAlerts: graphData.alerts,
            transactionsLoaded: true
          });
        }
      }
    } catch (e) {
      // Offline fallback
      await new Promise((r) => setTimeout(r, 1500));
      set({ transactions: INITIAL_TRANSACTIONS, transactionsLoaded: true });
    }
  },

  addFraudAlert: (alert) => {
    set((s) => ({ fraudAlerts: [alert, ...s.fraudAlerts] }));
    try {
      fetch(`/api/cases/${alert.caseId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      }).catch(() => {});
    } catch (e) {}
  },

  acceptFraudAlert: async (id) => {
    set((s) => ({
      fraudAlerts: s.fraudAlerts.map((a) => (a.id === id ? { ...a, status: 'accepted' } : a)),
    }));
    try {
      const targetAlert = get().fraudAlerts.find((a) => a.id === id);
      await fetch(`/api/alerts/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', alert: targetAlert }),
      });
    } catch (e) {
      // Offline fallback already handled by state update above
    }
  },

  rejectFraudAlert: async (id) => {
    set((s) => ({
      fraudAlerts: s.fraudAlerts.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)),
    }));
    try {
      const targetAlert = get().fraudAlerts.find((a) => a.id === id);
      await fetch(`/api/alerts/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', alert: targetAlert }),
      });
    } catch (e) {
      // Offline fallback already handled by state update above
    }
  },
}));

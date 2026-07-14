import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesListPage } from './pages/CasesListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { AuditLogPage } from './pages/AuditLogPage';
import './i18n';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesListPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="admin/audit" element={<AuditLogPage />} />
          <Route path="settings" element={
            <div className="glass-card p-8 text-center text-white/40">
              <p className="text-lg font-semibold">Settings</p>
              <p className="text-sm mt-2">System configuration panel – coming soon</p>
            </div>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

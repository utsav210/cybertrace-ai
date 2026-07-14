import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesListPage } from './pages/CasesListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CitizenPortalPage } from './pages/CitizenPortalPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import './i18n';

const IndexRedirector: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role === 'citizen') return <Navigate to="/portal" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/audit" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen-portal" element={
          <div className="min-h-screen p-4 sm:p-8 animate-fade-in">
            <CitizenPortalPage />
          </div>
        } />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<IndexRedirector />} />
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['officer', 'supervisor', 'admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="cases" element={
            <ProtectedRoute allowedRoles={['officer', 'supervisor', 'admin']}>
              <CasesListPage />
            </ProtectedRoute>
          } />
          <Route path="cases/:id" element={
            <ProtectedRoute allowedRoles={['officer', 'supervisor', 'admin']}>
              <CaseDetailPage />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute allowedRoles={['officer', 'supervisor', 'admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="portal" element={
            <ProtectedRoute allowedRoles={['citizen', 'officer', 'supervisor', 'admin']}>
              <CitizenPortalPage />
            </ProtectedRoute>
          } />
          <Route path="admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['citizen', 'officer', 'supervisor', 'admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

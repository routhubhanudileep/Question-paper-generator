import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { QuestionBankPage } from './components/faculty/QuestionBankPage';
import { PaperGeneratorPage } from './components/faculty/PaperGeneratorPage';
import { MyPapersPage } from './components/faculty/MyPapersPage';
import { PatternsPage } from './components/hod/PatternsPage';
import { ApprovalsPage } from './components/hod/ApprovalsPage';
import { SubjectsUnitsPage } from './components/admin/SubjectsUnitsPage';
import { UsersPage } from './components/admin/UsersPage';
import { AuditLogsPage } from './components/admin/AuditLogsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { ToastContainer } from './components/ui/CommonUI';
import { UserRole } from './types';

const ALLOWED_PAGES: Record<UserRole, string[]> = {
  faculty: ['dashboard', 'question-bank', 'generator', 'my-papers'],
  hod: ['dashboard', 'patterns', 'approvals', 'reports'],
  admin: ['dashboard', 'subjects', 'users', 'audit-logs', 'reports'],
};

const PortalRouter: React.FC = () => {
  const { currentUser, toasts, dismissToast } = useApp();
  const [activePage, setActivePage] = useState<string>('dashboard');

  // Reset to dashboard or enforce role-based page access whenever user changes
  useEffect(() => {
    if (!currentUser) {
      setActivePage('dashboard');
      return;
    }
    const allowed = ALLOWED_PAGES[currentUser.role];
    if (!allowed.includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [activePage, currentUser]);

  const handleNavigate = (pageId: string) => {
    if (!currentUser) return;
    if (ALLOWED_PAGES[currentUser.role].includes(pageId)) {
      setActivePage(pageId);
    }
  };

  const renderPage = () => {
    if (!currentUser) return null;

    if (activePage === 'dashboard') {
      return <DashboardPage onNavigate={handleNavigate} />;
    }

    if (currentUser.role === 'faculty') {
      switch (activePage) {
        case 'question-bank':
          return <QuestionBankPage />;
        case 'generator':
          return (
            <PaperGeneratorPage
              onPaperSaved={() => handleNavigate('my-papers')}
            />
          );
        case 'my-papers':
          return (
            <MyPapersPage
              onGoToGenerator={() => handleNavigate('generator')}
            />
          );
      }
    }

    if (currentUser.role === 'hod') {
      switch (activePage) {
        case 'patterns':
          return <PatternsPage />;
        case 'approvals':
          return <ApprovalsPage />;
        case 'reports':
          return <ReportsPage />;
      }
    }

    if (currentUser.role === 'admin') {
      switch (activePage) {
        case 'subjects':
          return <SubjectsUnitsPage />;
        case 'users':
          return <UsersPage />;
        case 'audit-logs':
          return <AuditLogsPage />;
        case 'reports':
          return <ReportsPage />;
      }
    }

    return <DashboardPage onNavigate={handleNavigate} />;
  };

  return (
    <>
      {!currentUser ? (
        <LoginPage />
      ) : (
        <AppShell activePage={activePage} onNavigate={handleNavigate}>
          {renderPage()}
        </AppShell>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <PortalRouter />
    </AppProvider>
  );
}

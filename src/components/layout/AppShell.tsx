import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  ClipboardCheck,
  FileCheck2,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ROLE_MENUS: Record<UserRole, NavItem[]> = {
  faculty: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'question-bank',
      label: 'Question Bank',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'generator',
      label: 'Paper Generator',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'my-papers',
      label: 'My Papers',
      icon: <FileCheck2 className="w-4 h-4" />,
    },
  ],
  hod: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'patterns',
      label: 'Paper Patterns',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ],
  admin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'subjects',
      label: 'Subjects & Units',
      icon: <BookMarked className="w-4 h-4" />,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ],
};

interface AppShellProps {
  activePage: string;
  onNavigate: (pageId: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activePage,
  onNavigate,
  children,
}) => {
  const { currentUser, logout, papers } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activePage]);

  if (!currentUser) return null;

  const menuItems = ROLE_MENUS[currentUser.role];
  const pendingCount = papers.filter((p) => p.status === 'Pending').length;
  const currentNav = menuItems.find((m) => m.id === activePage) ?? menuItems[0];

  const roleTitle =
    currentUser.role === 'faculty'
      ? 'Faculty Portal'
      : currentUser.role === 'hod'
        ? 'HOD Portal'
        : 'Admin Portal';

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Wordmark */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
            Question Paper Gen
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main">
        <p className="px-3 pt-2 pb-1.5 text-xs font-medium text-slate-400">
          {roleTitle}
        </p>
        {menuItems.map((item) => {
          const isActive = item.id === activePage;
          const showPendingCount =
            item.id === 'approvals' && pendingCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={isActive ? 'text-blue-700' : 'text-slate-400'}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </span>

              {showPendingCount && (
                <span className="text-xs font-mono font-semibold text-amber-700 tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account Footer */}
      <div className="p-4 border-t border-slate-200 space-y-3 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {currentUser.name}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {currentUser.email}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen no-print">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 z-50">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                {roleTitle}
              </span>
              <span
                className="text-slate-300 hidden sm:inline"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {currentNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">
              {currentUser.name} ·{' '}
              <span className="uppercase font-medium text-slate-700">
                {currentUser.role}
              </span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

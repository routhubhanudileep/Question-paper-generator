import React, { useState } from 'react';
import { BookOpenCheck, KeyRound, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const DEMO_ACCOUNTS = [
  {
    roleLabel: 'Faculty',
    name: 'Dr. Meera Nair',
    email: 'faculty@demo.com',
    pass: 'demo123',
    scope: 'Manage question bank, generate 50/100-mark papers, submit for approval, download PDFs.',
  },
  {
    roleLabel: 'Head of Department (HOD)',
    name: 'Prof. Rajesh Verma',
    email: 'hod@demo.com',
    pass: 'demo123',
    scope: 'Define exam paper blueprints, review pending papers, approve or reject with comments.',
  },
  {
    roleLabel: 'Examination Admin',
    name: 'Suresh Kulkarni',
    email: 'admin@demo.com',
    pass: 'demo123',
    scope: 'Manage system users, subjects and syllabus units, inspect audit logs and reports.',
  },
];

export const LoginPage: React.FC = () => {
  const { login, resetDemoData } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Authentication failed.');
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    const result = login(demoEmail, demoPass);
    if (!result.ok) {
      setError(result.error ?? 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto">
        {/* Top Portal Identity */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Online Question Paper Generator
              </h1>
              <p className="text-xs text-slate-500">
                College Examination Management &amp; Moderation Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-4 whitespace-nowrap"
          >
            Reset Demo Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Sign-In Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Portal Sign In
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your institutional credentials or choose a demo role.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Institutional Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@demo.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
              All question banks, blueprints, approvals, and audit trails persist
              locally in your browser.
            </div>
          </div>

          {/* Demo Accounts Directory */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-700" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Demo Accounts
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Each role unlocks only its dedicated workspace, navigation menu,
                and permissions.
              </p>

              <div className="mt-5 divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {DEMO_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.email}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {acc.roleLabel}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          &middot;
                        </span>
                        <span className="text-xs text-slate-600">
                          {acc.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {acc.scope}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-700">
                        <span>Email: {acc.email}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          /
                        </span>
                        <span>Password: {acc.pass}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(acc.email, acc.pass)}
                      className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                      Sign In as {acc.roleLabel.split(' ')[0]}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Seeded with 3 subjects (Software Engineering, Database Management,
              Data Structures), 12 units, 72 questions, 2 exam patterns, and
              sample papers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

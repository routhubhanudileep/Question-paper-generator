import React from 'react';
import { ArrowRight, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard, StatusLabel } from '../ui/CommonUI';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
}) => {
  const {
    currentUser,
    questions,
    papers,
    patterns,
    subjects,
    units,
    users,
    auditLogs,
  } = useApp();

  if (!currentUser) return null;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const pendingPapers = papers.filter((p) => p.status === 'Pending');
  const approvedPapers = papers.filter((p) => p.status === 'Approved');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {currentUser.role === 'faculty' && 'Faculty Examination Workspace'}
            {currentUser.role === 'hod' && 'HOD Moderation & Blueprints'}
            {currentUser.role === 'admin' && 'Examination Cell Administration'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {currentUser.name} · {currentUser.department}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.role === 'faculty' && (
            <button
              type="button"
              onClick={() => onNavigate('generator')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Generate Paper</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {currentUser.role === 'hod' && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Review Pending ({pendingPapers.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Manage Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Questions in Bank"
          value={questions.length}
          helper={`Across ${subjects.length} subjects`}
        />
        <StatCard
          label="Papers Generated"
          value={papers.length}
          helper={`${approvedPapers.length} approved`}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingPapers.length}
          helper={pendingPapers.length > 0 ? 'Awaiting HOD review' : 'Queue clear'}
        />
        {currentUser.role === 'faculty' && (
          <StatCard
            label="Available Patterns"
            value={patterns.length}
            helper="HOD blueprints"
          />
        )}
        {currentUser.role === 'hod' && (
          <StatCard
            label="Active Blueprints"
            value={patterns.length}
            helper={`${units.length} syllabus units`}
          />
        )}
        {currentUser.role === 'admin' && (
          <StatCard
            label="Registered Users"
            value={users.length}
            helper={`${users.filter((u) => u.active).length} active`}
          />
        )}
      </div>

      {/* Role-Specific Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary Workflow Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              {currentUser.role === 'hod'
                ? 'Approval Queue & Recent Papers'
                : currentUser.role === 'admin'
                  ? 'Recent Paper Audit Activity'
                  : 'Recent Question Papers'}
            </h2>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  currentUser.role === 'faculty'
                    ? 'my-papers'
                    : currentUser.role === 'hod'
                      ? 'approvals'
                      : 'audit-logs',
                )
              }
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              View all
            </button>
          </div>

          {currentUser.role === 'admin' ? (
            <div className="divide-y divide-slate-200">
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {log.action}: {log.paperTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {log.actorName} ({log.actorRole.toUpperCase()}) ·{' '}
                      {log.subjectName}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {papers.slice(0, 5).map((paper) => {
                const sub = subjectMap.get(paper.subjectId);
                return (
                  <div
                    key={paper.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {paper.examName}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {sub ? `${sub.code} · ${sub.name}` : 'Unknown Subject'}{' '}
                        ·{' '}
                        <span className="font-mono tabular-nums">
                          {paper.totalMarks} Marks
                        </span>{' '}
                        · {paper.durationMinutes} mins
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusLabel status={paper.status} />
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate(
                            currentUser.role === 'hod'
                              ? 'approvals'
                              : 'my-papers',
                          )
                        }
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                      >
                        {currentUser.role === 'hod' && paper.status === 'Pending'
                          ? 'Review'
                          : 'Open'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Subject Coverage Overview */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Subject Question Coverage
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Bank readiness across configured courses
          </p>

          <div className="mt-5 space-y-4">
            {subjects.map((sub) => {
              const count = questions.filter((q) => q.subjectId === sub.id).length;
              const subUnits = units.filter((u) => u.subjectId === sub.id).length;
              const subPapers = papers.filter((p) => p.subjectId === sub.id).length;
              const pct = Math.min(100, Math.round((count / 25) * 100));

              return (
                <div key={sub.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {sub.code} · {sub.name}
                    </span>
                    <span className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
                      {count} Qs
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {subUnits} units · {subPapers} papers generated
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{approvedPapers.length} Approved</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingPapers.length} Pending</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

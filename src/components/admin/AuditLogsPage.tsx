import React, { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditAction } from '../../types';
import { EmptyState } from '../ui/CommonUI';

const ACTIONS: ('all' | AuditAction)[] = [
  'all',
  'Created',
  'Viewed',
  'Submitted',
  'Approved',
  'Rejected',
  'Downloaded Paper',
  'Downloaded Answer Key',
];

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (
        q &&
        !log.paperTitle.toLowerCase().includes(q) &&
        !log.actorName.toLowerCase().includes(q) &&
        !log.subjectName.toLowerCase().includes(q) &&
        !log.details.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [actionFilter, auditLogs, search]);

  const actionColor = (action: AuditAction): string => {
    if (action === 'Approved') return 'text-emerald-700';
    if (action === 'Rejected') return 'text-red-700';
    if (action === 'Submitted') return 'text-amber-700';
    if (action === 'Downloaded Paper' || action === 'Downloaded Answer Key')
      return 'text-blue-700';
    return 'text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paper Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chronological record of paper creation, moderation views, approvals,
          rejections, and PDF downloads.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by paper title, actor name, subject, or details..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          aria-label="Filter by audit action"
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value as 'all' | AuditAction)
          }
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === 'all' ? 'All Events' : a}
            </option>
          ))}
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="w-5 h-5" />}
          title="No matching audit events"
          description="Try adjusting your search query or event filter."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4 whitespace-nowrap">Actor</th>
                  <th className="py-3 px-4 whitespace-nowrap">Event</th>
                  <th className="py-3 px-4">Paper &amp; Subject</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-900">
                        {log.actorName}
                      </p>
                      <p className="text-xs text-slate-500 uppercase">
                        {log.actorRole}
                      </p>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap ${actionColor(
                        log.action,
                      )}`}
                    >
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-slate-900">
                        {log.paperTitle}
                      </p>
                      <p className="text-xs text-slate-500">{log.subjectName}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

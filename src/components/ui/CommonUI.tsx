import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import { DifficultyLevel, PaperStatus, ToastMessage } from '../../types';

/**
 * Unboxed status indicator pairing semantic color with explicit icon and label.
 */
export const StatusLabel: React.FC<{ status: PaperStatus }> = ({ status }) => {
  const config: Record<
    PaperStatus,
    { icon: React.ReactNode; textClass: string; label: string }
  > = {
    Approved: {
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
      textClass: 'text-emerald-700',
      label: 'Approved',
    },
    Pending: {
      icon: <Clock className="w-4 h-4 shrink-0" />,
      textClass: 'text-amber-700',
      label: 'Pending Approval',
    },
    Rejected: {
      icon: <XCircle className="w-4 h-4 shrink-0" />,
      textClass: 'text-red-700',
      label: 'Rejected',
    },
    Draft: {
      icon: <FileEdit className="w-4 h-4 shrink-0" />,
      textClass: 'text-slate-600',
      label: 'Draft',
    },
  };

  const item = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${item.textClass}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const DifficultyText: React.FC<{ difficulty: DifficultyLevel }> = ({
  difficulty,
}) => {
  const colorMap: Record<DifficultyLevel, string> = {
    Easy: 'text-emerald-700',
    Medium: 'text-amber-700',
    Hard: 'text-red-700',
  };
  return (
    <span className={`font-medium ${colorMap[difficulty]}`}>{difficulty}</span>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: number | string;
  helper?: string;
}> = ({ label, value, helper }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </span>
      {helper && (
        <span className="text-xs text-slate-500 truncate">{helper}</span>
      )}
    </div>
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="bg-white border border-slate-200 rounded-xl py-12 px-6 text-center flex flex-col items-center">
    <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500 max-w-md">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-xl',
  children,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} bg-white border border-slate-200 rounded-xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              destructive
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors whitespace-nowrap ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const iconMap: Record<ToastMessage['type'], React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0 no-print"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-slate-200 rounded-xl shadow-md px-4 py-3 flex items-start gap-3"
        >
          <div className="mt-0.5">{iconMap[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

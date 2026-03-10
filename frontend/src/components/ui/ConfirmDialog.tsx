import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 w-80 max-w-[90vw] space-y-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{title}</h2>
        {body && <p className="text-xs text-slate-500 dark:text-zinc-400">{body}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

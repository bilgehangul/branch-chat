import type { Thread } from '../../types/index';

export function ContextCard({ thread }: { thread: Thread }) {
  if (thread.depth < 1 || !thread.anchorText) return null;

  return (
    <div
      className="max-w-[720px] mx-auto mb-8 px-4 py-3 bg-blue-50 border-l-4 rounded-r"
      style={{ borderColor: thread.accentColor }}
    >
      <p className="text-xs text-slate-700 mb-1">Branched from parent thread</p>
      <p className="text-sm text-slate-600 italic">"{thread.anchorText}"</p>
    </div>
  );
}

import type { Thread } from '../../types/index';

export function ContextCard({ thread }: { thread: Thread }) {
  if (thread.depth < 1 || !thread.anchorText) return null;

  return (
    <div
      data-no-selection
      className="max-w-[720px] mx-auto mb-6 rounded-xl overflow-hidden border"
      style={{ borderColor: thread.accentColor }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ backgroundColor: `${thread.accentColor}22` }}
      >
        <span className="text-base" style={{ color: thread.accentColor }}>↗</span>
        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
          Branched from parent thread
        </span>
      </div>

      {/* Selected text quote */}
      <div className="px-4 py-3 bg-white dark:bg-zinc-800">
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">You selected:</p>
        <p
          className="text-sm font-medium leading-relaxed"
          style={{ color: thread.accentColor }}
        >
          "{thread.anchorText}"
        </p>
      </div>
    </div>
  );
}

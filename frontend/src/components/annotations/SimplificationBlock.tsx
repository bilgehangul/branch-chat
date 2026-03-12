/**
 * SimplificationBlock
 *
 * Rendered BELOW an AI paragraph (never replaces it) — both original and
 * simplified are visible simultaneously. Visually distinct from AI prose:
 * indigo-tinted background with left accent border, like a "code block for ideas".
 *
 * Requirements: INLINE-05, INLINE-06, INLINE-07
 *
 * CRITICAL: Must be rendered OUTSIDE the MarkdownRenderer div in MessageBlock
 * so it does not interfere with data-paragraph-id elements.
 */
import type { Annotation } from '../../types/index';
import { MarkdownRenderer } from '../thread/MarkdownRenderer';

type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

interface SimplificationBlockProps {
  annotation: Annotation;   // type === 'simplification'
  modeLabel: string;        // display label e.g. "Simpler" — derived by MessageBlock from annotation
  onSelectMode: (mode: SimplifyMode) => void; // called when user picks a new mode
}

const MODES: Array<{ key: SimplifyMode; label: string }> = [
  { key: 'simpler', label: 'Simpler' },
  { key: 'example', label: 'Example' },
  { key: 'analogy', label: 'Analogy' },
  { key: 'technical', label: 'Technical' },
];

export function SimplificationBlock({ annotation, modeLabel, onSelectMode }: SimplificationBlockProps) {
  const { replacementText } = annotation;
  const activeMode = MODES.find(m => m.label === modeLabel)?.key ?? 'simpler';

  return (
    <div
      className="mt-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-500 text-sm animate-slide-up-fade"
      data-no-selection
    >
      {/* Quoted target text */}
      <p className="px-3 pt-2 text-xs italic text-slate-500 dark:text-slate-400 truncate">
        &ldquo;{annotation.targetText.length > 50 ? annotation.targetText.slice(0, 50) + '...' : annotation.targetText}&rdquo;
      </p>

      {/* Header row with mode badge */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-200 dark:border-indigo-800">
        <span className="text-indigo-600 dark:text-indigo-300 font-medium text-xs flex items-center gap-1.5">
          ✎ Simplified
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" data-testid="mode-badge">
            {modeLabel}
          </span>
        </span>
      </div>

      {/* Simplified text content — rendered as markdown */}
      <div className="px-3 py-2 text-slate-700 dark:text-slate-200 leading-relaxed">
        {replacementText ? (
          <MarkdownRenderer content={replacementText} annotations={[]} />
        ) : (
          <span className="text-slate-400 dark:text-slate-400 italic">No content available</span>
        )}
      </div>

      {/* Always-visible mode pills */}
      <div className="px-3 pb-2 flex gap-1.5" data-testid="mode-pills">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none ${
              key === activeMode
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            aria-label={`Simplify using ${label} mode`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelectMode(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

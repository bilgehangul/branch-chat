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
import { useState } from 'react';
import type { Annotation } from '../../types/index';

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
  const [picking, setPicking] = useState(false);

  return (
    <div
      className="mt-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-500 text-sm"
      data-no-selection
    >
      {/* Quoted target text */}
      <p className="px-3 pt-2 text-xs italic text-slate-500 dark:text-slate-400 truncate">
        &ldquo;{annotation.targetText.length > 50 ? annotation.targetText.slice(0, 50) + '...' : annotation.targetText}&rdquo;
      </p>

      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-200 dark:border-indigo-800">
        <span className="text-indigo-600 dark:text-indigo-300 font-medium text-xs">
          ✎ Simplified &bull; {modeLabel}
        </span>
        {picking ? (
          /* Mode picker row */
          <div className="flex gap-1">
            {MODES.map(({ key, label }) => (
              <button
                key={key}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelectMode(key); setPicking(false); }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline transition-colors"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPicking(true)}
          >
            Try another mode
          </button>
        )}
      </div>

      {/* Simplified text content */}
      <div className="px-3 py-2 text-slate-700 dark:text-slate-200 leading-relaxed">
        {replacementText ?? <span className="text-slate-400 dark:text-slate-400 italic">No content available</span>}
      </div>
    </div>
  );
}

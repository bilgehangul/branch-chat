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

interface SimplificationBlockProps {
  annotation: Annotation;   // type === 'simplification'
  modeLabel: string;        // display label e.g. "Simpler" — derived by MessageBlock from annotation
  onTryAnother: () => void; // re-opens mode picker; called from ThreadView via MessageBlock
}

export function SimplificationBlock({ annotation, modeLabel, onTryAnother }: SimplificationBlockProps) {
  const { replacementText } = annotation;

  return (
    <div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-indigo-800 bg-indigo-950 border-l-4 border-l-indigo-500 text-sm">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-800">
        <span className="text-indigo-300 font-medium text-xs">
          ✎ Simplified &bull; {modeLabel}
        </span>
        <button
          className="text-xs text-indigo-400 hover:text-indigo-200 underline transition-colors"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onTryAnother}
        >
          Try another mode
        </button>
      </div>

      {/* Simplified text content */}
      <div className="px-3 py-2 text-slate-200 leading-relaxed">
        {replacementText ?? <span className="text-slate-400 italic">No content available</span>}
      </div>
    </div>
  );
}

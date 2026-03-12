/**
 * CitationBlock
 *
 * Collapsible citation block rendered below an AI message bubble.
 * Default state: collapsed (single-line pill).
 * Expanded: source rows + Gemini-generated note.
 *
 * Requirements: INLINE-02, INLINE-03
 *
 * CONTEXT.md override (INLINE-02): No superscript badge on paragraph text.
 * This block IS the full annotation UI per user decision.
 *
 * CONTEXT.md override (INLINE-03): Default collapsed (not expanded).
 * REQUIREMENTS.md said "default expanded" but CONTEXT.md wins.
 *
 * CRITICAL: Must be rendered OUTSIDE the MarkdownRenderer div in MessageBlock
 * so it does not interfere with data-paragraph-id elements.
 */
import { useState } from 'react';
import type { Annotation } from '../../types/index';

interface CitationBlockProps {
  annotation: Annotation; // type must be 'source'
}

export function CitationBlock({ annotation }: CitationBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const { sources, citationNote } = annotation;
  const count = sources.length;

  return (
    <div
      className="mt-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm"
      data-no-selection
    >
      {/* Quoted target text */}
      <p className="px-3 pt-2 text-xs italic text-slate-500 dark:text-slate-400 truncate">
        &ldquo;{annotation.targetText.length > 50 ? annotation.targetText.slice(0, 50) + '...' : annotation.targetText}&rdquo;
      </p>

      {/* Header row — always visible */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse sources' : 'Expand sources'}
      >
        <span>{'\uD83D\uDD0E'} {count} source{count !== 1 ? 's' : ''} found</span>
        <span className="text-xs text-slate-400 dark:text-slate-400">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-stone-200 dark:border-zinc-700 px-3 py-2 space-y-2">
          {/* Source rows */}
          {sources.map((source, i) => (
            <div key={i} className="flex items-start gap-2">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline flex-1 min-w-0 truncate focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 outline-none"
                title={source.title}
                aria-label={`Source: ${source.title}`}
              >
                {source.title}
              </a>
              <span className="shrink-0 text-xs text-slate-600 dark:text-slate-400 bg-stone-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                {source.domain}
              </span>
            </div>
          ))}

          {/* Horizontal divider before Gemini note */}
          {citationNote && (
            <>
              <hr className="border-stone-200 dark:border-zinc-700" />
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                {'\uD83D\uDCAC'} {citationNote}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CitationBlock
 *
 * Collapsible citation block rendered below an AI message bubble.
 * Default state: expanded (shows sources + note).
 * Collapsed: single-line pill.
 *
 * Requirements: INLINE-02, INLINE-03, ANNO-06, ANNO-10, ANNO-11, ANNO-12
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
  const [expanded, setExpanded] = useState(true);
  const { sources, citationNote } = annotation;
  const count = sources.length;

  return (
    <div
      className="mt-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm animate-slide-up-fade"
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
          {/* Source rows with favicons and domain badges */}
          {sources.map((source, i) => {
            let domain: string;
            try {
              domain = new URL(source.url).hostname;
            } catch {
              domain = source.domain;
            }
            return (
              <div key={i} className="flex items-start gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                  alt=""
                  width={16}
                  height={16}
                  className="flex-shrink-0 mt-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                    title={source.title}
                    aria-label={`Source: ${source.title}`}
                  >
                    {source.title}
                  </a>
                  {source.snippet && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {source.snippet.length > 120 ? source.snippet.slice(0, 120) + '...' : source.snippet}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  data-testid="domain-badge"
                >
                  {domain}
                </span>
              </div>
            );
          })}

          {/* Citation note as soft callout */}
          {citationNote && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3 mt-2" data-testid="citation-callout">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic flex items-start gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                {citationNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

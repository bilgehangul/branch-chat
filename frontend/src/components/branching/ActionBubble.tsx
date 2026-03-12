/**
 * ActionBubble component
 *
 * Floating action menu that appears after text selection. Positioned 8px above
 * the selection using position:absolute inside the content wrapper (scrolls with text).
 *
 * Requirements: BRANCH-02, BRANCH-03, BRANCH-12, INLINE-01, INLINE-05
 *
 * CRITICAL: All buttons call event.preventDefault() on mousedown to prevent
 * focus steal that collapses the browser selection before click handler fires.
 * anchorText/paragraphId/messageId are read from props (captured at selection
 * time), NOT from window.getSelection() at click time.
 */

import { useEffect, useRef, useState } from 'react';

type BubbleMode = 'default' | 'simplify';
type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

const SIMPLIFY_MODES: { key: SimplifyMode; label: string; tooltip: string }[] = [
  { key: 'simpler',   label: 'Simpler',   tooltip: 'Uses shorter sentences and simpler words' },
  { key: 'example',  label: 'Example',   tooltip: 'Explains using a concrete real-world example' },
  { key: 'analogy',  label: 'Analogy',   tooltip: 'Uses an analogy to something familiar' },
  { key: 'technical', label: 'Technical', tooltip: 'Adds technical depth and precise terminology' },
];

export interface ActionBubbleProps {
  bubble: {
    anchorText: string;
    paragraphId: string;
    messageId: string;
    top: number;
    left: number;
  };
  isAtMaxDepth: boolean;
  /** When true, bubble renders below the selection instead of above */
  flipped?: boolean;
  onGoDeeper: (anchorText: string, paragraphId: string) => void;
  onFindSources: (anchorText: string, paragraphId: string, messageId: string) => void;
  onSimplify: (anchorText: string, paragraphId: string, messageId: string, mode: SimplifyMode) => void;
  onDismiss: () => void;
}

export function ActionBubble({
  bubble,
  isAtMaxDepth,
  flipped = false,
  onGoDeeper,
  onFindSources,
  onSimplify,
  onDismiss,
}: ActionBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<BubbleMode>('default');

  // Reset mode when selection changes to a new paragraph
  useEffect(() => {
    setMode('default');
  }, [bubble.paragraphId]);

  // Dismiss when clicking outside the bubble.
  // Guard: if the user clicked within a message element to adjust their selection,
  // give the browser a tick to finalize selection state before deciding to dismiss.
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        // Don't dismiss if the user is clicking within a message element to adjust their selection.
        // Give the browser a tick to finalize the new selection state, then check.
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) {
            onDismiss();
          }
          // If selection is still non-collapsed, the user re-selected text — keep bubble alive.
          // The useTextSelection mouseup handler will update bubble position if needed.
        }, 0);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onDismiss]);

  const goDeeperBaseClass =
    'flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors';
  const goDeeperDisabledClass =
    'flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium opacity-50 cursor-not-allowed';
  const secondaryClass =
    'flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors';
  const modeButtonClass =
    'px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors';
  const backButtonClass =
    'px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-xs transition-colors';

  return (
    <div
      ref={bubbleRef}
      data-action-bubble
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-50 flex flex-col gap-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-2"
      style={{
        top: bubble.top,
        left: bubble.left,
        transform: flipped ? 'translateY(8px)' : 'translateY(calc(-100% - 8px))',
        userSelect: 'none',
      }}
    >
      {mode === 'default' ? (
        <>
          {/* Go Deeper — primary action */}
          <button
            className={isAtMaxDepth ? goDeeperDisabledClass : goDeeperBaseClass}
            disabled={isAtMaxDepth}
            title={isAtMaxDepth ? 'Maximum depth reached' : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onGoDeeper(bubble.anchorText, bubble.paragraphId)}
          >
            &#8594; Go Deeper
          </button>

          {/* Find Sources — enabled in Phase 5 */}
          <button
            className={secondaryClass}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onFindSources(bubble.anchorText, bubble.paragraphId, bubble.messageId); onDismiss(); }}
          >
            &#128269; Find Sources
          </button>

          {/* Simplify — enters expand mode */}
          <button
            className={secondaryClass}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode('simplify')}
          >
            &#10022; Simplify
          </button>
        </>
      ) : (
        <>
          {/* Back arrow: returns to default mode */}
          <button
            className={backButtonClass}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode('default')}
          >
            &larr; Back
          </button>

          {/* 4 simplify mode buttons in a 2x2 grid */}
          <div className="grid grid-cols-2 gap-1">
            {SIMPLIFY_MODES.map(({ key, label, tooltip }) => (
              <button
                key={key}
                className={modeButtonClass}
                title={tooltip}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSimplify(bubble.anchorText, bubble.paragraphId, bubble.messageId, key);
                  onDismiss();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

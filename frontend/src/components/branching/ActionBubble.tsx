/**
 * ActionBubble component
 *
 * Floating action menu that appears after text selection. Positioned 8px above
 * the top-right of the selection using position:fixed.
 *
 * Requirements: BRANCH-02, BRANCH-03, BRANCH-12
 *
 * CRITICAL: All buttons call event.preventDefault() on mousedown to prevent
 * focus steal that collapses the browser selection before click handler fires.
 * anchorText/paragraphId are read from props (captured at selection time), NOT
 * from window.getSelection() at click time.
 */

import { useEffect, useRef } from 'react';

export interface ActionBubbleProps {
  bubble: {
    anchorText: string;
    paragraphId: string;
    top: number;
    left: number;
  };
  isAtMaxDepth: boolean;
  onGoDeeper: (anchorText: string, paragraphId: string) => void;
  onDismiss: () => void;
}

export function ActionBubble({ bubble, isAtMaxDepth, onGoDeeper, onDismiss }: ActionBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        onDismiss();
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
    'flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-700 text-zinc-400 text-sm opacity-60 cursor-not-allowed';

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 flex flex-col gap-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2"
      style={{
        top: bubble.top,
        left: bubble.left,
        transform: 'translateY(calc(-100% - 8px))',
      }}
    >
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

      {/* Find Sources — secondary, disabled in Phase 4 */}
      <button
        className={secondaryClass}
        disabled
        onMouseDown={(e) => e.preventDefault()}
      >
        &#128269; Find Sources
      </button>

      {/* Simplify — secondary, disabled in Phase 4 */}
      <button
        className={secondaryClass}
        disabled
        onMouseDown={(e) => e.preventDefault()}
      >
        &#10022; Simplify
      </button>
    </div>
  );
}

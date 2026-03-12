/**
 * HighlightOverlay component
 *
 * Renders semi-transparent colored rectangles over selected text using absolute
 * positioning within the scroll container's content wrapper. This replaces
 * the unreliable native Range save/restore approach with a CSS overlay that
 * persists independently of browser selection and React re-renders.
 *
 * Supports per-annotation-type highlight colors: amber for sources,
 * indigo for simplification, teal for go-deeper, blue for default selection.
 *
 * The overlay divs use pointer-events-none so they don't interfere with
 * text selection or clicks.
 */

import type { SelectionRect } from '../../hooks/useTextSelection';

/** Per-annotation-type highlight colors — "highlighter pen" feel */
const HIGHLIGHT_COLORS: Record<string, string> = {
  source: 'rgba(245, 158, 11, 0.25)',       // amber-500 at 25% — gold highlighter
  simplification: 'rgba(99, 102, 241, 0.2)', // indigo-500 at 20% — purple highlighter
  'go-deeper': 'rgba(20, 184, 166, 0.2)',    // teal-500 at 20% — teal highlighter
  default: 'rgba(59, 130, 246, 0.25)',        // blue-500 at 25% — current color
};

interface HighlightOverlayProps {
  rects: SelectionRect[];
  annotationType?: 'source' | 'simplification' | 'go-deeper';
}

export function HighlightOverlay({ rects, annotationType }: HighlightOverlayProps) {
  if (rects.length === 0) return null;

  const bgColor = HIGHLIGHT_COLORS[annotationType ?? 'default'] ?? HIGHLIGHT_COLORS.default;

  return (
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-sm"
          style={{
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: bgColor,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}

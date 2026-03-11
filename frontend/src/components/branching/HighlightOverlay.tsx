/**
 * HighlightOverlay component
 *
 * Renders semi-transparent blue rectangles over selected text using absolute
 * positioning within the scroll container's content wrapper. This replaces
 * the unreliable native Range save/restore approach with a CSS overlay that
 * persists independently of browser selection and React re-renders.
 *
 * The overlay divs use pointer-events-none so they don't interfere with
 * text selection or clicks.
 */

import type { SelectionRect } from '../../hooks/useTextSelection';

interface HighlightOverlayProps {
  rects: SelectionRect[];
}

export function HighlightOverlay({ rects }: HighlightOverlayProps) {
  if (rects.length === 0) return null;
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
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}

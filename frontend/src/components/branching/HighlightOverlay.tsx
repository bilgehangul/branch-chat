/**
 * HighlightOverlay component
 *
 * Renders semi-transparent colored rectangles over selected text using
 * position:fixed (rendered via React Portal to document.body). Converts
 * scroll-container-relative rects to viewport coordinates using scrollRef.
 *
 * Supports per-annotation-type highlight colors: amber for sources,
 * indigo for simplification, teal for go-deeper, blue for default selection.
 *
 * The overlay divs use pointer-events-none so they don't interfere with
 * text selection or clicks.
 */

import type { RefObject } from 'react';
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
  scrollRef?: RefObject<HTMLElement | null>;
}

export function HighlightOverlay({ rects, annotationType, scrollRef }: HighlightOverlayProps) {
  if (rects.length === 0) return null;

  const bgColor = HIGHLIGHT_COLORS[annotationType ?? 'default'] ?? HIGHLIGHT_COLORS.default;

  // Convert scroll-container-relative rects to viewport coords
  const container = scrollRef?.current;
  const containerRect = container?.getBoundingClientRect();
  const scrollTop = container?.scrollTop ?? 0;
  const scrollLeft = container?.scrollLeft ?? 0;

  // If we have a scrollRef, convert rects to viewport coords; otherwise use as-is
  const viewportRects = rects.map((r) => {
    if (containerRect) {
      return {
        top: containerRect.top + r.top - scrollTop,
        left: containerRect.left + r.left - scrollLeft,
        width: r.width,
        height: r.height,
      };
    }
    return r;
  });

  // Clip to viewport bounds — only render rects visible on screen
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const visibleRects = viewportRects.filter(
    (r) => r.top < viewportHeight && r.top + r.height > 0 && r.left < viewportWidth && r.left + r.width > 0
  );

  if (visibleRects.length === 0) return null;

  return (
    <>
      {visibleRects.map((r, i) => (
        <div
          key={i}
          className="pointer-events-none rounded-sm"
          style={{
            position: 'fixed',
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: bgColor,
            zIndex: 40,
          }}
        />
      ))}
    </>
  );
}

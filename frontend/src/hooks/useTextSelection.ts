/**
 * useTextSelection hook
 *
 * Attaches a mouseup listener to the container ref. On mouseup, validates
 * the current browser selection (single-block only) and surfaces bubble state
 * { anchorText, paragraphId, messageId, top, left, selectionRects } for upstream consumers.
 *
 * CRITICAL: anchorText is captured in the mouseup handler, NOT at click time,
 * because the browser collapses the selection when a bubble button receives focus.
 *
 * The selectionRects array stores DOMRect coordinates relative to the scroll container,
 * enabling a CSS overlay highlight that persists independently of browser selection
 * and React re-renders.
 *
 * Requirements: BRANCH-01, BRANCH-02
 */

import { type RefObject, useState, useEffect } from 'react';

export interface SelectionState {
  anchorText: string;
  paragraphId: string;
  messageId: string;   // id of the Message that contains the selected paragraph
  top: number;         // viewport-relative Y (for fixed positioning)
  left: number;        // viewport-relative X, centered and clamped
}

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>
): { bubble: SelectionState | null; clearBubble: () => void } {
  const [bubble, setBubble] = useState<SelectionState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleMouseUp() {
      // Wrap in setTimeout to let browser finalize selection state
      setTimeout(() => {
        const sel = window.getSelection();

        // Validate: must have a non-collapsed, non-whitespace selection
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setBubble(null);
          return;
        }

        const range = sel.getRangeAt(0);

        // Find the enclosing block with data-paragraph-id for both anchor and focus
        const anchorNode = sel.anchorNode as HTMLElement | null;
        const focusNode = sel.focusNode as HTMLElement | null;

        // Text nodes don't have closest() — walk up via parentElement if needed
        const anchorEl = anchorNode?.closest
          ? anchorNode
          : (anchorNode as unknown as Node)?.parentElement;
        const focusEl = focusNode?.closest
          ? focusNode
          : (focusNode as unknown as Node)?.parentElement;

        const anchorBlock = (anchorEl as HTMLElement | null)?.closest?.('[data-paragraph-id]') as HTMLElement | null;
        const focusBlock = (focusEl as HTMLElement | null)?.closest?.('[data-paragraph-id]') as HTMLElement | null;

        // At least the anchor block must exist
        if (!anchorBlock || !focusBlock) {
          setBubble(null);
          return;
        }

        // Both blocks must be in the same message container
        const anchorMessage = anchorBlock.closest('[data-message-id]');
        const focusMessage = focusBlock.closest('[data-message-id]');
        if (!anchorMessage || !focusMessage || anchorMessage !== focusMessage) {
          setBubble(null);
          return;
        }

        // Only trigger ActionBubble for assistant messages (TSEL-01, TSEL-02)
        const role = anchorMessage.getAttribute('data-message-role');
        if (role !== 'assistant') {
          setBubble(null);
          return;
        }

        // Skip selection within no-selection zones (e.g. ContextCard) (TSEL-03)
        const anchorNoSel = (anchorEl as HTMLElement)?.closest?.('[data-no-selection]');
        const focusNoSel = (focusEl as HTMLElement)?.closest?.('[data-no-selection]');
        if (anchorNoSel || focusNoSel) {
          setBubble(null);
          return;
        }

        const messageId = anchorMessage.getAttribute('data-message-id') ?? '';

        // For cross-paragraph selections, use the first (lowest-index) paragraph as the anchor.
        // This is where the annotation block will be inserted below.
        const anchorParagraphId = anchorBlock.getAttribute('data-paragraph-id') ?? '0';
        const focusParagraphId = focusBlock.getAttribute('data-paragraph-id') ?? '0';
        const paragraphId =
          Number(anchorParagraphId) <= Number(focusParagraphId)
            ? anchorParagraphId
            : focusParagraphId;
        const anchorText = sel.toString().trim();
        const rect = range.getBoundingClientRect();

        // Center bubble horizontally over selection, clamped within viewport
        const rawLeft = rect.left + rect.width / 2;
        const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - 200));

        setBubble({
          anchorText,
          paragraphId,
          messageId,
          top: rect.top,
          left: clampedLeft,
        });
      }, 0);
    }

    el.addEventListener('mouseup', handleMouseUp);
    return () => {
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  // Keep bubble aligned to selected text while user performs small scroll/resize.
  useEffect(() => {
    if (!bubble) return;
    const container = containerRef.current;
    if (!container) return;

    function updateBubblePositionFromSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setBubble(null);
        return;
      }
      if (sel.rangeCount === 0) return;

      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const rawLeft = rect.left + rect.width / 2;
      const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - 200));

      setBubble((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          top: rect.top,
          left: clampedLeft,
        };
      });
    }

    container.addEventListener('scroll', updateBubblePositionFromSelection, { passive: true });
    window.addEventListener('resize', updateBubblePositionFromSelection);
    return () => {
      container.removeEventListener('scroll', updateBubblePositionFromSelection);
      window.removeEventListener('resize', updateBubblePositionFromSelection);
    };
  }, [bubble, containerRef]);

  return {
    bubble,
    clearBubble: () => {
      setBubble(null);
    },
  };
}

/**
 * useTextSelection hook
 *
 * Attaches a mouseup listener to the container ref. On mouseup, validates
 * the current browser selection (single-block only) and surfaces bubble state
 * { anchorText, paragraphId, messageId, top, left } for upstream consumers.
 *
 * CRITICAL: anchorText is captured in the mouseup handler, NOT at click time,
 * because the browser collapses the selection when a bubble button receives focus.
 *
 * Requirements: BRANCH-01, BRANCH-02
 */

import React, { useState, useEffect } from 'react';

export interface SelectionState {
  anchorText: string;
  paragraphId: string;
  messageId: string;   // id of the Message that contains the selected paragraph
  top: number;         // viewport-relative from getBoundingClientRect().top
  left: number;        // viewport-relative from getBoundingClientRect().right
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLElement | null>
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

        // Cross-block or missing block: clear selection and reject
        if (!anchorBlock || !focusBlock || anchorBlock !== focusBlock) {
          sel.removeAllRanges();
          setBubble(null);
          return;
        }

        // Walk up from the paragraph block to find the enclosing message element
        const messageEl = anchorBlock.closest('[data-message-id]');
        const messageId = messageEl?.getAttribute('data-message-id') ?? '';

        const paragraphId = anchorBlock.getAttribute('data-paragraph-id') ?? '0';
        const anchorText = sel.toString().trim();
        const rect = range.getBoundingClientRect();

        setBubble({
          anchorText,
          paragraphId,
          messageId,
          top: rect.top,
          left: rect.right,
        });
      }, 0);
    }

    el.addEventListener('mouseup', handleMouseUp);
    return () => {
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  return {
    bubble,
    clearBubble: () => setBubble(null),
  };
}

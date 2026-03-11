/**
 * Tests for useTextSelection hook
 * Requirements: BRANCH-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../../src/hooks/useTextSelection';

function makeContainerRef(el: HTMLElement) {
  return { current: el } as React.RefObject<HTMLElement | null>;
}

describe('useTextSelection', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    // Mock container geometry for selectionRects calculation
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 100, left: 50, right: 850, bottom: 600, width: 800, height: 500 }),
      configurable: true,
    });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(container, 'scrollLeft', { value: 0, writable: true, configurable: true });
    document.body.appendChild(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('returns null bubble initially', () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));
    expect(result.current.bubble).toBeNull();
  });

  it('returns null for collapsed selection (single click)', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    // Mock collapsed selection
    vi.stubGlobal('getSelection', () => ({
      isCollapsed: true,
      toString: () => '',
      getRangeAt: () => null,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      // Wait for setTimeout(fn, 0)
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).toBeNull();
  });

  it('returns null for whitespace-only selection', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => '   ',
      getRangeAt: () => null,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).toBeNull();
  });

  it('returns null (no bubble) for cross-block selection but preserves the selection', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const block1 = document.createElement('p');
    block1.setAttribute('data-paragraph-id', '0');
    const block2 = document.createElement('p');
    block2.setAttribute('data-paragraph-id', '1');
    container.appendChild(block1);
    container.appendChild(block2);

    const removeAllRanges = vi.fn();

    const mockRange = {
      getBoundingClientRect: () => ({ top: 100, right: 200, bottom: 120, left: 10, width: 190, height: 20 }),
      getClientRects: () => [
        { top: 100, left: 10, width: 190, height: 20 },
      ],
    };
    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'cross block text',
      anchorNode: block1,
      focusNode: block2,
      removeAllRanges,
      getRangeAt: () => mockRange,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Selection is preserved (not cleared) so user can still copy text
    expect(removeAllRanges).not.toHaveBeenCalled();
    // But bubble does not appear for cross-block selections
    expect(result.current.bubble).toBeNull();
  });

  it('returns bubble state with selectionRects for valid single-block selection', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    // Build DOM: container > msgEl[data-message-id] > paraEl[data-paragraph-id] > textNode
    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-1');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '2');
    const textNode = document.createTextNode('Selected text');
    paraEl.appendChild(textNode);
    msgEl.appendChild(paraEl);
    container.appendChild(msgEl);

    const mockRect = { top: 150, right: 300, bottom: 170, left: 50, width: 250, height: 20 };
    // getClientRects returns viewport-relative rects; hook converts to container-relative
    const mockClientRects = [
      { top: 150, left: 50, width: 250, height: 20 },
      { top: 170, left: 50, width: 120, height: 20 },
    ];
    const mockRange = {
      getBoundingClientRect: () => mockRect,
      getClientRects: () => mockClientRects,
    };

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'Selected text',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).not.toBeNull();
    expect(result.current.bubble?.anchorText).toBe('Selected text');
    expect(result.current.bubble?.paragraphId).toBe('2');
    expect(result.current.bubble?.messageId).toBe('msg-1');
    expect(result.current.bubble?.top).toBe(150);
    // left = rect.left + rect.width / 2 = 50 + 125 = 175
    expect(result.current.bubble?.left).toBe(175);

    // selectionRects: container offset is {top:100, left:50}, scrollTop=0, scrollLeft=0
    // So relative coords: rect.top - 100, rect.left - 50
    expect(result.current.bubble?.selectionRects).toEqual([
      { top: 50, left: 0, width: 250, height: 20 },
      { top: 70, left: 0, width: 120, height: 20 },
    ]);
  });

  it('computes selectionRects accounting for scroll offset', async () => {
    // Set container scroll offset
    Object.defineProperty(container, 'scrollTop', { value: 200, writable: true, configurable: true });
    Object.defineProperty(container, 'scrollLeft', { value: 30, writable: true, configurable: true });

    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-scroll');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('Scrolled text');
    paraEl.appendChild(textNode);
    msgEl.appendChild(paraEl);
    container.appendChild(msgEl);

    const mockRect = { top: 120, right: 250, bottom: 140, left: 80, width: 170, height: 20 };
    const mockClientRects = [
      { top: 120, left: 80, width: 170, height: 20 },
    ];
    const mockRange = {
      getBoundingClientRect: () => mockRect,
      getClientRects: () => mockClientRects,
    };

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'Scrolled text',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // container rect: {top:100, left:50}, scrollTop=200, scrollLeft=30
    // relativeTop = 120 - 100 + 200 = 220
    // relativeLeft = 80 - 50 + 30 = 60
    expect(result.current.bubble?.selectionRects).toEqual([
      { top: 220, left: 60, width: 170, height: 20 },
    ]);
  });

  it('clearBubble sets bubble back to null', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-2');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('Some text');
    paraEl.appendChild(textNode);
    msgEl.appendChild(paraEl);
    container.appendChild(msgEl);

    const mockRange = {
      getBoundingClientRect: () => ({ top: 100, right: 200, left: 100, width: 100, height: 20 }),
      getClientRects: () => [
        { top: 100, left: 100, width: 100, height: 20 },
      ],
    };
    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'Some text',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).not.toBeNull();

    act(() => {
      result.current.clearBubble();
    });

    expect(result.current.bubble).toBeNull();
  });

  it('returns null when no data-message-id ancestor exists', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    // No data-message-id ancestor — just a paragraph directly in container
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('Text without message');
    paraEl.appendChild(textNode);
    container.appendChild(paraEl);

    const mockRange = {
      getBoundingClientRect: () => ({ top: 50, right: 100, left: 50, width: 50, height: 20 }),
      getClientRects: () => [
        { top: 50, left: 50, width: 50, height: 20 },
      ],
    };
    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'Text without message',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange,
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Hook requires data-message-id ancestor — returns null without one
    expect(result.current.bubble).toBeNull();
  });

  it.todo('handles selection update after bubble is shown');
  it.todo('cleans up mouseup listener on unmount');
  it.todo('handles missing containerRef gracefully');
});

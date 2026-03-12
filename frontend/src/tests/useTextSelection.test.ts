/**
 * Tests for role-based selection filtering in useTextSelection hook
 * Requirements: TSEL-01, TSEL-02, TSEL-03
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../hooks/useTextSelection';

function makeContainerRef(el: HTMLElement) {
  return { current: el } as React.RefObject<HTMLElement | null>;
}

function mockRange(anchorNode: Node) {
  return {
    getBoundingClientRect: () => ({ top: 150, right: 300, bottom: 170, left: 50, width: 250, height: 20 }),
    getClientRects: () => [{ top: 150, left: 50, width: 250, height: 20 }],
  };
}

describe('useTextSelection — role-based filtering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
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

  test('returns null bubble when selection is inside a user message (data-message-role="user")', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-user-1');
    msgEl.setAttribute('data-message-role', 'user');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('User text here');
    paraEl.appendChild(textNode);
    msgEl.appendChild(paraEl);
    container.appendChild(msgEl);

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'User text here',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange(textNode),
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).toBeNull();
  });

  test('returns bubble state when selection is inside an assistant message (data-message-role="assistant")', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-ai-1');
    msgEl.setAttribute('data-message-role', 'assistant');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('Assistant text here');
    paraEl.appendChild(textNode);
    msgEl.appendChild(paraEl);
    container.appendChild(msgEl);

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'Assistant text here',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange(textNode),
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).not.toBeNull();
    expect(result.current.bubble?.anchorText).toBe('Assistant text here');
    expect(result.current.bubble?.messageId).toBe('msg-ai-1');
  });

  test('returns null when selection is inside a data-no-selection zone', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msgEl = document.createElement('div');
    msgEl.setAttribute('data-message-id', 'msg-ai-2');
    msgEl.setAttribute('data-message-role', 'assistant');
    const noSelZone = document.createElement('div');
    noSelZone.setAttribute('data-no-selection', '');
    const paraEl = document.createElement('p');
    paraEl.setAttribute('data-paragraph-id', '0');
    const textNode = document.createTextNode('No selection text');
    paraEl.appendChild(textNode);
    noSelZone.appendChild(paraEl);
    msgEl.appendChild(noSelZone);
    container.appendChild(msgEl);

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'No selection text',
      anchorNode: textNode,
      focusNode: textNode,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange(textNode),
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).toBeNull();
  });

  test('returns null when selection spans across two different messages', async () => {
    const ref = makeContainerRef(container);
    const { result } = renderHook(() => useTextSelection(ref));

    const msg1 = document.createElement('div');
    msg1.setAttribute('data-message-id', 'msg-1');
    msg1.setAttribute('data-message-role', 'assistant');
    const para1 = document.createElement('p');
    para1.setAttribute('data-paragraph-id', '0');
    const text1 = document.createTextNode('First message text');
    para1.appendChild(text1);
    msg1.appendChild(para1);

    const msg2 = document.createElement('div');
    msg2.setAttribute('data-message-id', 'msg-2');
    msg2.setAttribute('data-message-role', 'assistant');
    const para2 = document.createElement('p');
    para2.setAttribute('data-paragraph-id', '0');
    const text2 = document.createTextNode('Second message text');
    para2.appendChild(text2);
    msg2.appendChild(para2);

    container.appendChild(msg1);
    container.appendChild(msg2);

    vi.stubGlobal('getSelection', () => ({
      isCollapsed: false,
      toString: () => 'First message text Second message text',
      anchorNode: text1,
      focusNode: text2,
      removeAllRanges: vi.fn(),
      getRangeAt: () => mockRange(text1),
    }));

    await act(async () => {
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.bubble).toBeNull();
  });
});

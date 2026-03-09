import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { ActionBubble } from '../components/branching/ActionBubble';

const defaultBubble = {
  anchorText: 'quantum entanglement',
  paragraphId: 'para-3',
  messageId: 'msg-abc',
  top: 200,
  left: 400,
};

function renderBubble(overrides: Partial<Parameters<typeof ActionBubble>[0]> = {}) {
  const onGoDeeper = vi.fn();
  const onFindSources = vi.fn();
  const onSimplify = vi.fn();
  const onDismiss = vi.fn();

  const { rerender } = render(
    <ActionBubble
      bubble={defaultBubble}
      isAtMaxDepth={false}
      onGoDeeper={onGoDeeper}
      onFindSources={onFindSources}
      onSimplify={onSimplify}
      onDismiss={onDismiss}
      {...overrides}
    />
  );

  return { rerender, onGoDeeper, onFindSources, onSimplify, onDismiss };
}

describe('ActionBubble — default mode', () => {
  test('Find Sources button is enabled and calls onFindSources with anchorText, paragraphId, messageId', () => {
    const { onFindSources } = renderBubble();
    const btn = screen.getByRole('button', { name: /find sources/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onFindSources).toHaveBeenCalledWith('quantum entanglement', 'para-3', 'msg-abc');
  });

  test('Find Sources button calls e.preventDefault() on mousedown', () => {
    renderBubble();
    const btn = screen.getByRole('button', { name: /find sources/i });
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    btn.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test('Simplify button is enabled and enters simplify mode showing 4 mode buttons', () => {
    renderBubble();
    const simplifyBtn = screen.getByRole('button', { name: /simplify/i });
    expect(simplifyBtn).not.toBeDisabled();
    fireEvent.click(simplifyBtn);
    // Default 3 buttons should be gone
    expect(screen.queryByRole('button', { name: /find sources/i })).toBeNull();
    // 4 mode buttons should appear
    expect(screen.getByRole('button', { name: /simpler/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /example/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analogy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /technical/i })).toBeInTheDocument();
  });
});

describe('ActionBubble — simplify mode', () => {
  function enterSimplifyMode() {
    const fns = renderBubble();
    const simplifyBtn = screen.getByRole('button', { name: /simplify/i });
    fireEvent.click(simplifyBtn);
    return fns;
  }

  test('back arrow in simplify mode returns to default 3-button view', () => {
    enterSimplifyMode();
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    // Should show default buttons again
    expect(screen.getByRole('button', { name: /find sources/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simplify/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /simpler/i })).toBeNull();
  });

  test('mode resets to default when paragraphId prop changes', () => {
    const { rerender, onFindSources, onSimplify, onGoDeeper, onDismiss } = renderBubble();
    // Enter simplify mode
    fireEvent.click(screen.getByRole('button', { name: /simplify/i }));
    expect(screen.getByRole('button', { name: /simpler/i })).toBeInTheDocument();

    // Change paragraphId
    rerender(
      <ActionBubble
        bubble={{ ...defaultBubble, paragraphId: 'para-9' }}
        isAtMaxDepth={false}
        onGoDeeper={onGoDeeper}
        onFindSources={onFindSources}
        onSimplify={onSimplify}
        onDismiss={onDismiss}
      />
    );

    // Should reset to default mode
    expect(screen.queryByRole('button', { name: /simpler/i })).toBeNull();
    expect(screen.getByRole('button', { name: /find sources/i })).toBeInTheDocument();
  });

  test('all mode buttons call e.preventDefault() on mousedown', () => {
    enterSimplifyMode();
    const modeButtons = ['simpler', 'example', 'analogy', 'technical', 'back'];
    for (const name of modeButtons) {
      const btn = screen.getByRole('button', { name: new RegExp(name, 'i') });
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      btn.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  test('clicking a mode button calls onSimplify with correct args then dismisses', () => {
    const { onSimplify, onDismiss } = enterSimplifyMode();
    fireEvent.click(screen.getByRole('button', { name: /simpler/i }));
    expect(onSimplify).toHaveBeenCalledWith('quantum entanglement', 'para-3', 'msg-abc', 'simpler');
    expect(onDismiss).toHaveBeenCalled();
  });
});

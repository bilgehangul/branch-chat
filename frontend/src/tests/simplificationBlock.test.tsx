import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { SimplificationBlock } from '../components/annotations/SimplificationBlock';
import type { Annotation } from '../types/index';

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  type: 'simplification',
  targetText: 'some selected text',
  paragraphIndex: 0,
  originalText: 'some selected text',
  replacementText: 'This is the simplified version of the text.',
  citationNote: null,
  sources: [],
  isShowingOriginal: false,
  ...overrides,
});

describe('SimplificationBlock', () => {
  test('renders header with "✎ Simplified" and mode label', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Simpler"
        onTryAnother={() => {}}
      />
    );
    expect(screen.getByText(/✎ Simplified/)).toBeTruthy();
    expect(screen.getByText(/Simpler/)).toBeTruthy();
  });

  test('renders replacement text in tinted block', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Analogy"
        onTryAnother={() => {}}
      />
    );
    expect(screen.getByText('This is the simplified version of the text.')).toBeTruthy();
  });

  test('has left border accent styling (border-l class)', () => {
    const { container } = render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Simpler"
        onTryAnother={() => {}}
      />
    );
    const block = container.firstChild as HTMLElement;
    expect(block.className).toContain('border-l');
  });

  test('"Try another mode" button calls onTryAnother callback', () => {
    const onTryAnother = vi.fn();
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Example"
        onTryAnother={onTryAnother}
      />
    );
    const btn = screen.getByText('Try another mode');
    fireEvent.click(btn);
    expect(onTryAnother).toHaveBeenCalledTimes(1);
  });

  test('"Try another mode" button calls e.preventDefault() on mousedown', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Technical"
        onTryAnother={() => {}}
      />
    );
    const btn = screen.getByText('Try another mode');
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    btn.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

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
        onSelectMode={() => {}}
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
        onSelectMode={() => {}}
      />
    );
    expect(screen.getByText('This is the simplified version of the text.')).toBeTruthy();
  });

  test('has left border accent styling (border-l class)', () => {
    const { container } = render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Simpler"
        onSelectMode={() => {}}
      />
    );
    const block = container.firstChild as HTMLElement;
    expect(block.className).toContain('border-l');
  });

  test('"Try another mode" button shows mode picker on click', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Example"
        onSelectMode={() => {}}
      />
    );
    const btn = screen.getByText('Try another mode');
    fireEvent.click(btn);
    // Mode picker should now show 4 mode buttons
    expect(screen.getByText('Simpler')).toBeTruthy();
    expect(screen.getByText('Example')).toBeTruthy();
    expect(screen.getByText('Analogy')).toBeTruthy();
    expect(screen.getByText('Technical')).toBeTruthy();
  });

  test('clicking a mode button calls onSelectMode with correct mode key', () => {
    const onSelectMode = vi.fn();
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Example"
        onSelectMode={onSelectMode}
      />
    );
    fireEvent.click(screen.getByText('Try another mode'));
    fireEvent.click(screen.getByText('Analogy'));
    expect(onSelectMode).toHaveBeenCalledWith('analogy');
  });

  test('"Try another mode" button calls e.preventDefault() on mousedown', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation()}
        modeLabel="Technical"
        onSelectMode={() => {}}
      />
    );
    const btn = screen.getByText('Try another mode');
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    btn.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

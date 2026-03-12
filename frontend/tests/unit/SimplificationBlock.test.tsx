/**
 * Tests for SimplificationBlock component
 * Requirements: ANNO-06, ANNO-07, ANNO-08, ANNO-09
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimplificationBlock } from '../../src/components/annotations/SimplificationBlock';
import type { Annotation } from '../../src/types/index';

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    type: 'simplification',
    targetText: 'Some complex text',
    paragraphIndex: 0,
    originalText: 'simpler',
    replacementText: 'A **simpler** explanation of the concept.',
    citationNote: null,
    sources: [],
    isShowingOriginal: false,
    ...overrides,
  };
}

describe('SimplificationBlock', () => {
  it('has animate-slide-up-fade class on wrapper', () => {
    const { container } = render(
      <SimplificationBlock annotation={makeAnnotation()} modeLabel="Simpler" onSelectMode={vi.fn()} />
    );
    expect(container.firstElementChild?.classList.contains('animate-slide-up-fade')).toBe(true);
  });

  it('renders mode badge with active mode name', () => {
    render(
      <SimplificationBlock annotation={makeAnnotation()} modeLabel="Technical" onSelectMode={vi.fn()} />
    );
    const badge = screen.getByTestId('mode-badge');
    expect(badge.textContent).toBe('Technical');
  });

  it('renders replacement text with MarkdownRenderer (bold text becomes <strong>)', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation({ replacementText: 'This is **bold** text.' })}
        modeLabel="Simpler"
        onSelectMode={vi.fn()}
      />
    );
    const strong = document.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('bold');
  });

  it('shows all 4 mode pills without a toggle', () => {
    render(
      <SimplificationBlock annotation={makeAnnotation()} modeLabel="Simpler" onSelectMode={vi.fn()} />
    );
    const pills = screen.getByTestId('mode-pills');
    const buttons = pills.querySelectorAll('button');
    expect(buttons.length).toBe(4);
    expect(screen.queryByText('Try another mode')).toBeNull();
  });

  it('active mode pill has filled styling', () => {
    render(
      <SimplificationBlock annotation={makeAnnotation()} modeLabel="Simpler" onSelectMode={vi.fn()} />
    );
    const pills = screen.getByTestId('mode-pills');
    const simplerBtn = Array.from(pills.querySelectorAll('button')).find(b => b.textContent === 'Simpler');
    expect(simplerBtn?.className).toContain('bg-indigo-100');
  });
});

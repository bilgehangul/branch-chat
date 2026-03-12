/**
 * Accessibility tests for interactive elements
 * Requirements: XCUT-01, XCUT-03, XCUT-05
 *
 * Verifies aria-labels and focus-visible ring classes on all interactive components.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { ActionBubble } from '../components/branching/ActionBubble';
import { SimplificationBlock } from '../components/annotations/SimplificationBlock';
import { CitationBlock } from '../components/annotations/CitationBlock';
import type { Annotation } from '../types/index';

const defaultBubble = {
  anchorText: 'test text',
  paragraphId: 'para-1',
  messageId: 'msg-1',
  top: 100,
  left: 200,
};

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  type: 'source',
  targetText: 'test text',
  paragraphIndex: 0,
  originalText: 'test text',
  replacementText: null,
  citationNote: 'A note',
  sources: [{ title: 'Source 1', url: 'https://example.com', domain: 'example.com', snippet: 'snippet' }],
  isShowingOriginal: false,
  ...overrides,
});

describe('Accessibility — aria-labels', () => {
  test('ActionBubble buttons have aria-labels in default mode', () => {
    render(
      <ActionBubble
        bubble={defaultBubble}
        isAtMaxDepth={false}
        onGoDeeper={vi.fn()}
        onFindSources={vi.fn()}
        onSimplify={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test('ActionBubble simplify mode buttons have aria-labels', () => {
    render(
      <ActionBubble
        bubble={defaultBubble}
        isAtMaxDepth={false}
        onGoDeeper={vi.fn()}
        onFindSources={vi.fn()}
        onSimplify={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    // Enter simplify mode
    fireEvent.click(screen.getByRole('button', { name: /simplify selected text/i }));
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test('SimplificationBlock buttons have aria-labels', () => {
    render(
      <SimplificationBlock
        annotation={makeAnnotation({ type: 'simplification', replacementText: 'simpler text' })}
        modeLabel="Simpler"
        onSelectMode={() => {}}
      />
    );
    // "Try another mode" button should have aria-label
    const tryBtn = screen.getByText('Try another mode');
    expect(tryBtn.getAttribute('aria-label')).toBe('Choose a different simplification mode');

    // Click to show mode picker
    fireEvent.click(tryBtn);
    const modeButtons = screen.getAllByRole('button');
    modeButtons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test('CitationBlock toggle has aria-label and aria-expanded', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    const toggle = screen.getByRole('button');
    expect(toggle.getAttribute('aria-label')).toBe('Expand sources');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-label')).toBe('Collapse sources');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('Accessibility — focus-visible ring classes', () => {
  test('ActionBubble buttons have focus-visible:ring-2 class', () => {
    const { container } = render(
      <ActionBubble
        bubble={defaultBubble}
        isAtMaxDepth={false}
        onGoDeeper={vi.fn()}
        onFindSources={vi.fn()}
        onSimplify={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:ring-2');
    });
  });

  test('SimplificationBlock buttons have focus-visible:ring-2 class', () => {
    const { container } = render(
      <SimplificationBlock
        annotation={makeAnnotation({ type: 'simplification', replacementText: 'text' })}
        modeLabel="Simpler"
        onSelectMode={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:ring-2');
    });
  });

  test('CitationBlock toggle has focus-visible:ring-2 class', () => {
    const { container } = render(<CitationBlock annotation={makeAnnotation()} />);
    const toggle = container.querySelector('button') as HTMLElement;
    expect(toggle.className).toContain('focus-visible:ring-2');
  });

  test('CitationBlock source links have focus-visible:ring-2 class', () => {
    const { container } = render(<CitationBlock annotation={makeAnnotation()} />);
    fireEvent.click(screen.getByRole('button'));
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('focus-visible:ring-2');
    });
  });
});

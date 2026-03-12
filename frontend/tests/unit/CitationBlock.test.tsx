/**
 * Tests for CitationBlock component
 * Requirements: ANNO-06, ANNO-10, ANNO-11, ANNO-12
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CitationBlock } from '../../src/components/annotations/CitationBlock';
import type { Annotation } from '../../src/types/index';

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    type: 'source',
    targetText: 'Some cited text',
    paragraphIndex: 0,
    originalText: '',
    replacementText: null,
    citationNote: 'This claim is supported by multiple academic sources.',
    sources: [
      {
        title: 'Example Research Paper',
        url: 'https://example.com/paper',
        domain: 'example.com',
        snippet: 'A snippet from the research paper that provides context for the citation.',
      },
      {
        title: 'Another Source',
        url: 'https://other.org/article',
        domain: 'other.org',
        snippet: 'Another snippet with relevant information.',
      },
    ],
    isShowingOriginal: false,
    ...overrides,
  };
}

describe('CitationBlock', () => {
  it('has animate-slide-up-fade class on wrapper', () => {
    const { container } = render(<CitationBlock annotation={makeAnnotation()} />);
    expect(container.firstElementChild?.classList.contains('animate-slide-up-fade')).toBe(true);
  });

  it('defaults to expanded state (content visible on mount)', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    // Sources should be visible without clicking
    expect(screen.getByText('Example Research Paper')).toBeTruthy();
    expect(screen.getByText('Another Source')).toBeTruthy();
  });

  it('renders favicon img with Google S2 URL', () => {
    const { container } = render(<CitationBlock annotation={makeAnnotation()} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0].src).toContain('google.com/s2/favicons');
    expect(imgs[0].src).toContain('domain=example.com');
  });

  it('renders source title as link with target="_blank"', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    const link = screen.getByRole('link', { name: /Source: Example Research Paper/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('href')).toBe('https://example.com/paper');
  });

  it('renders domain badge with hostname', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    const badges = screen.getAllByTestId('domain-badge');
    expect(badges[0].textContent).toBe('example.com');
    expect(badges[1].textContent).toBe('other.org');
  });

  it('renders citation note in callout container', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    const callout = screen.getByTestId('citation-callout');
    expect(callout.textContent).toContain('This claim is supported by multiple academic sources.');
  });
});

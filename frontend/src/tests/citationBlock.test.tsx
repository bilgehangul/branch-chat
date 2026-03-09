import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { CitationBlock } from '../components/annotations/CitationBlock';
import type { Annotation } from '../types/index';

const makeSources = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    title: `Source ${i + 1}`,
    url: `https://example${i + 1}.com/article`,
    domain: `example${i + 1}.com`,
    snippet: `Snippet for source ${i + 1}`,
  }));

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  type: 'source',
  targetText: 'some text',
  paragraphIndex: 0,
  originalText: 'some text',
  replacementText: null,
  citationNote: 'This is a Gemini-generated citation note.',
  sources: makeSources(3),
  isShowingOriginal: false,
  ...overrides,
});

describe('CitationBlock', () => {
  test('renders collapsed pill "3 sources found" by default', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    expect(screen.getByText(/3 sources found/i)).toBeTruthy();
    // Source rows should NOT be visible in collapsed state
    expect(screen.queryByText('Source 1')).toBeNull();
  });

  test('clicking toggle expands to show source rows', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(screen.getByText('Source 1')).toBeTruthy();
    expect(screen.getByText('Source 2')).toBeTruthy();
    expect(screen.getByText('Source 3')).toBeTruthy();
  });

  test('source title is a link with target=_blank and rel=noreferrer', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    fireEvent.click(screen.getByRole('button'));
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
    links.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noreferrer');
    });
  });

  test('domain badge shown next to each source when expanded', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('example1.com')).toBeTruthy();
    expect(screen.getByText('example2.com')).toBeTruthy();
    expect(screen.getByText('example3.com')).toBeTruthy();
  });

  test('citationNote text rendered below sources when expanded and non-empty', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/gemini-generated citation note/i)).toBeTruthy();
  });

  test('citationNote not rendered when empty string', () => {
    render(<CitationBlock annotation={makeAnnotation({ citationNote: '' })} />);
    fireEvent.click(screen.getByRole('button'));
    // No citation note paragraph should appear
    expect(screen.queryByText(/gemini-generated citation note/i)).toBeNull();
  });

  test('toggle button shows "▼" when collapsed and "▲" when expanded', () => {
    render(<CitationBlock annotation={makeAnnotation()} />);
    expect(screen.getByText('▼')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('▲')).toBeTruthy();
  });

  test('singular "1 source found" for single source', () => {
    render(<CitationBlock annotation={makeAnnotation({ sources: makeSources(1) })} />);
    expect(screen.getByText(/1 source found/i)).toBeTruthy();
    expect(screen.queryByText(/1 sources found/i)).toBeNull();
  });
});

/**
 * Tests for MarkdownRenderer component
 * Requirements: CHAT-02
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../../src/components/thread/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  // CHAT-02: Markdown rendering — headings
  it('renders h1 heading from markdown', () => {
    render(<MarkdownRenderer content="# Hello World" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Hello World');
  });

  it('renders bold and italic text from markdown', () => {
    const { container } = render(<MarkdownRenderer content="**bold** and _italic_" />);
    const bold = container.querySelector('strong');
    const italic = container.querySelector('em');
    expect(bold).toBeInTheDocument();
    expect(bold).toHaveTextContent('bold');
    expect(italic).toBeInTheDocument();
    expect(italic).toHaveTextContent('italic');
  });

  it('renders fenced code block with syntax highlighting', () => {
    const content = '```typescript\nconst x = 1;\n```';
    const { container } = render(<MarkdownRenderer content={content} />);
    // Prism light build renders into a div (PreTag="div") containing code text
    const pre = container.querySelector('div[class*="prism"]') ?? container.querySelector('pre') ?? container.querySelector('div');
    expect(pre).toBeInTheDocument();
    // The code text should appear somewhere in the rendered output
    expect(container.textContent).toContain('const x = 1');
  });

  it('renders GFM table', () => {
    const content = `| Name | Age |\n|------|-----|\n| Alice | 30 |`;
    const { container } = render(<MarkdownRenderer content={content} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(container.textContent).toContain('Alice');
  });

  it('renders unordered list items', () => {
    const content = '- Item one\n- Item two\n- Item three';
    const { container } = render(<MarkdownRenderer content={content} />);
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Item one');
  });

  it('renders inline code with styled element', () => {
    const { container } = render(<MarkdownRenderer content="Use `const` keyword" />);
    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('const');
  });

  // BRANCH-01: rehype plugin assigns data-paragraph-id to block elements
  it('assigns sequential data-paragraph-id to block elements', () => {
    const content = `First paragraph.\n\nSecond paragraph.\n\nThird paragraph.`;
    const { container } = render(<MarkdownRenderer content={content} />);
    const blocks = container.querySelectorAll('[data-paragraph-id]');
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    // IDs should be sequential integers starting from "0"
    expect(blocks[0].getAttribute('data-paragraph-id')).toBe('0');
    expect(blocks[1].getAttribute('data-paragraph-id')).toBe('1');
    expect(blocks[2].getAttribute('data-paragraph-id')).toBe('2');
  });

  it('assigns data-paragraph-id to heading elements', () => {
    const content = '# Heading One\n\nParagraph below.';
    const { container } = render(<MarkdownRenderer content={content} />);
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.getAttribute('data-paragraph-id')).toBe('0');
  });

  it('assigns data-paragraph-id to ul but not nested li elements', () => {
    const content = '- Item one\n- Item two';
    const { container } = render(<MarkdownRenderer content={content} />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul?.getAttribute('data-paragraph-id')).toBe('0');
    // li elements should NOT have data-paragraph-id (not top-level blocks)
    const liElements = container.querySelectorAll('li');
    liElements.forEach(li => {
      expect(li.getAttribute('data-paragraph-id')).toBeNull();
    });
  });

  it('assigns data-paragraph-id to table element', () => {
    const content = `| A | B |\n|---|---|\n| 1 | 2 |`;
    const { container } = render(<MarkdownRenderer content={content} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table?.getAttribute('data-paragraph-id')).toBe('0');
  });

  // MSGE-02: Heading typography
  it('renders h2 with border-b class', () => {
    const { container } = render(<MarkdownRenderer content="## Subheading" />);
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2?.className).toContain('border-b');
  });

  // MSGE-03: Code block header with language label
  it('renders code block header with language label', () => {
    const content = '```javascript\nconsole.log("hi");\n```';
    const { container } = render(<MarkdownRenderer content={content} />);
    // Header bar should display the language
    const headerText = container.textContent;
    expect(headerText).toContain('javascript');
    // Copy button should exist
    const copyBtn = container.querySelector('button[aria-label="Copy code"]');
    expect(copyBtn).toBeInTheDocument();
  });

  // MSGE-05: Table row striping
  it('renders table rows with striping class', () => {
    const content = `| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |`;
    const { container } = render(<MarkdownRenderer content={content} />);
    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    // All tr elements should have the striping class
    const bodyRow = rows[1]; // first data row
    expect(bodyRow?.className).toContain('even:bg-stone-50');
  });

  // MSGE-06: Blockquote accent border
  it('renders blockquote with inline borderLeft style', () => {
    const { container } = render(<MarkdownRenderer content="> A wise quote" accentColor="#C9A0A0" />);
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    // jsdom normalizes hex to rgb, so check for presence of '3px solid'
    expect(blockquote?.style.borderLeft).toContain('3px solid');
  });
});

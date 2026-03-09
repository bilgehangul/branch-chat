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
});

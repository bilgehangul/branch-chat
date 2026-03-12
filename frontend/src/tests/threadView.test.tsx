/**
 * ThreadView grid layout tests
 *
 * Tests for PILL-01 (CSS Grid 1fr auto), PILL-03 (no conditional padding),
 * and full-width spanning of non-message elements.
 */
import { vi, describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const threadViewSource = fs.readFileSync(
  path.resolve(__dirname, '../components/thread/ThreadView.tsx'),
  'utf-8'
);

describe('ThreadView - CSS Grid layout (PILL-01)', () => {
  it('uses gridTemplateColumns in contentWrapperRef', () => {
    expect(threadViewSource).toContain('gridTemplateColumns');
    // Should have 1fr auto pattern
    expect(threadViewSource).toMatch(/1fr\s+auto/);
  });

  it('has grid class on content wrapper', () => {
    expect(threadViewSource).toContain('className="grid');
  });
});

describe('ThreadView - No conditional padding (PILL-03)', () => {
  it('does not contain pr-[80px] class', () => {
    expect(threadViewSource).not.toContain('pr-[80px]');
  });

  it('does not contain pr-[140px] class', () => {
    expect(threadViewSource).not.toContain('pr-[140px]');
  });
});

describe('ThreadView - Full-width spanning elements', () => {
  it('uses col-span-full for non-message elements', () => {
    // ContextCard, empty states, bottom anchor should span full grid
    expect(threadViewSource).toContain('col-span-full');
  });
});

describe('ThreadView - No standalone GutterColumn rendering', () => {
  it('does not render GutterColumn as a standalone component with wrapperRef', () => {
    // The old pattern was <GutterColumn wrapperRef={contentWrapperRef} ... />
    // This should no longer exist since pills are now inline in MessageList
    expect(threadViewSource).not.toMatch(/GutterColumn\s*\n?\s*wrapperRef/);
    expect(threadViewSource).not.toContain('<GutterColumn');
  });
});

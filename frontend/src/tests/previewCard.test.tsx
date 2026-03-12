/**
 * Preview card auto-flip and triangle pointer tests
 *
 * Tests for PILL-06 (auto-flip), PILL-07 (triangle pointer),
 * PILL-08 (descendant pill collapse).
 */
import { vi, describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const gutterSource = fs.readFileSync(
  path.resolve(__dirname, '../components/branching/GutterColumn.tsx'),
  'utf-8'
);

describe('Preview card - Auto-flip positioning (PILL-06)', () => {
  it('uses getBoundingClientRect for flip detection', () => {
    expect(gutterSource).toContain('getBoundingClientRect');
  });

  it('checks against window.innerHeight for viewport bottom detection', () => {
    expect(gutterSource).toContain('innerHeight');
  });

  it('has flipAbove state variable', () => {
    expect(gutterSource).toContain('flipAbove');
  });

  it('uses bottom-full positioning when card flips above', () => {
    expect(gutterSource).toContain('bottom-full');
  });

  it('uses top-full positioning when card is below (default)', () => {
    expect(gutterSource).toContain('top-full');
  });
});

describe('Preview card - CSS triangle pointer (PILL-07)', () => {
  it('has upward-pointing triangle using border-b classes', () => {
    // Upward triangle: border-b-[6px] with transparent left/right
    expect(gutterSource).toContain('border-b-[6px]');
    expect(gutterSource).toContain('border-l-[6px]');
    expect(gutterSource).toContain('border-r-[6px]');
  });

  it('has downward-pointing triangle using border-t classes for flipped state', () => {
    // Downward triangle: border-t-[6px] with transparent left/right
    expect(gutterSource).toContain('border-t-[6px]');
  });

  it('uses -top-[6px] positioning for upward triangle', () => {
    expect(gutterSource).toContain('-top-[6px]');
  });

  it('uses -bottom-[6px] positioning for downward triangle', () => {
    expect(gutterSource).toContain('-bottom-[6px]');
  });
});

describe('Descendant pills - Collapse by default (PILL-08)', () => {
  it('uses max-h-0 for collapsed descendant pills', () => {
    expect(gutterSource).toContain('max-h-0');
  });

  it('uses overflow-hidden for collapsed state', () => {
    expect(gutterSource).toContain('overflow-hidden');
  });

  it('uses max-h transition for slide-down animation', () => {
    expect(gutterSource).toMatch(/transition.*max-height|transition-\[max-height\]/);
  });

  it('expands to a max-height value when hovered', () => {
    // Should have a max-h value like max-h-[200px] for expanded state
    expect(gutterSource).toMatch(/max-h-\[\d+px\]/);
  });
});

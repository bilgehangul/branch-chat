import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionBubble } from '../../src/components/branching/ActionBubble';

const defaultBubble = {
  anchorText: 'selected text',
  paragraphId: '3',
  top: 200,
  left: 400,
};

const defaultProps = {
  bubble: defaultBubble,
  isAtMaxDepth: false,
  onGoDeeper: vi.fn(),
  onDismiss: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActionBubble', () => {
  // BRANCH-02: positioning and timing
  it('renders at correct fixed position (top: bubble.top, left: bubble.left)', () => {
    const { container } = render(<ActionBubble {...defaultProps} />);
    const bubbleEl = container.firstChild as HTMLElement;
    expect(bubbleEl.style.top).toBe('200px');
    expect(bubbleEl.style.left).toBe('400px');
  });

  it('applies transform translateY(calc(-100% - 8px)) for 8px above selection', () => {
    const { container } = render(<ActionBubble {...defaultProps} />);
    const bubbleEl = container.firstChild as HTMLElement;
    expect(bubbleEl.style.transform).toBe('translateY(calc(-100% - 8px))');
  });

  // BRANCH-03: three action buttons
  it('renders Go Deeper button with primary accent style', () => {
    render(<ActionBubble {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /go deeper/i });
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('bg-blue-600');
  });

  it('renders Find Sources button with secondary/ghost style', () => {
    render(<ActionBubble {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /find sources/i });
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('bg-zinc-700');
  });

  it('renders Simplify button with secondary/ghost style', () => {
    render(<ActionBubble {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /simplify/i });
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('bg-zinc-700');
  });

  it('Find Sources button is disabled (Phase 5 not wired)', () => {
    render(<ActionBubble {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /find sources/i });
    expect(btn).toBeDisabled();
  });

  it('Simplify button is disabled (Phase 5 not wired)', () => {
    render(<ActionBubble {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /simplify/i });
    expect(btn).toBeDisabled();
  });

  // BRANCH-12: depth limit
  it('Go Deeper button is disabled when isAtMaxDepth is true', () => {
    render(<ActionBubble {...defaultProps} isAtMaxDepth={true} />);
    const btn = screen.getByRole('button', { name: /go deeper/i });
    expect(btn).toBeDisabled();
  });

  it('Go Deeper button shows title tooltip "Maximum depth reached" when disabled', () => {
    render(<ActionBubble {...defaultProps} isAtMaxDepth={true} />);
    const btn = screen.getByRole('button', { name: /go deeper/i });
    expect(btn.getAttribute('title')).toBe('Maximum depth reached');
  });

  it('Go Deeper button is enabled when isAtMaxDepth is false', () => {
    render(<ActionBubble {...defaultProps} isAtMaxDepth={false} />);
    const btn = screen.getByRole('button', { name: /go deeper/i });
    expect(btn).not.toBeDisabled();
  });

  // Bubble interaction
  it('calls onGoDeeper with anchorText and paragraphId when Go Deeper is clicked', () => {
    const onGoDeeper = vi.fn();
    render(<ActionBubble {...defaultProps} onGoDeeper={onGoDeeper} />);
    const btn = screen.getByRole('button', { name: /go deeper/i });
    fireEvent.click(btn);
    expect(onGoDeeper).toHaveBeenCalledOnce();
    expect(onGoDeeper).toHaveBeenCalledWith('selected text', '3');
  });

  it('calls onDismiss when clicking outside the bubble', () => {
    const onDismiss = vi.fn();
    render(
      <div>
        <ActionBubble {...defaultProps} onDismiss={onDismiss} />
        <div data-testid="outside">outside</div>
      </div>
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

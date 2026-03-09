import { describe, it } from 'vitest';

describe('ActionBubble', () => {
  // BRANCH-02: positioning and timing
  it.todo('renders at correct fixed position (top: bubble.top, left: bubble.left)');
  it.todo('applies transform translateY(calc(-100% - 8px)) for 8px above selection');

  // BRANCH-03: three action buttons
  it.todo('renders Go Deeper button with primary accent style');
  it.todo('renders Find Sources button with secondary/ghost style');
  it.todo('renders Simplify button with secondary/ghost style');
  it.todo('Find Sources button is disabled (Phase 5 not wired)');
  it.todo('Simplify button is disabled (Phase 5 not wired)');

  // BRANCH-12: depth limit
  it.todo('Go Deeper button is disabled when isAtMaxDepth is true');
  it.todo('Go Deeper button shows title tooltip "Maximum depth reached" when disabled');
  it.todo('Go Deeper button is enabled when isAtMaxDepth is false');

  // Bubble interaction
  it.todo('calls onGoDeeper with anchorText and paragraphId when Go Deeper is clicked');
  it.todo('calls onDismiss when clicking outside the bubble');
});

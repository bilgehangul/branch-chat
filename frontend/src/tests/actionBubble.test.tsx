import { test } from 'vitest';

// INLINE-01: Find Sources button calls searchSources() with anchorText
test.todo('ActionBubble: Find Sources button is enabled and calls onFindSources with anchorText and paragraphId');
test.todo('ActionBubble: Find Sources button calls e.preventDefault() on mousedown');

// INLINE-05: Simplify expands bubble in-place to 4 mode buttons + back arrow
test.todo('ActionBubble: Simplify button enters simplify mode showing 4 mode buttons');
test.todo('ActionBubble: back arrow in simplify mode returns to default 3-button view');
test.todo('ActionBubble: mode resets to default when paragraphId prop changes');
test.todo('ActionBubble: clicking outside bubble in simplify mode dismisses it entirely');

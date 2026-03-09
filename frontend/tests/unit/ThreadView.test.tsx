/**
 * Test stubs for ThreadView component
 * Requirements: NAV-06, NAV-07
 *
 * All tests use test.todo() — no implementation exists yet.
 * This file must pass (with pending stubs) before the component is implemented.
 */

import { describe, test } from 'vitest';

describe('ThreadView', () => {
  // NAV-06: Slide animation
  test.todo('applies slide-left CSS class when navigating to ancestor thread');

  // NAV-07: Scroll position persistence
  test.todo('setScrollPosition is called with current scrollTop before navigating away');
  test.todo('scroll position is restored via requestAnimationFrame when activeThreadId changes');
});

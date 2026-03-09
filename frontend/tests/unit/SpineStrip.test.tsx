/**
 * Test stubs for SpineStrip component
 * Requirements: NAV-04, NAV-05
 *
 * All tests use test.todo() — no implementation exists yet.
 * This file must pass (with pending stubs) before the component is implemented.
 */

import { describe } from 'vitest';

describe('SpineStrip', () => {
  // NAV-04: Visibility
  test.todo('renders when thread.depth >= 1');
  test.todo('does not render when thread.depth === 0');

  // NAV-05: Visual and interaction
  test.todo('displays parent thread title as vertical text');
  test.todo('applies parent thread accentColor as left border color');
  test.todo('clicking the strip calls setActiveThread with parentThreadId');
});

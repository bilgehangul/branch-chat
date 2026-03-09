/**
 * Test stubs for BreadcrumbBar component
 * Requirements: NAV-01, NAV-02, NAV-03
 *
 * All tests use test.todo() — no implementation exists yet.
 * This file must pass (with pending stubs) before the component is implemented.
 */

import { describe } from 'vitest';

describe('BreadcrumbBar', () => {
  // NAV-01: Ancestry rendering
  test.todo('renders a crumb for each thread in the ancestry chain');
  test.todo('renders "New Chat" label for root thread with no messages');

  // NAV-02: Navigation interaction
  test.todo('clicking an ancestor crumb calls setActiveThread with that thread id');
  test.todo('the current (last) crumb is not clickable');

  // NAV-03: Overflow collapse
  test.todo('collapses middle crumbs to ellipsis when ancestry.length > 3');
  test.todo('clicking ellipsis shows dropdown with all hidden crumbs');
});

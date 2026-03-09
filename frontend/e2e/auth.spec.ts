import { test, expect } from '@playwright/test';

// Flow 1: Auth — guest demo view (no Clerk network dependency in CI)
// Full implementation: plan 06-05

test.describe('auth', () => {
  test.skip('guest user sees demo view without signing in', async ({ page }) => {
    // TODO 06-05: navigate to /, assert demo view visible, assert input disabled
    void page; void expect;
  });

  test.skip('sign-in link is visible in guest view', async ({ page }) => {
    // TODO 06-05
    void page; void expect;
  });
});

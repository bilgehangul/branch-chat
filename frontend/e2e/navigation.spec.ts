import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');

// Flow 6: Multi-level navigation (breadcrumb, spine strip, depth limit)
// Full implementation: plan 06-05

test.describe('navigation', () => {
  test.skip('breadcrumb shows thread path and navigates on click', async ({ page }) => {
    void SSE_FIXTURE; void page; void expect;
  });

  test.skip('spine strip navigates to parent thread', async ({ page }) => {
    void page; void expect;
  });

  test.skip('Go Deeper is disabled at max depth', async ({ page }) => {
    void page; void expect;
  });
});

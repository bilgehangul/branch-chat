import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');

// Flow 2: Root chat with streaming + theme toggle (UI-01, UI-02)
// Full implementation: plan 06-05

test.describe('root chat + theme', () => {
  test.skip('app loads in dark mode by default (UI-01)', async ({ page }) => {
    void SSE_FIXTURE; void page; void expect;
  });

  test.skip('theme toggle switches to light mode and persists (UI-02)', async ({ page }) => {
    void page; void expect;
  });

  test.skip('root chat streaming renders AI response', async ({ page }) => {
    void page; void expect;
  });
});

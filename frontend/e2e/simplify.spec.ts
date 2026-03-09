import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');
const SIMPLIFY_FIXTURE = JSON.stringify(
  JSON.parse(readFileSync(join(__dirname, 'fixtures/simplify.json'), 'utf-8'))
);

// Flow 5: Simplify annotation
// Full implementation: plan 06-05

test.describe('simplify', () => {
  test.skip('user can simplify a paragraph', async ({ page }) => {
    void SSE_FIXTURE; void SIMPLIFY_FIXTURE; void page; void expect;
  });
});

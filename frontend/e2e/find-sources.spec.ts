import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');
const SOURCES_FIXTURE = JSON.stringify(
  JSON.parse(readFileSync(join(__dirname, 'fixtures/find-sources.json'), 'utf-8'))
);

// Flow 4: Find Sources annotation
// Full implementation: plan 06-05

test.describe('find sources', () => {
  test.skip('user can find sources for a paragraph', async ({ page }) => {
    void SSE_FIXTURE; void SOURCES_FIXTURE; void page; void expect;
  });
});

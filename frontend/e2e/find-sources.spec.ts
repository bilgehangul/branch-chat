import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');
const SOURCES_FIXTURE = readFileSync(join(__dirname, 'fixtures/find-sources.json'), 'utf-8');

// Flow 4: Find Sources annotation

test.describe('find sources', () => {
  test('user can find sources for a selected paragraph', async ({ page }) => {
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_FIXTURE,
      });
    });

    await page.route('**/api/find-sources', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: SOURCES_FIXTURE,
      });
    });

    await page.goto('/');

    // Send message and wait for response
    const textarea = page.locator('textarea[placeholder="Ask anything..."]');
    await textarea.fill('Find sources test');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=DeepDive').first()).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(textarea).toBeEnabled({ timeout: 10000 });

    // Select text and click Find Sources
    const responseEl = page.locator('.prose').first();
    const box = await responseEl.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 10);
      await page.mouse.up();
    }

    // Wait for selection handler to fire
    await page.waitForTimeout(300);

    const findSourcesBtn = page.locator('button').filter({ hasText: 'Find Sources' }).first();
    await expect(findSourcesBtn).toBeVisible({ timeout: 5000 });
    await findSourcesBtn.click();

    // CitationBlock appears collapsed with "sources found" text
    await expect(page.locator('text=sources found')).toBeVisible({ timeout: 5000 });

    // Expand the citation block to see source titles
    await page.locator('button[aria-label="Expand sources"]').click();

    // Source title from fixture should be visible
    await expect(page.locator('text=DeepDive Research Tool')).toBeVisible({ timeout: 5000 });
  });
});

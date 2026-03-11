import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');
const SIMPLIFY_FIXTURE = readFileSync(join(__dirname, 'fixtures/simplify.json'), 'utf-8');

// Flow 5: Simplify annotation

test.describe('simplify', () => {
  test('user can simplify a selected paragraph', async ({ page }) => {
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_FIXTURE,
      });
    });

    await page.route('**/api/simplify', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: SIMPLIFY_FIXTURE,
      });
    });

    await page.goto('/');

    // Send message and wait for response
    const textarea = page.locator('textarea[placeholder="Ask anything..."]');
    await textarea.fill('Simplify test');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=DeepDive').first()).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(textarea).toBeEnabled({ timeout: 10000 });

    // Select text in the response
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

    // Click Simplify button in action bubble
    const simplifyBtn = page.locator('button').filter({ hasText: 'Simplify' }).first();
    await expect(simplifyBtn).toBeVisible({ timeout: 5000 });
    await simplifyBtn.click();

    // Simplify mode picker should appear — click "Simpler"
    const simplerBtn = page.locator('button').filter({ hasText: 'Simpler' }).first();
    await expect(simplerBtn).toBeVisible({ timeout: 3000 });
    await simplerBtn.click();

    // SimplificationBlock appears with rewritten text from fixture
    await expect(page.locator('text=simplified to be easier')).toBeVisible({ timeout: 5000 });
  });
});

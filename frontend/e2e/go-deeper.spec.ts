import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');

// Flow 3: Go Deeper branching

test.describe('go deeper', () => {
  test('user can branch into a child thread via Go Deeper', async ({ page }) => {
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_FIXTURE,
      });
    });

    await page.goto('/');

    // Send a message and wait for AI response
    const textarea = page.locator('textarea[placeholder="Ask anything..."]');
    await textarea.fill('Tell me about branching');
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for AI response text to appear
    await expect(page.locator('text=ContextDive').first()).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete (textarea should re-enable)
    await expect(textarea).toBeEnabled({ timeout: 10000 });

    // Select text in the AI response using mouse drag
    // The prose div contains paragraphs with data-paragraph-id attributes
    const responseEl = page.locator('.prose').first();
    await responseEl.waitFor({ state: 'visible', timeout: 5000 });

    const box = await responseEl.boundingBox();
    if (box) {
      // Drag to select text within the response
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 10);
      await page.mouse.up();
    }

    // Wait briefly for the selection handler setTimeout(0) to fire
    await page.waitForTimeout(300);

    // Action bubble should appear — button text is "→ Go Deeper" with unicode arrow
    const goDeeperBtn = page.locator('button').filter({ hasText: 'Go Deeper' }).first();
    await expect(goDeeperBtn).toBeVisible({ timeout: 5000 });

    // Click Go Deeper
    await goDeeperBtn.click();

    // A new child thread should open — "Ask anything to begin" state or ContextCard appears
    await expect(
      page.locator('text=Ask anything to begin').or(page.locator('[data-testid="context-card"]'))
    ).toBeVisible({ timeout: 5000 });
  });
});

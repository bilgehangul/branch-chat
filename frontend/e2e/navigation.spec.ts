import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');

// Flow 6: Multi-level navigation (breadcrumb, spine strip, depth limit)

test.describe('navigation', () => {
  test('breadcrumb shows thread path and header is visible after Go Deeper', async ({ page }) => {
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
    await textarea.fill('Navigation breadcrumb test');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=ContextDive').first()).toBeVisible({ timeout: 10000 });

    // Wait for streaming to complete
    await expect(textarea).toBeEnabled({ timeout: 10000 });

    // Breadcrumb bar (header) should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Create a child thread via Go Deeper
    const responseEl = page.locator('.prose').first();
    const box = await responseEl.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 10);
      await page.mouse.up();
    }

    await page.waitForTimeout(300);

    const goDeeperBtn = page.locator('button').filter({ hasText: 'Go Deeper' }).first();
    await expect(goDeeperBtn).toBeVisible({ timeout: 5000 });
    await goDeeperBtn.click();

    // Now in child thread — header/breadcrumb still visible
    await expect(header).toBeVisible();

    // Child thread shows "Ask anything to begin" (no messages yet)
    await expect(page.locator('text=Ask anything to begin')).toBeVisible({ timeout: 5000 });
  });

  test('Go Deeper is disabled at max depth (depth 4)', async ({ page }) => {
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_FIXTURE,
      });
    });

    await page.goto('/');

    // Helper: send a message and click Go Deeper to create a child thread.
    // Returns false when at max depth (button disabled or not found).
    async function sendAndGoDeeper(): Promise<boolean> {
      const textarea = page.locator('textarea[placeholder="Ask anything..."]');
      await textarea.fill('depth test message');
      await page.getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=ContextDive').first()).toBeVisible({ timeout: 10000 });

      // Wait for streaming to complete
      await expect(textarea).toBeEnabled({ timeout: 10000 });

      const responseEl = page.locator('.prose').first();
      const box = await responseEl.boundingBox();
      if (!box) return false;

      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 10);
      await page.mouse.up();

      await page.waitForTimeout(300);

      const goDeeperBtn = page.locator('button').filter({ hasText: 'Go Deeper' }).first();

      try {
        await expect(goDeeperBtn).toBeVisible({ timeout: 3000 });
        const isDisabled = await goDeeperBtn.isDisabled();
        if (isDisabled) return false; // already at max depth
        await goDeeperBtn.click();
        return true;
      } catch {
        return false;
      }
    }

    // Navigate through 4 levels (root=0, children at 1,2,3,4 — Go Deeper disabled at depth 4)
    let canGoDeeper = true;
    for (let i = 0; i < 5 && canGoDeeper; i++) {
      canGoDeeper = await sendAndGoDeeper();
    }

    // At max depth, trigger selection to show the action bubble
    const textarea = page.locator('textarea[placeholder="Ask anything..."]');
    await textarea.fill('depth limit check');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=ContextDive').first()).toBeVisible({ timeout: 10000 });
    await expect(textarea).toBeEnabled({ timeout: 10000 });

    const responseEl = page.locator('.prose').first();
    const box = await responseEl.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 10);
      await page.mouse.up();
    }

    await page.waitForTimeout(300);

    const goDeeperBtn = page.locator('button').filter({ hasText: 'Go Deeper' }).first();
    await expect(goDeeperBtn).toBeVisible({ timeout: 5000 });
    await expect(goDeeperBtn).toBeDisabled();
  });
});

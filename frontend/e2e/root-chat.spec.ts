import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSE_FIXTURE = readFileSync(join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8');

// Flow 2: Root chat with streaming + theme (UI-01, UI-02)

test.describe('theme', () => {
  test('app renders in dark mode by default on first load (UI-01)', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.addInitScript(() => {
      localStorage.removeItem('theme');
    });
    await page.goto('/');
    // Check that <html> has .dark class
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDark).toBe(true);
  });

  test('theme toggle switches to light mode and localStorage persists (UI-02)', async ({ page }) => {
    // Start in dark mode (default)
    await page.addInitScript(() => {
      localStorage.removeItem('theme');
    });
    await page.goto('/');

    // Verify dark mode active
    const isDarkBefore = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkBefore).toBe(true);

    // Click the theme toggle (aria-label from ThemeToggle.tsx when dark: 'Switch to light mode')
    await page.getByRole('button', { name: 'Switch to light mode' }).click();

    // Verify light mode active
    const isDarkAfter = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkAfter).toBe(false);

    // Verify localStorage persisted
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('light');

    // Reload page — light theme should persist (ThemeContext reads localStorage)
    await page.reload();
    const isDarkAfterReload = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkAfterReload).toBe(false);
  });
});

test.describe('root chat streaming', () => {
  test('user can send a message and see AI response rendered', async ({ page }) => {
    // Mock the chat endpoint
    await page.route('**/api/chat', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: SSE_FIXTURE,
      });
    });

    await page.goto('/');

    // Type and send a message
    const textarea = page.locator('textarea[placeholder="Ask anything..."]');
    await textarea.fill('Hello, what is DeepDive?');

    // Click send
    await page.getByRole('button', { name: 'Send' }).click();

    // Wait for AI response to appear (fixture contains "DeepDive" text)
    await expect(page.locator('text=DeepDive').first()).toBeVisible({ timeout: 10000 });
  });
});

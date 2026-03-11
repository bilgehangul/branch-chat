import { test, expect } from '@playwright/test';

// Flow 1: Auth — guest demo view
// Strategy: AUTH-03 means unauthenticated users can use the full chat interface.
// We verify the app loads without errors (no auth wall blocking the interface).

test.describe('auth', () => {
  test('app loads and shows chat interface in guest mode', async ({ page }) => {
    await page.goto('/');
    // App should load without a full-page auth wall
    // The chat input should be visible (unauthenticated users can access full chat per AUTH-03)
    await expect(
      page.locator('textarea[placeholder="Ask anything..."]').or(
        page.locator('[data-testid="demo-chat"]')
      ).or(
        page.locator('text=Ask anything')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('page title is set', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ContextDive|frontend/);
  });
});

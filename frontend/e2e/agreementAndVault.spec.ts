import { test, expect } from '@playwright/test';

test.describe('Digital Agreement & Document Vault E2E Flow', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

  test('1. Public Agreement Verifier page loads and accepts agreement search code', async ({ page }) => {
    await page.goto(`${baseURL}/verify-agreement?num=AGR-AURORA-1001`);

    // Verify header title
    const header = page.locator('text=Verify Digital Lease Agreement');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verify search input has agreement number prefilled or allows input
    const input = page.locator('input[placeholder*="AGR-AURORA-1001"]');
    await expect(input).toBeVisible();

    const verifyBtn = page.getByRole('button', { name: /verify/i });
    await expect(verifyBtn).toBeVisible();
  });
});
